import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getTodayISO } from "../lib/dateUtils";

export const useNotesStore = create(
  persist(
    (set, get) => ({
      notes: [],
      filesOpened: [],
      user: null,

      setUser: (user) => {
        set({ user });
        if (user) {
          get().changeStorageKey(`notes-storage-${user.uid}`);
        } else {
          get().changeStorageKey("notes-storage-guest");
        }
      },

      changeStorageKey: (newKey) => {
        const data = JSON.stringify({ state: get() });
        localStorage.setItem(newKey, data);
      },

      syncToFirestore: async () => {
        const { user, notes, filesOpened } = get();
        if (!user) return;
        await setDoc(doc(db, "users", user.uid), { notes, filesOpened }, { merge: true });
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          set({ notes: data.notes || [], filesOpened: data.filesOpened || [] });
        }
      },

      addNote: async (note, dateISO = getTodayISO()) => {
        set((state) => ({
          notes: [
            ...state.notes,
            {
              id: Date.now(),
              text: note,
              title: note.split("\n")[0] || "Untitled",
              content: note,
              dateISO,
              completed: false,
              pinned: false,
              color: "",
              tags: [],
              updatedAt: Date.now(),
            },
          ],
        }));
        await get().syncToFirestore();
      },

      updateNote: async (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
          ),
        }));
        await get().syncToFirestore();
      },

      removeNote: async (id) => {
        set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }));
        await get().syncToFirestore();
      },

      togglePin: async (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, pinned: !note.pinned } : note
          ),
        }));
        await get().syncToFirestore();
      },

      setFilesOpened: async (files) => {
        set({ filesOpened: files });
        await get().syncToFirestore();
      },
    }),
    {
      name: "notes-storage-guest",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notes: state.notes, filesOpened: state.filesOpened }),
    }
  )
);
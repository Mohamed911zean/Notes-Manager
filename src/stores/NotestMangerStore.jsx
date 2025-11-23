import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const useTodoStore = create(
  persist(
    (set, get) => ({
      notes: [],
      tasks: [],
      user: null,

      // -----------------------
      //   🔥  تعيين اليوزر
      // -----------------------
      setUser: (user) => {
        set({ user });

        // تغيير اسم الـ localStorage بناءً على الـ UID
        if (user) {
          get().changeStorageKey(`notes-storage-${user.uid}`);
        } else {
          get().changeStorageKey("notes-storage-guest");
        }
      },

      // -----------------------
      //   تغيير اسم التخزين
      // -----------------------
      changeStorageKey: (newKey) => {
        const data = JSON.stringify({ state: get() });
        localStorage.setItem(newKey, data);
      },

      // -----------------------
      //   📌 Sync مع Firestore
      // -----------------------
      syncToFirestore: async () => {
        const { user, notes, tasks } = get();
        if (!user) return;

        await setDoc(doc(db, "users", user.uid), {
          notes,
          tasks,
        });
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          set({
            notes: data.notes || [],
            tasks: data.tasks || [],
          });
        }
      },

      // -----------------------
      //   📝 NOTES
      // -----------------------
      addNote: async (note) => {
        set((state) => ({
          notes: [
            ...state.notes,
            { id: Date.now(), text: note, completed: false },
          ],
        }));
        await get().syncToFirestore();
      },

      removeNote: async (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
        await get().syncToFirestore();
      },

      updateNote: async (id, newText) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, text: newText } : note
          ),
        }));
        await get().syncToFirestore();
      },

      // -----------------------
      //   ✅ TASKS
      // -----------------------
      addTask: async (task) => {
        set((state) => ({
          tasks: [
            ...state.tasks,
            { id: Date.now(), title: task.title, completed: false },
          ],
        }));
        await get().syncToFirestore();
      },

      removeTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
        await get().syncToFirestore();
      },

      toggleTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        }));
        await get().syncToFirestore();
      },
    }),

    // -----------------------
    //  📌 تخزين باستخدام LocalStorage
    // -----------------------
    {
      name: "notes-storage-guest", // default first time
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notes: state.notes,
        tasks: state.tasks,
      }),
    }
  )
);

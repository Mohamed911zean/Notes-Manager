import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTodoStore = create(
  persist(
    (set) => ({
      notes: [],

      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            { id: Date.now(), text: note, completed: false },
          ],
        })),

      removeNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),

      updateNote: (id, newText) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, text: newText } : note
          ),
        })),
    }),
    {
      name: "notes-storage", // اسم التخزين في localStorage
    }
  )
);

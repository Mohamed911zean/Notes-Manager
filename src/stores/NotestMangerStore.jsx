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


        tasks: [],

        addTask: (task) => 
          set((state) => ({
            tasks: [
              ...state.tasks,
              {
                id: Date.now(),
                title : task.title,
                completed: false
              }
            ]
          })),

          removeTask : (id) => 
            set((state) => ({
              tasks : state.tasks.filter((task) => task.id !== id)
            })),

            toggleTask : (id) => 
              set((state) => ({
                tasks : state.tasks.map((task) =>
                task.id === id ? {...task , completed : !task.completed} : task
                )
              })),


    }),
    {
      name: "notes-storage", // اسم التخزين في localStorage
    }
  )
);

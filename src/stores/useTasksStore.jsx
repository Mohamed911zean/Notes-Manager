import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const useTasksStore = create(
  persist(
    (set, get) => ({
      user: null,

      currentWeek: null,

     


      

      // -----------------------
      // Week Logic
      // -----------------------

      initializeWeek: () => {
        const today = new Date();
        const start = getWeekStart(today);

        const week = {
          startISO: start.toISOString().slice(0, 10),
          days: Array(7)
            .fill(0)
            .map((_, i) => {
              const date = new Date(start);
              date.setDate(date.getDate() + i);
              return {
                dateISO: date.toISOString().slice(0, 10),
                tasks: [],
              };
            }),
        };

        set({ currentWeek: week });
      },

      getTodayTasks: () => {
        const { currentWeek } = get();
        const today = new Date().toISOString().slice(0, 10);
        return currentWeek?.days.find((d) => d.dateISO === today)?.tasks || [];
      },

addTask: async (task) => {
  const { currentWeek } = get();
  const today = new Date().toISOString().slice(0, 10);

  // منع إضافة المهام لأيام عدت
  if (task.dateISO < today) {
    console.warn("Cannot add tasks to past days");
    return;
  }

  const updatedWeek = {
    ...currentWeek,
    days: currentWeek.days.map((day) =>
      day.dateISO === task.dateISO
        ? {
            ...day,
            tasks: [
              ...day.tasks,
              {
                id: Date.now(),
                title: task.title,
                done: false,
                carryFrom: null,
              },
            ],
          }
        : day
    ),
  };

  set({ currentWeek: updatedWeek });
  await get().syncToFirestore();
},



      toggleTask: async (id) => {
        const { currentWeek } = get();
        const today = new Date().toISOString().slice(0, 10);

        const updatedWeek = {
          ...currentWeek,
          days: currentWeek.days.map((day) =>
            day.dateISO === today
              ? {
                  ...day,
                  tasks: day.tasks.map((task) =>
                    task.id === id ? { ...task, done: !task.done } : task
                  ),
                }
              : day
          ),
        };

        set({ currentWeek: updatedWeek });
        await get().syncToFirestore();
      },

      removeTask: async (id) => {
        const { currentWeek } = get();
        const today = new Date().toISOString().slice(0, 10);

        const updatedWeek = {
          ...currentWeek,
          days: currentWeek.days.map((day) =>
            day.dateISO === today
              ? {
                  ...day,
                  tasks: day.tasks.filter((task) => task.id !== id),
                }
              : day
          ),
        };

        set({ currentWeek: updatedWeek });
        await get().syncToFirestore();
      },

      syncToFirestore: async () => {
        const { user, currentWeek } = get();
        if (!user) return;
        await setDoc(
          doc(db, "users", user.uid),
          { currentWeek },
          { merge: true }
        );
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          set({
            currentWeek: data.currentWeek || null,
          });
        }
      },
    }),
    {
      name: "tasks-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentWeek: state.currentWeek,
      }),
    }
  )
);

// helper to get week start (Saturday)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0:Sun .. 6:Sat
  const diff = (day + 1) % 7; // start Saturday
  d.setDate(d.getDate() - diff);
  return d;
}

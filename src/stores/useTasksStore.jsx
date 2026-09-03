import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getTodayISO, getNextRecurrenceDate } from "../lib/dateUtils";

export const useTasksStore = create(
  persist(
    (set, get) => ({
      user: null,
      tasks: [],
      isLoading: false,

      setUser: async (user) => {
        set({ user, isLoading: true });
        if (user) {
          await get().fetchFromFirestore();
          get().changeStorageKey(`tasks-storage-${user.uid}`);
        } else {
          set({ tasks: [] });
          get().changeStorageKey("tasks-storage-guest");
        }
        set({ isLoading: false });
      },

      changeStorageKey: (newKey) => {
        const state = get();
        const data = JSON.stringify({ state: { tasks: state.tasks } });
        localStorage.setItem(newKey, data);
      },

      addTask: async (task) => {
        const today = getTodayISO();
        if (task.dateISO && task.dateISO < today) {
          console.warn("Cannot add tasks to past days");
          return;
        }

        const newTask = {
          id: Date.now(),
          title: task.title || "",
          description: task.description || "",
          dateISO: task.dateISO || today,
          done: false,
          priority: task.priority || "medium",
          category: task.category || "personal",
          status: task.status || "todo",
          inProgress: false,
          subtasks: task.subtasks || [],
          tags: task.tags || [],
          estimatedMinutes: task.estimatedMinutes || 0,
          trackedMinutes: 0,
          recurrence: task.recurrence || null,
          snoozedUntil: null,
          originalDate: null,
          isRecurringInstance: false,
          createdAt: Date.now(),
        };

        set((state) => ({ tasks: [...state.tasks, newTask] }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { tasks: get().tasks }, { merge: true });
          } catch (error) {
            console.error("Failed to sync task:", error);
            set((state) => ({ tasks: state.tasks.filter((t) => t.id !== newTask.id) }));
          }
        }
      },

      updateTask: async (id, updates) => {
        const oldTasks = get().tasks;
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { tasks: get().tasks }, { merge: true });
          } catch (error) {
            console.error("Failed to update task:", error);
            set({ tasks: oldTasks });
          }
        }
      },

      toggleTask: async (id) => {
        const oldTasks = get().tasks;
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              const nextDone = !task.done;
              return {
                ...task,
                done: nextDone,
                status: nextDone ? "done" : task.status === "done" ? "todo" : task.status,
                inProgress: nextDone ? false : task.inProgress,
              };
            }
            return task;
          }),
        }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { tasks: get().tasks }, { merge: true });
          } catch (error) {
            console.error("Failed to sync toggle:", error);
            set({ tasks: oldTasks });
          }
        }
      },

      updateTaskStatus: async (id, inProgress) => {
        const oldTasks = get().tasks;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, inProgress, status: inProgress ? "doing" : t.status === "doing" ? "todo" : t.status } : t
          ),
        }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { tasks: get().tasks }, { merge: true });
          } catch (error) {
            console.error("Failed to update task status:", error);
            set({ tasks: oldTasks });
          }
        }
      },

      removeTask: async (id) => {
        const oldTasks = get().tasks;
        set({ tasks: get().tasks.filter((task) => task.id !== id) });

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { tasks: get().tasks }, { merge: true });
          } catch (error) {
            console.error("Failed to sync removal:", error);
            set({ tasks: oldTasks });
          }
        }
      },

      syncToFirestore: async () => {
        const { user, tasks } = get();
        if (!user) return;
        try {
          await setDoc(doc(db, "users", user.uid), { tasks }, { merge: true });
        } catch (error) {
          console.error("Failed to sync:", error);
        }
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            set({ tasks: data.tasks || [] });
          }
        } catch (error) {
          console.error("Failed to fetch:", error);
        }
      },

      addPomodoroTime: async (taskId, minutes) => {
        const oldTasks = get().tasks;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, trackedMinutes: (t.trackedMinutes || 0) + minutes } : t
          ),
        }));
        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { tasks: get().tasks }, { merge: true });
          } catch (error) {
            console.error("Failed to sync pomodoro time:", error);
            set({ tasks: oldTasks });
          }
        }
      },

      snoozeTask: async (id, days) => {
        const today = getTodayISO();
        const snoozedUntil = getNextRecurrenceDate(today, "daily");
        const snoozeDate = (() => {
          const d = new Date(today + "T00:00:00");
          d.setDate(d.getDate() + days);
          return d.toLocaleDateString("en-CA");
        })();
        const oldTasks = get().tasks;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, snoozedUntil: snoozeDate } : t
          ),
        }));
        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { tasks: get().tasks }, { merge: true });
          } catch (error) {
            console.error("Failed to sync snooze:", error);
            set({ tasks: oldTasks });
          }
        }
      },

      deferTask: async (id, dateISO) => {
        const oldTasks = get().tasks;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, dateISO, snoozedUntil: null } : t
          ),
        }));
        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, "users", user.uid), { tasks: get().tasks }, { merge: true });
          } catch (error) {
            console.error("Failed to sync defer:", error);
            set({ tasks: oldTasks });
          }
        }
      },

      getTasksByDate: (dateISO) => {
        const today = getTodayISO();
        return get().tasks.filter((t) => {
          if (t.snoozedUntil && t.snoozedUntil > today) return false;
          return t.dateISO === dateISO;
        });
      },

      generateRecurringInstances: () => {
        const { tasks } = get();
        const today = getTodayISO();
        const maxDate = getNextRecurrenceDate(today, "monthly");
        const existingInstances = tasks.filter((t) => t.isRecurringInstance);
        const newInstances = [];

        tasks.forEach((task) => {
          if (!task.recurrence || task.done) return;
          let nextDate = getNextRecurrenceDate(task.dateISO, task.recurrence.type);
          while (nextDate <= maxDate) {
            const alreadyExists = tasks.some(
              (t) => t.isRecurringInstance && t.originalDate === task.id && t.dateISO === nextDate
            );
            if (!alreadyExists) {
              newInstances.push({
                ...task,
                id: Date.now() + Math.random(),
                dateISO: nextDate,
                done: false,
                status: "todo",
                inProgress: false,
                isRecurringInstance: true,
                originalDate: task.id,
                createdAt: Date.now(),
              });
            }
            nextDate = getNextRecurrenceDate(nextDate, task.recurrence.type);
          }
        });

        if (newInstances.length > 0) {
          set((state) => ({ tasks: [...state.tasks, ...newInstances] }));
        }
      },
    }),
    {
      name: "tasks-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);
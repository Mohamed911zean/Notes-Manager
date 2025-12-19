import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const useTasksStore = create(
  persist(
    (set, get) => ({
      user: null,
      tasks: [],
      isLoading: false,

      setUser: async (user) => {
        set({ user, isLoading: true });
        
        if (user) {
          // تحميل البيانات من Firebase أولاً
          await get().fetchFromFirestore();
          get().changeStorageKey(`tasks-storage-${user.uid}`);
        } else {
          // مسح البيانات عند تسجيل الخروج
          set({ tasks: [] });
          get().changeStorageKey("tasks-storage-guest");
        }
        
        set({ isLoading: false });
      },

      changeStorageKey: (newKey) => {
        const state = get();
        const data = JSON.stringify({ 
          state: { 
            tasks: state.tasks 
          } 
        });
        localStorage.setItem(newKey, data);
      },

      addTask: async (task) => {
        // Egypt timezone
        const egyptDate = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
        const today = new Date(egyptDate).toLocaleDateString("en-CA");

        if (task.dateISO < today) {
          console.warn("Cannot add tasks to past days");
          return;
        }

        const newTask = {
          id: Date.now(),
          title: task.title,
          dateISO: task.dateISO,
          done: false,
        };

        // تحديث الـ state المحلي أولاً للسرعة
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        // ثم تحديث Firebase في الخلفية
        const { user } = get();
        if (user) {
          try {
            await setDoc(
              doc(db, "users", user.uid),
              { tasks: get().tasks },
              { merge: true }
            );
          } catch (error) {
            console.error("Failed to sync task to Firebase:", error);
            // استرجاع التغيير في حالة الفشل
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== newTask.id),
            }));
          }
        }
      },

      toggleTask: async (id) => {
        // حفظ الحالة القديمة للاسترجاع في حالة الفشل
        const oldTasks = get().tasks;
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, done: !task.done } : task
          ),
        }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(
              doc(db, "users", user.uid),
              { tasks: get().tasks },
              { merge: true }
            );
          } catch (error) {
            console.error("Failed to sync toggle to Firebase:", error);
            // استرجاع الحالة القديمة
            set({ tasks: oldTasks });
          }
        }
      },

      removeTask: async (id) => {
        const oldTasks = get().tasks;
        
        set({
          tasks: get().tasks.filter((task) => task.id !== id),
        });

        const { user } = get();
        if (user) {
          try {
            await setDoc(
              doc(db, "users", user.uid),
              { tasks: get().tasks },
              { merge: true }
            );
          } catch (error) {
            console.error("Failed to sync removal to Firebase:", error);
            set({ tasks: oldTasks });
          }
        }
      },

      syncToFirestore: async () => {
        const { user, tasks } = get();
        if (!user) return;
        
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { tasks },
            { merge: true }
          );
        } catch (error) {
          console.error("Failed to sync to Firebase:", error);
        }
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            set({
              tasks: data.tasks || [],
            });
          }
        } catch (error) {
          console.error("Failed to fetch from Firebase:", error);
        }
      },
    }),
    {
      name: "tasks-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
      }),
    }
  )
);
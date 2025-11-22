import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTimeManagerStore = create(
  persist(
    (set, get) => ({

      ////////////////////////
      ////// TIMERS STORE ////
      ////////////////////////

      timers: [],

      addTimer: (timer) =>
        set((state) => ({
          timers: [
            ...state.timers,
            {
              id: Date.now(),
              isRunning: false,
              remaining: timer.duration || 0, // بالثواني
              ...timer,
            },
          ],
        })),

      updateTimer: (id, newData) =>
        set((state) => ({
          timers: state.timers.map((timer) =>
            timer.id === id ? { ...timer, ...newData } : timer
          ),
        })),

      removeTimer: (id) =>
        set((state) => ({
          timers: state.timers.filter((t) => t.id !== id),
        })),

      // ⭐ تشغيل/إيقاف المؤقت
      toggleTimer: (id) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, isRunning: !t.isRunning } : t
          ),
        })),

      // ⭐ إعادة ضبط المؤقت
      resetTimer: (id) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, remaining: t.duration, isRunning: false } : t
          ),
        })),

      clearAllTimers: () => set({ timers: [] }),



      ////////////////////////
      ////// ALARMS STORE ////
      ////////////////////////

      alarms: [],

      addAlarm: (alarm) =>
        set((state) => ({
          alarms: [
            ...state.alarms,
            {
              id: Date.now(),
              enabled: true,
              ...alarm,
            },
          ],
        })),

      updateAlarm: (id, newData) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, ...newData } : a
          ),
        })),

      removeAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.filter((a) => a.id !== id),
        })),

      clearAllAlarms: () => set({ alarms: [] }),

      // ⭐ تشيك لو المنبه وصل لوقته — هيفيد في التابات والجلسة والموقع
      checkAlarms: () => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();

        const { alarms } = get();

        return alarms.filter((a) => a.enabled && a.hour === h && a.minute === m);
      },

    }),

    {
      name: "time-manager-storage",
    }
  )
);

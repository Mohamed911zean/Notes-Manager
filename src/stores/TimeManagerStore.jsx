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
              duration: timer.duration || 0,
              ...timer,
            },
          ],
        })),

      updateTimer: (id, newData) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, ...newData } : t
          ),
        })),

      removeTimer: (id) =>
        set((state) => ({
          timers: state.timers.filter((t) => t.id !== id),
        })),

      toggleTimer: (id) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, isRunning: !t.isRunning } : t
          ),
        })),

      resetTimer: (id) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, remaining: t.duration, isRunning: false } : t
          ),
        })),

      tickTimers: () => {
        set((state) => ({
          timers: state.timers.map((t) => {
            if (t.isRunning && t.remaining > 0) {
              return { ...t, remaining: t.remaining - 1 };
            }
            return t;
          }),
        }));
      },

      ////////////////////////
      ////// STOPWATCH ///////
      ////////////////////////
      stopwatchTime: 0,
      isStopwatchRunning: false,

      startStopStopwatch: () =>
        set((state) => ({ isStopwatchRunning: !state.isStopwatchRunning })),

      resetStopwatch: () =>
        set({ stopwatchTime: 0, isStopwatchRunning: false }),

      tickStopwatch: () =>
        set((state) => ({
          stopwatchTime: state.isStopwatchRunning
            ? state.stopwatchTime + 1
            : state.stopwatchTime,
        })),

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
              lastTriggered: null,
              ...alarm,
            },
          ],
        })),

      removeAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.filter((a) => a.id !== id),
        })),

      checkAlarms: () => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();

        const triggered = [];

        set((state) => ({
          alarms: state.alarms.map((a) => {
            if (
              a.enabled &&
              a.hour === h &&
              a.minute === m &&
              a.lastTriggered !== `${h}:${m}`
            ) {
              triggered.push(a);
              return { ...a, lastTriggered: `${h}:${m}` };
            }
            return a;
          }),
        }));

        return triggered;
      },

      ///////////////////////////////
      ////// POMODORO ANALYTICS ////
      ///////////////////////////////
      pomodoroSessions: [],

      addPomodoroSession: (duration) =>
        set((state) => {
          const date = new Date().toISOString().split("T")[0];
          return {
            pomodoroSessions: [
              ...state.pomodoroSessions,
              { id: Date.now(), duration, date },
            ],
          };
        }),

      getTodayPomodoroSessions: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().pomodoroSessions.filter((s) => s.date === today);
      },

      getTotalPomodoroToday: () => {
        return get()
          .getTodayPomodoroSessions()
          .reduce((sum, s) => sum + s.duration, 0);
      },

      getPomodoroCountToday: () => {
        return get().getTodayPomodoroSessions().length;
      },

      getAveragePomodoroToday: () => {
        const sessions = get().getTodayPomodoroSessions();
        if (!sessions.length) return 0;
        return get().getTotalPomodoroToday() / sessions.length;
      },

      getWeekPomodoroTotal: () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);

        return get()
          .pomodoroSessions.filter((s) => new Date(s.date) >= weekAgo)
          .reduce((sum, s) => sum + s.duration, 0);
      },
    }),
    {
      name: "time-manager-storage",
    }
  )
);

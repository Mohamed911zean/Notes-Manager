import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const useTimeManagerStore = create(
  persist(
    (set, get) => ({
      // User for Firebase sync
      user: null,
      isLoading: false,

      ////////////////////////
      ////// TIMERS STORE ////
      ////////////////////////
      timers: [],
      activeTaskId: null,
      activeTaskTitle: "",
      pomodoroLog: [],

      // ===== POMODORO MODE =====
      pomodoroEnabled: false,
      pomodoroPhase: null, // 'focus' | 'shortBreak' | 'longBreak'
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsPerCycle: 4,
      completedFocusSessions: 0,
      autoStartNext: true,

      // ===== USER & FIREBASE SYNC FUNCTIONS =====

      setUser: async (user) => {
        set({ user, isLoading: true });

        if (user) {
          // Load data from Firebase first
          await get().fetchFromFirestore();
          get().changeStorageKey(`time-manager-storage-${user.uid}`);
        } else {
          // Clear data on logout
          set({ timers: [] });
          get().changeStorageKey("time-manager-storage-guest");
        }

        set({ isLoading: false });
      },

      changeStorageKey: (newKey) => {
        const state = get();
        const data = JSON.stringify({
          state: {
            timers: state.timers,
          }
        });
        localStorage.setItem(newKey, data);
      },

      syncToFirestore: async () => {
        const { user, timers } = get();
        if (!user) return;

        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              timeManager: {
                timers,
              }
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Failed to sync time manager to Firebase:", error);
        }
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.timeManager) {
              set({
                timers: data.timeManager.timers || [],
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch time manager from Firebase:", error);
        }
      },

      // ===== TIMER FUNCTIONS =====

      setActiveTask: (taskId, taskTitle) => {
        set({ activeTaskId: taskId, activeTaskTitle: taskTitle || "" });
      },

      addTimer: async (timer) => {        // Only allow one timer at a time
        const currentTimers = get().timers;
        if (currentTimers.length > 0) {
          return false; // Return false to indicate timer wasn't added
        }

        const duration = timer.duration || 0;
        const isRunning = timer.isRunning ?? false;
        set((state) => ({
          timers: [
            ...state.timers,
            {
              ...timer,
              id: Date.now(),
              isRunning,
              remaining: duration,
              endTime: isRunning ? Date.now() + duration * 1000 : null,
              status: isRunning ? 'running' : 'paused',
            },
          ],
        }));

        // Sync to Firebase
        const { user } = get();
        if (user) {
          try {
            await get().syncToFirestore();
          } catch (error) {
            console.error("Failed to sync timer add to Firebase:", error);
          }
        }

        return true; // Return true to indicate success
      },

      removeTimer: async (id) => {
        const oldTimers = get().timers;

        set((state) => ({
          timers: state.timers.filter((t) => t.id !== id),
        }));

        // Sync to Firebase
        const { user } = get();
        if (user) {
          try {
            await get().syncToFirestore();
          } catch (error) {
            console.error("Failed to sync timer removal to Firebase:", error);
            // Rollback on failure
            set({ timers: oldTimers });
          }
        }
      },

      stopTimer: async (id, status) => {
        const oldTimers = get().timers;
        const now = Date.now();

        // Correct remaining from wall-clock before changing state
        set((state) => ({
          timers: state.timers.map((t) => {
            if (t.id !== id) return t;
            let remaining = t.remaining;
            if (t.isRunning && t.endTime) {
              remaining = Math.max(0, Math.ceil((t.endTime - now) / 1000));
            }
            return { ...t, remaining };
          }),
        }));

        if (status === "stopped") {
          const timer = get().timers.find((t) => t.id === id);
          if (timer && timer.duration > 0) {
            const elapsed = timer.duration - (timer.remaining || 0);
            if (elapsed > 0) {
              const minutes = Math.round(elapsed / 60);
              set((state) => ({
                pomodoroLog: [
                  ...state.pomodoroLog,
                  {
                    id: Date.now(),
                    taskId: state.activeTaskId,
                    taskTitle: state.activeTaskTitle,
                    duration: elapsed,
                    minutes,
                    completedAt: Date.now(),
                    date: new Date().toLocaleDateString("en-CA"),
                  },
                ],
              }));
            }
          }
        }

        set((state) => ({
          timers: state.timers.map((t) => {
            if (t.id !== id) return t;
            const running = status === "running";
            const remaining = Math.max(0, t.remaining || 0);
            return {
              ...t,
              isRunning: running,
              status,
              remaining,
              // On pause/stop clear endTime; on resume recompute it from remaining
              endTime: running && remaining > 0 ? Date.now() + remaining * 1000 : null,
            };
          }),
        }));

        // Sync to Firebase
        const { user } = get();
        if (user) {
          try {
            await get().syncToFirestore();
          } catch (error) {
            console.error("Failed to sync timer stop to Firebase:", error);
            // Rollback on failure
            set({ timers: oldTimers });
          }
        }
      },

      resetTimer: async (id) => {
        const oldTimers = get().timers;

        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, remaining: t.duration, isRunning: false, status: 'stopped', endTime: null } : t
          ),
        }));

        // Sync to Firebase
        const { user } = get();
        if (user) {
          try {
            await get().syncToFirestore();
          } catch (error) {
            console.error("Failed to sync timer reset to Firebase:", error);
            // Rollback on failure
            set({ timers: oldTimers });
          }
        }
      },

      // ===== POMODORO ACTIONS =====

      setPomodoroSettings: (settings) => {
        set((state) => ({
          pomodoroEnabled: settings.enabled ?? state.pomodoroEnabled,
          focusMinutes: settings.focusMinutes ?? state.focusMinutes,
          shortBreakMinutes: settings.shortBreakMinutes ?? state.shortBreakMinutes,
          longBreakMinutes: settings.longBreakMinutes ?? state.longBreakMinutes,
          sessionsPerCycle: settings.sessionsPerCycle ?? state.sessionsPerCycle,
          autoStartNext: settings.autoStartNext ?? state.autoStartNext,
          // reset cycle when settings change
          completedFocusSessions: 0,
          pomodoroPhase: null,
        }));
      },

      startPomodoro: () => {
        const { timers, focusMinutes, pomodoroPhase } = get();
        if (timers.length > 0) return false;

        const phase = pomodoroPhase || "focus";
        let minutes = focusMinutes;
        if (phase === "shortBreak") minutes = get().shortBreakMinutes;
        if (phase === "longBreak") minutes = get().longBreakMinutes;

        set({ pomodoroPhase: phase, pomodoroEnabled: true });
        get().addTimer({ duration: minutes * 60, isRunning: true, label: `${phase} · ${minutes} min`, pomodoro: true, phase });
        return true;
      },

      completePomodoroPhase: () => {
        // Called when a pomodoro timer naturally completes
        const { pomodoroPhase, autoStartNext, sessionsPerCycle, completedFocusSessions } = get();

        if (pomodoroPhase === "focus") {
          const sessionCount = completedFocusSessions + 1;
          const next = sessionCount >= sessionsPerCycle ? "longBreak" : "shortBreak";
          set({
            completedFocusSessions: sessionCount >= sessionsPerCycle ? 0 : sessionCount,
            pomodoroPhase: next,
          });
          if (autoStartNext) {
            const nextMin = next === "longBreak" ? get().longBreakMinutes : get().shortBreakMinutes;
            get().addTimer({ duration: nextMin * 60, isRunning: true, label: `${next} · ${nextMin} min`, pomodoro: true, phase: next });
          }
        } else {
          // break finished -> focus
          set({ pomodoroPhase: "focus" });
          if (autoStartNext) {
            get().addTimer({ duration: get().focusMinutes * 60, isRunning: true, label: `focus · ${get().focusMinutes} min`, pomodoro: true, phase: "focus" });
          }
        }
      },

      stopPomodoro: () => {
        set({ pomodoroEnabled: false, pomodoroPhase: null, completedFocusSessions: 0 });
      },

      tickTimers: () => {
        // Note: tickTimers runs frequently and doesn't sync to Firebase
        // to avoid excessive writes. Timer state is synced on start/stop/reset.
        // Remaining is derived from wall-clock endTime so background-tab
        // throttling never drifts the timer.
        const now = Date.now();
        set((state) => ({
          timers: state.timers.map((t) => {
            if (!t.isRunning) return t;
            let remaining = t.remaining;
            if (t.endTime) {
              remaining = Math.max(0, Math.ceil((t.endTime - now) / 1000));
            }
            if (remaining === 0) {
              return { ...t, remaining: 0, isRunning: false, status: 'stopped', endTime: null, completed: true };
            }
            return { ...t, remaining };
          }),
        }));
      },
    }),
    {
      name: "time-manager-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        timers: state.timers,
        pomodoroLog: state.pomodoroLog,
        activeTaskId: state.activeTaskId,
        activeTaskTitle: state.activeTaskTitle,
        pomodoroEnabled: state.pomodoroEnabled,
        pomodoroPhase: state.pomodoroPhase,
        focusMinutes: state.focusMinutes,
        shortBreakMinutes: state.shortBreakMinutes,
        longBreakMinutes: state.longBreakMinutes,
        sessionsPerCycle: state.sessionsPerCycle,
        completedFocusSessions: state.completedFocusSessions,
        autoStartNext: state.autoStartNext,
      }),    }
  )
);
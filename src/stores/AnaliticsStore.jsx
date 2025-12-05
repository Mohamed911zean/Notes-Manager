import { create } from "zustand";
import { persist } from "zustand/middleware";

// Function لتحويل الثواني إلى h:m
export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

export const useAnalyticsStore = create(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (duration) => {
        const date = new Date().toISOString().split("T")[0];
        set((state) => ({
          sessions: [...state.sessions, { id: Date.now(), duration, date }],
        }));
      },

      getTodaySessions: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().sessions.filter((s) => s.date === today);
      },

      getTotalToday: () =>
        get().getTodaySessions().reduce((sum, s) => sum + s.duration, 0),

      getCountToday: () => get().getTodaySessions().length,

      getAverageToday: () => {
        const sessions = get().getTodaySessions();
        if (!sessions.length) return 0;
        return get().getTotalToday() / sessions.length;
      },

      getWeekTotal: () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        return get()
          .sessions.filter((s) => new Date(s.date) >= weekAgo)
          .reduce((sum, s) => sum + s.duration, 0);
      },

      // Generate weekly data for charts
      getWeeklyData: () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);

        const data = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekAgo);
          day.setDate(weekAgo.getDate() + i);
          const dayStr = day.toISOString().split("T")[0];

          const sessions = get().sessions.filter((s) => s.date === dayStr);
          const total = sessions.reduce((sum, s) => sum + s.duration, 0);

          data.push({
            day: day.toLocaleDateString("en-US", { weekday: "short" }),
            count: sessions.length,
            total,
          });
        }

        return data;
      },
    }),
    { name: "analytics-storage" }
  )
);

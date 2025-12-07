import { create } from "zustand";
import { persist } from "zustand/middleware";

// Format seconds to h/m
export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// Calculate weekly data based on sessions
const calculateWeeklyData = (sessions) => {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 6);

  const data = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekAgo);
    day.setDate(weekAgo.getDate() + i);

    const dayStr = day.toISOString().split("T")[0]; // YYYY-MM-DD

    const daySessions = sessions.filter(s => s.date === dayStr);
    const total = daySessions.reduce((sum, s) => sum + s.duration, 0);

    data.push({
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      count: daySessions.length,
      total, // in seconds
    });
  }

  return data;
};

const now = new Date();

export const useAnalyticsStore = create(
  persist(
    (set, get) => ({
      sessions: [],
      weeklyData: [],
      
      currentSessionStart: now, // timestamp

      // Start a session
      startSession: () => {
  if (!get().currentSessionStart) {
    set({ currentSessionStart: Date.now() });
  }

  console.log("START called at:", Date.now());
},


      // End a session
      endSession: () => {
  const start = get().currentSessionStart;
  if (!start) return;

  const end = Date.now();
  const duration = Math.floor((end - start) / 1000); // seconds
  const date = new Date().toISOString().split("T")[0];

  set(state => {
    const updatedSessions = [
      ...state.sessions,
      {
        id: Date.now(),
        start,
        end,
        duration,
        date,
      },
    ];

    console.log("END called at:", Date.now());

    return {
      currentSessionStart: null,
      sessions: updatedSessions,
      weeklyData: calculateWeeklyData(updatedSessions),
    };
  });
},


      // Get sessions for today
      getTodaySessions: () => {
        const todayStr = new Date().toISOString().split("T")[0];
        return get().sessions.filter(s => s.date === todayStr);
      },

      // Stats for today
      getTotalToday: () => {
        return get().getTodaySessions().reduce((sum, s) => sum + s.duration, 0);
      },

      getCountToday: () => {
        return get().getTodaySessions().length;
      },

      getAverageToday: () => {
        const sessions = get().getTodaySessions();
        if (!sessions.length) return 0;
        return get().getTotalToday() / sessions.length;
      },

      // Weekly stats
      getWeekTotal: () => {
        return get().weeklyData.reduce((sum, day) => sum + day.total, 0);
      },

      getWeeklyData: () => get().weeklyData,

      // Reset all data (for testing)
      resetData: () => {
        set({ sessions: [], weeklyData: [], currentSessionStart: null });
      },
    }),
    {
      name: "analytics-storage",
    }
  )
);


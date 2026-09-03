import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Format seconds to h/m
export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// Helper: Get Date object representing Egypt time
const getEgyptDateObj = () => {
  const now = new Date();
  const egyptTimeStr = now.toLocaleString("en-US", { timeZone: "Africa/Cairo" });
  return new Date(egyptTimeStr);
};

// Helper: Format date to YYYY-MM-DD (using local time of the date object)
const formatDate = (date) => {
  return date.toLocaleDateString("en-CA");
};

// Get Egypt date string
const getEgyptDate = () => {
  return formatDate(getEgyptDateObj());
};

// Calculate weekly data based on sessions
const calculateWeeklyData = (sessions) => {
  const today = getEgyptDateObj();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);

  const data = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekAgo);
    day.setDate(weekAgo.getDate() + i);

    const dayStr = formatDate(day);

    const daySessions = sessions.filter(s => s.date === dayStr);
    const total = daySessions.reduce((sum, s) => sum + s.duration, 0);

    data.push({
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      count: daySessions.length,
      total,
    });
  }

  return data;
};

// Get weeks in current month
const getWeeksInMonth = () => {
  const now = getEgyptDateObj();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks = [];
  let currentWeekStart = new Date(firstDay);

  // Adjust to Monday
  const dayOfWeek = currentWeekStart.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  currentWeekStart.setDate(currentWeekStart.getDate() + diff);

  let weekNumber = 1;

  while (currentWeekStart <= lastDay) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Only include if week starts in current month OR overlaps significantly
    if (currentWeekStart.getMonth() === month ||
      (weekEnd.getMonth() === month && weekEnd.getDate() >= 1)) {
      weeks.push({
        number: weekNumber,
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
        label: `Week ${weekNumber}`
      });
      weekNumber++;
    }

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
};

// Get data for specific week
const getWeekData = (weekStart, weekEnd, sessions, tasks) => {
  const days = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);

    if (day > weekEnd) break;

    const dayStr = formatDate(day);

    // Pomodoro data
    const daySessions = sessions.filter(s => s.date === dayStr);
    const pomodoroCount = daySessions.length;
    const pomodoroTotal = daySessions.reduce((sum, s) => sum + s.duration, 0);

    // Tasks data
    const dayTasks = tasks.filter(t => t.dateISO === dayStr);
    const completedTasks = dayTasks.filter(t => t.done).length;
    const totalTasks = dayTasks.length;

    days.push({
      date: dayStr,
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      pomodoroCount,
      pomodoroTotal,
      completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    });
  }

  return days;
};

const now = new Date();

export const useAnalyticsStore = create(
  persist(
    (set, get) => ({
      // User for Firebase sync
      user: null,
      isLoading: false,

      sessions: [],
      weeklyData: [],
      currentSessionStart: now,

      // Current month tracking
      selectedWeek: 0, // Index of selected week

      // ===== USER & FIREBASE SYNC FUNCTIONS =====

      setUser: async (user) => {
        set({ user, isLoading: true });

        if (user) {
          // Load data from Firebase first
          await get().fetchFromFirestore();
          get().changeStorageKey(`analytics-storage-${user.uid}`);
        } else {
          // Clear data on logout
          set({ sessions: [], weeklyData: [], currentSessionStart: null, selectedWeek: 0 });
          get().changeStorageKey("analytics-storage-guest");
        }

        set({ isLoading: false });
      },

      changeStorageKey: (newKey) => {
        const state = get();
        const data = JSON.stringify({
          state: {
            sessions: state.sessions,
            weeklyData: state.weeklyData,
            selectedWeek: state.selectedWeek,
          }
        });
        localStorage.setItem(newKey, data);
      },

      syncToFirestore: async () => {
        const { user, sessions, weeklyData, selectedWeek } = get();
        if (!user) return;

        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              analytics: {
                sessions,
                weeklyData,
                selectedWeek,
              }
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Failed to sync analytics to Firebase:", error);
        }
      },

      fetchFromFirestore: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.analytics) {
              set({
                sessions: data.analytics.sessions || [],
                weeklyData: data.analytics.weeklyData || [],
                selectedWeek: data.analytics.selectedWeek || 0,
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch analytics from Firebase:", error);
        }
      },

      // ===== EXISTING HOME PAGE FUNCTIONS =====

      startSession: () => {
        if (!get().currentSessionStart) {
          set({ currentSessionStart: Date.now() });
        }
      },

      endSession: async () => {
        const start = get().currentSessionStart;
        if (!start) return;

        const end = Date.now();
        const duration = Math.floor((end - start) / 1000);
        const date = getEgyptDate();

        // Save old state for rollback
        const oldSessions = get().sessions;

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

          return {
            currentSessionStart: null,
            sessions: updatedSessions,
            weeklyData: calculateWeeklyData(updatedSessions),
          };
        });

        // Sync to Firebase
        const { user } = get();
        if (user) {
          try {
            await get().syncToFirestore();
          } catch (error) {
            console.error("Failed to sync session to Firebase:", error);
            // Rollback on failure
            set({
              sessions: oldSessions,
              weeklyData: calculateWeeklyData(oldSessions),
              currentSessionStart: start
            });
          }
        }
      },

      getTodaySessions: () => {
        const todayStr = getEgyptDate();
        return get().sessions.filter(s => s.date === todayStr);
      },

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

      getWeekTotal: () => {
        return get().weeklyData.reduce((sum, day) => sum + day.total, 0);
      },

      getWeeklyData: () => get().weeklyData,

      resetData: async () => {
        set({ sessions: [], weeklyData: [], currentSessionStart: null });

        // Sync to Firebase
        const { user } = get();
        if (user) {
          try {
            await get().syncToFirestore();
          } catch (error) {
            console.error("Failed to sync reset to Firebase:", error);
          }
        }
      },

      // ===== NEW MONTHLY ANALYTICS FUNCTIONS =====

      // Get current month info
      getCurrentMonthInfo: () => {
        const now = getEgyptDateObj();
        return {
          month: now.toLocaleDateString("en-US", { month: "long" }),
          year: now.getFullYear(),
          monthIndex: now.getMonth()
        };
      },

      // Get weeks in current month
      getWeeksInCurrentMonth: () => {
        return getWeeksInMonth();
      },

      // Set selected week
      setSelectedWeek: async (weekIndex) => {
        set({ selectedWeek: weekIndex });

        // Sync to Firebase
        const { user } = get();
        if (user) {
          try {
            await get().syncToFirestore();
          } catch (error) {
            console.error("Failed to sync selected week to Firebase:", error);
          }
        }
      },

      // Get data for selected week (needs tasks from external store)
      getSelectedWeekData: (tasks = []) => {
        const weeks = getWeeksInMonth();
        const selectedWeekIndex = get().selectedWeek;

        if (!weeks[selectedWeekIndex]) return [];

        const week = weeks[selectedWeekIndex];
        return getWeekData(week.start, week.end, get().sessions, tasks);
      },

      // Monthly summary stats
      getMonthlyStats: (tasks = []) => {
        const now = getEgyptDateObj();
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const firstDayStr = formatDate(firstDay);
        const lastDayStr = formatDate(lastDay);

        // Pomodoro stats
        const monthSessions = get().sessions.filter(
          s => s.date >= firstDayStr && s.date <= lastDayStr
        );

        const totalPomodoros = monthSessions.length;
        const totalPomodoroTime = monthSessions.reduce((sum, s) => sum + s.duration, 0);
        const avgPomodoroTime = totalPomodoros > 0 ? totalPomodoroTime / totalPomodoros : 0;

        // Task stats
        const monthTasks = tasks.filter(
          t => t.dateISO >= firstDayStr && t.dateISO <= lastDayStr
        );

        const totalTasks = monthTasks.length;
        const completedTasks = monthTasks.filter(t => t.done).length;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          totalPomodoros,
          totalPomodoroTime,
          avgPomodoroTime,
          totalTasks,
          completedTasks,
          incompleteTasks: totalTasks - completedTasks,
          taskCompletionRate
        };
      },

      // Get task completion data (for pie chart)
      getTaskCompletionData: (tasks = []) => {
        const stats = get().getMonthlyStats(tasks);
        return {
          completed: stats.completedTasks,
          incomplete: stats.incompleteTasks
        };
      },

      // Get performance radar data
      getPerformanceRadarData: (tasks = []) => {
        const weekData = get().getSelectedWeekData(tasks);

        if (weekData.length === 0) return null;

        const totalPomos = weekData.reduce((sum, d) => sum + d.pomodoroCount, 0);
        const totalMinutes = weekData.reduce((sum, d) => sum + d.pomodoroTotal, 0) / 60;
        const totalTasks = weekData.reduce((sum, d) => sum + d.totalTasks, 0);
        const completedTasks = weekData.reduce((sum, d) => sum + d.completedTasks, 0);
        const overallCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          pomodoros: totalPomos,
          focusTime: totalMinutes,
          tasksCompleted: completedTasks,
          totalTasks: totalTasks,
          completionRate: overallCompletion
        };
      },

      // ===== SMART ANALYTICS FUNCTIONS =====

      getProductivityScore: (tasks = []) => {
        const sessions = get().sessions;
        const today = getEgyptDate();

        // Completion rate (40%)
        const recentTasks = tasks.filter((t) => t.dateISO >= (() => {
          const d = new Date(); d.setDate(d.getDate() - 7); return d.toLocaleDateString("en-CA");
        })());
        const completionRate = recentTasks.length > 0
          ? recentTasks.filter((t) => t.done).length / recentTasks.length
          : 0;

        // Focus time score (30%) - based on daily average last 7 days
        const last7 = sessions.filter((s) => s.date >= (() => {
          const d = new Date(); d.setDate(d.getDate() - 7); return d.toLocaleDateString("en-CA");
        })());
        const dailyFocus = last7.reduce((sum, s) => sum + s.duration, 0) / 7;
        const focusScore = Math.min(dailyFocus / 3600, 1); // 1 hour = perfect

        // Streak (20%)
        let streak = 0;
        let checkDate = new Date();
        while (streak < 30) {
          const dateStr = checkDate.toLocaleDateString("en-CA");
          const dayTasks = tasks.filter((t) => t.dateISO === dateStr);
          if (dayTasks.length > 0 && dayTasks.every((t) => t.done)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
        const streakScore = Math.min(streak / 7, 1); // 7 days = perfect

        // Consistency (10%) - sessions last 7 days
        const daysWithSessions = new Set(last7.map((s) => s.date)).size;
        const consistencyScore = daysWithSessions / 7;

        return Math.round(
          completionRate * 40 + focusScore * 30 + streakScore * 20 + consistencyScore * 10
        );
      },

      getBestHours: () => {
        const sessions = get().sessions;
        const hourCounts = new Array(24).fill(0);
        sessions.forEach((s) => {
          const h = new Date(s.start).getHours();
          hourCounts[h] += s.duration;
        });
        return hourCounts.map((total, hour) => ({
          hour,
          label: `${hour}:00`,
          totalMinutes: Math.round(total / 60),
        }));
      },

      getTaskTimeBreakdown: (tasks = []) => {
        const categories = {};
        tasks.forEach((t) => {
          const cat = t.category || "personal";
          if (!categories[cat]) categories[cat] = 0;
          categories[cat] += t.trackedMinutes || 0;
        });
        return Object.entries(categories).map(([name, minutes]) => ({ name, minutes }));
      },

      getHeatmapData: (days = 90) => {
        const tasks = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString("en-CA");
          tasks.push({ date: dateStr, score: 0 });
        }
        // Score based on task completion + focus time
        const allTasks = get().getTaskCompletionData().completed;
        const sessions = get().sessions;
        tasks.forEach((day) => {
          const daySessions = sessions.filter((s) => s.date === day.date);
          const focusMin = daySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
          day.score = Math.min(Math.round(focusMin / 4 * 100 + (Math.random() * 10)), 100);
        });
        return tasks;
      },
    }),
    {
      name: "analytics-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        weeklyData: state.weeklyData,
        selectedWeek: state.selectedWeek,
      }),
    }
  )
);
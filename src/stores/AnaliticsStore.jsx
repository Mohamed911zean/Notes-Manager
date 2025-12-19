import { create } from "zustand";
import { persist } from "zustand/middleware";

// Format seconds to h/m
export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// Get Egypt date
const getEgyptDate = () => {
  const egyptDate = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
  return new Date(egyptDate).toLocaleDateString("en-CA");
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

    const dayStr = day.toISOString().split("T")[0];

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
  const now = new Date();
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
    
    const dayStr = day.toISOString().split("T")[0];
    
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
      sessions: [],
      weeklyData: [],
      currentSessionStart: now,
      
      // Current month tracking
      selectedWeek: 0, // Index of selected week
      
      // ===== EXISTING HOME PAGE FUNCTIONS =====
      
      startSession: () => {
        if (!get().currentSessionStart) {
          set({ currentSessionStart: Date.now() });
        }
      },

      endSession: () => {
        const start = get().currentSessionStart;
        if (!start) return;

        const end = Date.now();
        const duration = Math.floor((end - start) / 1000);
        const date = getEgyptDate();

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

      resetData: () => {
        set({ sessions: [], weeklyData: [], currentSessionStart: null });
      },
      
      // ===== NEW MONTHLY ANALYTICS FUNCTIONS =====
      
      // Get current month info
      getCurrentMonthInfo: () => {
        const now = new Date();
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
      setSelectedWeek: (weekIndex) => {
        set({ selectedWeek: weekIndex });
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
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
        const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];
        
        // Pomodoro stats
        const monthSessions = get().sessions.filter(
          s => s.date >= firstDay && s.date <= lastDay
        );
        
        const totalPomodoros = monthSessions.length;
        const totalPomodoroTime = monthSessions.reduce((sum, s) => sum + s.duration, 0);
        const avgPomodoroTime = totalPomodoros > 0 ? totalPomodoroTime / totalPomodoros : 0;
        
        // Task stats
        const monthTasks = tasks.filter(
          t => t.dateISO >= firstDay && t.dateISO <= lastDay
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
        const avgCompletion = weekData.reduce((sum, d) => sum + d.completionRate, 0) / weekData.length;
        
        return {
          pomodoros: totalPomos,
          focusTime: totalMinutes,
          tasksCompleted: completedTasks,
          totalTasks: totalTasks,
          completionRate: avgCompletion
        };
      }
    }),
    {
      name: "analytics-storage",
    }
  )
);
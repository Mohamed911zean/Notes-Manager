import React, { useEffect, useRef, useState } from "react";
import { useAnalyticsStore, formatTime } from "../stores/AnaliticsStore";
import { useTasksStore } from "../stores/useTasksStore";
import { useCalenderStore } from "../stores/CalenderStore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  BarController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  Tooltip,
  Legend,
} from "chart.js";
import { BarChart3, TrendingUp, Target, Zap, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import SideBar from "./sidebar.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  BarController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const tasks = useTasksStore((state) => state.tasks);
  const plans = useCalenderStore((state) => state.plans);

  // Combine tasks and plans
  const allItems = [
    ...tasks,
    ...plans.map(plan => ({
      ...plan,
      done: plan.completed // Map completed to done for consistency
    }))
  ];

  const {
    getCurrentMonthInfo,
    getWeeksInCurrentMonth,
    selectedWeek,
    setSelectedWeek,
    getSelectedWeekData,
    getMonthlyStats,
    getTaskCompletionData,
    getPerformanceRadarData
  } = useAnalyticsStore();

  const monthInfo = getCurrentMonthInfo();
  const weeks = getWeeksInCurrentMonth();
  const weekData = getSelectedWeekData(allItems);
  const monthlyStats = getMonthlyStats(allItems);
  const taskCompletion = getTaskCompletionData(allItems);
  const performanceData = getPerformanceRadarData(allItems);

  // Chart refs
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const polarChartRef = useRef(null);
  const radarChartRef = useRef(null);

  // Chart instances
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);
  const pieChartInstance = useRef(null);
  const polarChartInstance = useRef(null);
  const radarChartInstance = useRef(null);

  // Destroy all charts
  const destroyCharts = () => {
    [barChartInstance, lineChartInstance, pieChartInstance, polarChartInstance, radarChartInstance].forEach(chart => {
      if (chart.current) {
        chart.current.destroy();
        chart.current = null;
      }
    });
  };

  useEffect(() => {
    destroyCharts();

    if (!weekData || weekData.length === 0) return;

    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#18181b",
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 12, weight: "500" },
          bodyFont: { size: 12 },
          borderColor: "#27272a",
          borderWidth: 1,
        },
      },
    };

    // 1. BAR CHART - Tasks Completed
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext("2d");
      barChartInstance.current = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: weekData.map((d) => d.day),
          datasets: [
            {
              label: "Completed",
              data: weekData.map((d) => d.completedTasks),
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              borderColor: "rgba(34, 197, 94, 0.8)",
              borderWidth: 2,
              borderRadius: 6,
            },
            {
              label: "Total",
              data: weekData.map((d) => d.totalTasks),
              backgroundColor: "rgba(161, 161, 170, 0.2)",
              borderColor: "rgba(161, 161, 170, 0.8)",
              borderWidth: 2,
              borderRadius: 6,
            },
          ],
        },
        options: {
          ...chartDefaults,
          plugins: {
            ...chartDefaults.plugins,
            legend: { display: true, labels: { color: "#a1a1aa", font: { size: 11 } } },
          },
          scales: {
            y: { beginAtZero: true, ticks: { color: "#52525b" }, grid: { color: "#27272a" } },
            x: { ticks: { color: "#52525b" }, grid: { display: false } },
          },
        },
      });
    }

    // 2. LINE CHART - Focus Time Trend
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext("2d");
      lineChartInstance.current = new ChartJS(ctx, {
        type: "line",
        data: {
          labels: weekData.map((d) => d.day),
          datasets: [
            {
              label: "Minutes",
              data: weekData.map((d) => d.pomodoroTotal / 60),
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              borderWidth: 3,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: "#f59e0b",
              fill: true,
            },
          ],
        },
        options: {
          ...chartDefaults,
          scales: {
            y: { beginAtZero: true, ticks: { color: "#52525b" }, grid: { color: "#27272a" } },
            x: { ticks: { color: "#52525b" }, grid: { display: false } },
          },
        },
      });
    }

    // 3. PIE CHART - Task Completion Rate
    if (pieChartRef.current && taskCompletion) {
      const ctx = pieChartRef.current.getContext("2d");
      pieChartInstance.current = new ChartJS(ctx, {
        type: "pie",
        data: {
          labels: ["Completed", "Incomplete"],
          datasets: [
            {
              data: [taskCompletion.completed, taskCompletion.incomplete],
              backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"],
              borderColor: ["#22c55e", "#ef4444"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          ...chartDefaults,
          plugins: {
            ...chartDefaults.plugins,
            legend: { display: true, position: "bottom", labels: { color: "#a1a1aa", padding: 15, font: { size: 11 } } },
          },
        },
      });
    }

    // 4. POLAR AREA CHART - Pomodoro Distribution
    if (polarChartRef.current) {
      const ctx = polarChartRef.current.getContext("2d");
      polarChartInstance.current = new ChartJS(ctx, {
        type: "polarArea",
        data: {
          labels: weekData.map((d) => d.day),
          datasets: [
            {
              label: "Sessions",
              data: weekData.map((d) => d.pomodoroCount),
              backgroundColor: [
                "rgba(239, 68, 68, 0.6)",
                "rgba(249, 115, 22, 0.6)",
                "rgba(245, 158, 11, 0.6)",
                "rgba(34, 197, 94, 0.6)",
                "rgba(59, 130, 246, 0.6)",
                "rgba(139, 92, 246, 0.6)",
                "rgba(236, 72, 153, 0.6)",
              ],
            },
          ],
        },
        options: {
          ...chartDefaults,
          scales: {
            r: {
              ticks: { color: "#52525b", backdropColor: "transparent" },
              grid: { color: "#27272a" },
            },
          },
        },
      });
    }

    // 5. RADAR CHART - Performance Metrics
    if (radarChartRef.current && performanceData) {
      const ctx = radarChartRef.current.getContext("2d");
      
      const maxValues = {
        pomodoros: 50,
        focusTime: 300,
        tasksCompleted: 30,
        totalTasks: 40,
        completionRate: 100
      };
      
      radarChartInstance.current = new ChartJS(ctx, {
        type: "radar",
        data: {
          labels: ["Pomodoros", "Focus Time (min)", "Tasks Done", "Total Tasks", "Completion %"],
          datasets: [
            {
              label: "Performance",
              data: [
                (performanceData.pomodoros / maxValues.pomodoros) * 100,
                (performanceData.focusTime / maxValues.focusTime) * 100,
                (performanceData.tasksCompleted / maxValues.tasksCompleted) * 100,
                (performanceData.totalTasks / maxValues.totalTasks) * 100,
                performanceData.completionRate
              ],
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderColor: "rgba(59, 130, 246, 0.8)",
              borderWidth: 2,
              pointBackgroundColor: "#3b82f6",
              pointBorderColor: "#fff",
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          ...chartDefaults,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { color: "#52525b", backdropColor: "transparent", stepSize: 20 },
              grid: { color: "#27272a" },
              pointLabels: { color: "#a1a1aa", font: { size: 10 } },
            },
          },
        },
      });
    }

    return () => destroyCharts();
  }, [weekData, taskCompletion, performanceData]);

  const stats = [
    {
      label: "Total Pomodoros",
      value: monthlyStats.totalPomodoros,
      icon: Zap,
      color: "text-yellow-500"
    },
    {
      label: "Focus Time",
      value: formatTime(monthlyStats.totalPomodoroTime),
      icon: TrendingUp,
      color: "text-blue-500"
    },
    {
      label: "Tasks Completed",
      value: `${monthlyStats.completedTasks}/${monthlyStats.totalTasks}`,
      icon: Target,
      color: "text-green-500"
    },
    {
      label: "Completion Rate",
      value: `${Math.round(monthlyStats.taskCompletionRate)}%`,
      icon: BarChart3,
      color: "text-purple-500"
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 p-6 md:p-12">
        <SideBar />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
      `}</style>

      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-medium tracking-tight text-white flex items-center gap-3"
          >
            <BarChart3 size={32} className="text-zinc-400" />
            Analytics Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 text-sm mt-2 flex items-center gap-2"
          >
            <Calendar size={14} />
            {monthInfo.month} {monthInfo.year}
          </motion.p>
        </header>

        {/* Month Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all"
            >
              <stat.icon className={`${stat.color} mb-3`} size={20} />
              <h3 className="text-2xl font-semibold text-zinc-100">{stat.value}</h3>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Week Selector */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
          <button
            onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
            disabled={selectedWeek === 0}
            className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {weeks.map((week, i) => (
              <button
                key={i}
                onClick={() => setSelectedWeek(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedWeek === i
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {week.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedWeek(Math.min(weeks.length - 1, selectedWeek + 1))}
            disabled={selectedWeek === weeks.length - 1}
            className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
            <h3 className="text-sm font-medium text-zinc-200 mb-4">Tasks Completed</h3>
            <div className="h-64">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>

          {/* Line Chart */}
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
            <h3 className="text-sm font-medium text-zinc-200 mb-4">Focus Time Trend</h3>
            <div className="h-64">
              <canvas ref={lineChartRef}></canvas>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
            <h3 className="text-sm font-medium text-zinc-200 mb-4">Task Completion Rate</h3>
            <div className="h-64 flex items-center justify-center">
              <canvas ref={pieChartRef}></canvas>
            </div>
          </div>

          {/* Polar Chart */}
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
            <h3 className="text-sm font-medium text-zinc-200 mb-4">Pomodoro Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              <canvas ref={polarChartRef}></canvas>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
            <h3 className="text-sm font-medium text-zinc-200 mb-4">Performance Overview</h3>
            <div className="h-80 flex items-center justify-center">
              <canvas ref={radarChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
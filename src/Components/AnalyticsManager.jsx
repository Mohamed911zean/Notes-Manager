import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { useAnalyticsStore, formatTime } from "../stores/AnaliticsStore";
import { useTasksStore } from "../stores/useTasksStore";
import { useCalenderStore } from "../stores/CalenderStore";
import { BarChart3, TrendingUp, Target, Zap, Calendar, Flame, Award, Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { getTodayISO, addDays } from "../lib/dateUtils";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--accent-primary)",
];

function HeatmapGrid({ sessions, today }) {
  const data = useMemo(() => {
    const start = new Date(today + "T00:00:00");
    start.setDate(start.getDate() - 90);
    const days = Array.from({ length: 90 }, (_, i) => {
      const day = new Date(start); day.setDate(start.getDate() + i);
      const dateStr = day.toLocaleDateString("en-CA");
      const daySessions = sessions.filter((s) => s.date === dateStr);
      const focusMin = daySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
      return { date: dateStr, score: Math.min(Math.round((focusMin / 60) * 100), 100) };
    });
    const weeks = [];
    for (let c = 0; c < Math.ceil(90 / 7); c++) weeks.push(days.slice(c * 7, c * 7 + 7));
    return weeks;
  }, [sessions, today]);

  return (
    <div className="flex gap-0.5 overflow-x-auto">
      {data.map((week, col) => (
        <div key={col} className="flex flex-col gap-0.5">
          {week.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.score}% activity`}
              className="w-3 h-3 rounded-[3px]"
              style={{ background: d.score === 0 ? "var(--muted)" : `rgba(var(--accent-rgb), ${0.2 + (d.score / 100) * 0.8})` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const tasks = useTasksStore((state) => state.tasks);
  const plans = useCalenderStore((state) => state.plans);
  const sessions = useAnalyticsStore((state) => state.sessions);
  const getProductivityScore = useAnalyticsStore((s) => s.getProductivityScore);
  const getBestHours = useAnalyticsStore((s) => s.getBestHours);
  const getTaskTimeBreakdown = useAnalyticsStore((s) => s.getTaskTimeBreakdown);
  const [weekReportOpen, setWeekReportOpen] = useState(true);

  const today = getTodayISO();

  const productivityScore = useMemo(() => getProductivityScore(tasks), [getProductivityScore, tasks]);
  const bestHours = useMemo(() => getBestHours().filter((h) => h.totalMinutes > 0), [getBestHours, sessions]);
  const taskTimeBreakdown = useMemo(() => getTaskTimeBreakdown(tasks).filter((t) => t.minutes > 0), [getTaskTimeBreakdown, tasks]);

  const scoreColor = productivityScore < 40 ? "#ef4444" : productivityScore < 70 ? "#eab308" : "#22c55e";
  const scoreLabel = productivityScore < 40 ? "Needs focus" : productivityScore < 70 ? "Building momentum" : "Excellent!";

  // Combine tasks and plans
  const allItems = useMemo(() => [
    ...tasks.map((t) => ({ ...t, done: t.done })),
    ...plans.map((p) => ({ ...p, done: p.completed })),
  ], [tasks, plans]);

  // Last 7 days data
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i - 6);
      const dayItems = allItems.filter((t) => t.dateISO === date);
      const dayDone = dayItems.filter((t) => t.done).length;
      const daySessions = sessions.filter((s) => s.date === date);
      const focusMin = daySessions.reduce((sum, s) => sum + s.duration, 0) / 60;

      return {
        day: new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
        completed: dayDone,
        total: dayItems.length,
        focus: Math.round(focusMin),
        sessions: daySessions.length,
      };
    });
  }, [allItems, sessions, today]);

  // Last 30 days for trend
  const trendData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(today, i - 29);
      const dayItems = allItems.filter((t) => t.dateISO === date);
      const daySessions = sessions.filter((s) => s.date === date).reduce((sum, s) => sum + s.duration, 0);

      return {
        date: new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        focus: Math.round(daySessions / 60),
        done: dayItems.filter((t) => t.done).length,
      };
    });
  }, [allItems, sessions, today]);

  // Categories distribution
  const categoryData = useMemo(() => {
    const counts = {};
    allItems.forEach((t) => {
      const cat = t.category || "personal";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allItems]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthPrefix = today.slice(0, 7);
    const monthItems = allItems.filter((t) => (t.dateISO || "").startsWith(monthPrefix));
    const total = monthItems.length;
    const done = monthItems.filter((t) => t.done).length;
    const monthSessions = sessions.filter((s) => (s.date || "").startsWith(monthPrefix));
    const totalFocus = monthSessions.reduce((sum, s) => sum + s.duration, 0);

    return {
      totalPomodoros: monthSessions.length,
      totalPomodoroTime: totalFocus,
      totalTasks: total,
      completedTasks: done,
      taskCompletionRate: total > 0 ? (done / total) * 100 : 0,
    };
  }, [allItems, sessions, today]);

  // Streak calculation
  const streak = useMemo(() => {
    let count = 0;
    let date = today;
    while (true) {
      const dayItems = allItems.filter((t) => t.dateISO === date);
      if (dayItems.length > 0 && dayItems.every((t) => t.done)) {
        count++;
        date = addDays(date, -1);
      } else {
        break;
      }
    }
    return count;
  }, [allItems, today]);

  // Best category
  const bestCategory = useMemo(() => {
    const catDone = {};
    const catAll = {};
    allItems.forEach((t) => {
      const cat = t.category || "personal";
      catAll[cat] = (catAll[cat] || 0) + 1;
      if (t.done) catDone[cat] = (catDone[cat] || 0) + 1;
    });
    let best = null;
    let bestRate = -1;
    Object.keys(catAll).forEach((c) => {
      const rate = catAll[c] > 0 ? catDone[c] / catAll[c] : 0;
      if (rate > bestRate) { bestRate = rate; best = c; }
    });
    return best;
  }, [allItems]);

  const stats = [
    { label: "Total Pomodoros", value: monthlyStats.totalPomodoros, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Focus Time", value: formatTime(monthlyStats.totalPomodoroTime), icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Tasks Completed", value: `${monthlyStats.completedTasks}/${monthlyStats.totalTasks}`, icon: Target, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Completion Rate", value: `${Math.round(monthlyStats.taskCompletionRate)}%`, icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const tooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--foreground)",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl lg:text-3xl font-medium tracking-tight flex items-center gap-3">
            <BarChart3 size={28} className="text-primary" />
            Analytics Dashboard
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
            <Calendar size={14} />
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card">
            <Flame size={16} className="text-primary" />
            <span className="text-sm font-medium">{streak} day{streak !== 1 ? "s" : ""} streak</span>
          </div>
          {bestCategory && (
            <div className="px-4 py-2 rounded-xl border border-border bg-card text-sm capitalize">
              Best: <span className="font-medium text-primary">{bestCategory}</span>
            </div>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
          >
            <div className={`w-fit p-2 rounded-lg ${stat.bg} mb-3`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <h3 className="text-2xl font-semibold">{stat.value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Productivity score + weekly report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity score */}
        <div className="p-6 rounded-xl border border-border bg-card flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="var(--border)" strokeWidth="10" fill="none" />
              <circle
                cx="56" cy="56" r="48" stroke={scoreColor} strokeWidth="10" fill="none" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - productivityScore / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold" style={{ color: scoreColor }}>{productivityScore}</span>
              <span className="text-[9px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-primary" />
              <h3 className="text-sm font-medium">Productivity Score</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{scoreLabel}</p>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p>• Completion 40%</p>
              <p>• Focus time 30%</p>
              <p>• Streak 20%</p>
              <p>• Consistency 10%</p>
            </div>
          </div>
        </div>

        {/* Weekly report */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <button onClick={() => setWeekReportOpen(!weekReportOpen)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" />
              <h3 className="text-sm font-medium">This Week's Report</h3>
            </div>
            {weekReportOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>
          {weekReportOpen && (
            <div className="px-6 pb-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-[10px] text-muted-foreground">Tasks done</p>
                <p className="text-lg font-semibold">{weeklyData.reduce((s, d) => s + d.completed, 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-[10px] text-muted-foreground">Focus time</p>
                <p className="text-lg font-semibold">{(weeklyData.reduce((s, d) => s + d.focus, 0)).toFixed(0)}m</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-[10px] text-muted-foreground">Completion rate</p>
                <p className="text-lg font-semibold">
                  {(() => { const t = weeklyData.reduce((s, d) => s + d.total, 0); return t > 0 ? Math.round((weeklyData.reduce((s, d) => s + d.completed, 0) / t) * 100) : 0; })()}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-[10px] text-muted-foreground">Sessions</p>
                <p className="text-lg font-semibold">{weeklyData.reduce((s, d) => s + d.sessions, 0)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity heatmap */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-primary" />
          <h3 className="text-sm font-medium">90-Day Activity Heatmap</h3>
        </div>
        <HeatmapGrid sessions={sessions} today={today} />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly completion */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-medium mb-4">Weekly Task Completion</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} stroke="var(--border)" />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "var(--foreground)" }}>{v}</span>} />
                <Bar dataKey="completed" name="Completed" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="var(--muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus time area */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-medium mb-4">Focus Time Trend (30 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" interval="preserveStartEnd" />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} stroke="var(--border)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="focus" name="Minutes" stroke="var(--accent-primary)" strokeWidth={2} fill="url(#focusGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category pie */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-medium mb-4">Category Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "var(--foreground)", textTransform: "capitalize" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best productivity hours */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-primary" />
            <h3 className="text-sm font-medium">Best Productivity Hours</h3>
          </div>
          {bestHours.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">No focus time tracked yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestHours.slice(0, 12)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} stroke="var(--border)" />
                  <YAxis type="category" dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" width={40} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} formatter={(v) => [`${v}m`, "Focus time"]} />
                  <Bar dataKey="totalMinutes" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} name="minutes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Time per task category */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-primary" />
            <h3 className="text-sm font-medium">Focus Time by Category</h3>
          </div>
          {taskTimeBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-sm text-muted-foreground">
              <p>No tracked focus time yet</p>
              <p className="text-xs mt-1">Link a task in the Pomodoro timer to see breakdowns</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskTimeBreakdown} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, minutes }) => `${name} (${minutes}m)`}>
                    {taskTimeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}m`, "Focus time"]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "var(--foreground)", textTransform: "capitalize" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sessions per day */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-medium mb-4">Pomodoro Sessions (Weekly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} stroke="var(--border)" />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="sessions" name="Sessions" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
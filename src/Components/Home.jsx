import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, StickyNote, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTasksStore } from "../stores/useTasksStore";
import { useAnalyticsStore, formatTime } from "../stores/AnaliticsStore";
import { useNotesStore } from "../stores/useNotesStore";
import { useCalenderStore } from "../stores/CalenderStore";
import { getTodayISO, getShortDayName, addDays, isToday } from "../lib/dateUtils";
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  FileText,
  Timer,
  Flame,
} from "lucide-react";

export default function Home() {
  const tasks = useTasksStore((s) => s.tasks);
  const plans = useCalenderStore((s) => s.plans);
  const { notes } = useNotesStore();
  const getTotalToday = useAnalyticsStore((s) => s.getTotalToday) || (() => 0);
  const getCountToday = useAnalyticsStore((s) => s.getCountToday) || (() => 0);
  const getWeeklyData = useAnalyticsStore((s) => s.getWeeklyData) || (() => []);

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const today = getTodayISO();

  const todayTasks = tasks.filter((t) => t.dateISO === today);
  const todayPlans = plans.filter((p) => p.dateISO === today);
  const allToday = [...todayTasks, ...todayPlans.map((p) => ({ ...p, done: p.completed }))];
  const completedToday = allToday.filter((i) => i.done || i.completed).length;
  const progress = allToday.length > 0 ? Math.round((completedToday / allToday.length) * 100) : 0;

  const focusSeconds = getTotalToday();

  // Weekly mini heatmap
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  }, [today]);

  const weekStats = weekDays.map((day) => {
    const dayTasks = tasks.filter((t) => t.dateISO === day);
    const done = dayTasks.filter((t) => t.done).length;
    return { day, done, total: dayTasks.length };
  });

  // Stats
  const stats = [
    {
      label: "Focus Time",
      value: formatTime(focusSeconds),
      sub: `${getCountToday()} sessions today`,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Tasks Completed",
      value: `${completedToday}/${allToday.length}`,
      sub: `${progress}% complete`,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Notes Today",
      value: notes.filter((n) => n.dateISO === today).length,
      sub: "captured",
      icon: StickyNote,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Upcoming Plans",
      value: plans.filter((p) => p.dateISO >= today && !p.completed).length,
      sub: "in your schedule",
      icon: CalendarDays,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  const nextPlans = plans
    .filter((p) => p.dateISO >= today && !p.completed)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-medium tracking-tight">
          {greeting} 👋
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <CalendarIcon size={14} />
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </motion.p>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.15 }}
            className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">{stat.value}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today overview */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-8 rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" />
              <h2 className="text-sm font-medium">Today's Progress</h2>
            </div>
            <Link to="/tasks" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="p-6 space-y-6">
            {/* Progress ring */}
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-28 h-28 -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="var(--border)" strokeWidth="8" fill="none" />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="var(--accent-primary)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold">{progress}%</span>
                  <span className="text-[10px] text-muted-foreground">complete</span>
                </div>
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                {allToday.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks scheduled for today. Enjoy some free time or plan something ahead!
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {completedToday === allToday.length
                        ? "All done! Amazing work today 🎉"
                        : `You've completed ${completedToday} of ${allToday.length} items. Keep going!`}
                    </p>
                    <div className="space-y-1.5">
                      {allToday.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.done || task.completed ? "bg-green-500" : "bg-zinc-500"}`} />
                          <span className={`truncate ${task.done || task.completed ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Weekly heatmap */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame size={14} className="text-primary" />
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">This Week</h3>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weekStats.map((s) => {
                  const pct = s.total > 0 ? (s.done / s.total) * 100 : 0;
                  return (
                    <div key={s.day} className="flex flex-col items-center gap-1">
<div
                          className="w-full h-12 rounded-lg border border-border flex items-center justify-center transition-all"
                          style={{
                            background: pct === 100 ? "var(--accent-primary)" : pct > 0 ? `rgba(var(--accent-rgb), 0.3)` : "transparent",
                            color: pct === 100 ? "#fff" : "inherit",
                          }}
                        >
                        <span className={`text-xs font-medium ${pct === 100 ? "text-white" : ""}`}>{s.done}</span>
                      </div>
                      <span className={`text-[10px] ${isToday(s.day) ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {getShortDayName(s.day).slice(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Quick actions + upcoming plans */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4 rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-medium">Quick Actions</h2>
          </div>

          <div className="p-6 grid grid-cols-2 gap-3">
            <Link to="/tasks" className="group p-4 rounded-xl border border-border hover:border-primary/40 transition-all flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <CheckSquare size={18} className="text-green-500" />
              </div>
              <span className="text-xs font-medium">New Task</span>
            </Link>
            <Link to="/calendar" className="group p-4 rounded-xl border border-border hover:border-primary/40 transition-all flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <CalendarDays size={18} className="text-blue-500" />
              </div>
              <span className="text-xs font-medium">New Plan</span>
            </Link>
            <Link to="/notes" className="group p-4 rounded-xl border border-border hover:border-primary/40 transition-all flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <FileText size={18} className="text-purple-500" />
              </div>
              <span className="text-xs font-medium">New Note</span>
            </Link>
            <Link to="/pomodoro" className="group p-4 rounded-xl border border-border hover:border-primary/40 transition-all flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <Timer size={18} className="text-red-500" />
              </div>
              <span className="text-xs font-medium">Start Timer</span>
            </Link>
          </div>

          {/* Upcoming plans */}
          <div className="px-6 pb-6 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Upcoming</h3>
            </div>

            {nextPlans.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing scheduled. Check your calendar to plan ahead.</p>
            ) : (
              <div className="space-y-2">
                {nextPlans.map((plan) => (
                  <Link to="/calendar" key={plan.id} className="block p-2.5 rounded-lg bg-accent hover:bg-accent transition-colors">
                    <p className="text-sm font-medium truncate">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(plan.dateISO + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {plan.time ? ` · ${plan.time}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
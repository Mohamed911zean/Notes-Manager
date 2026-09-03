import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, CheckCircle2, Circle, Trash2, Clock, TrendingUp, TrendingDown, Minus, AlertOctagon, Timer, Repeat } from "lucide-react";
import { useCalenderStore } from "../../stores/CalenderStore";
import { useTasksStore } from "../../stores/useTasksStore";
import { useTimeManagerStore } from "../../stores/TimeManagerStore";
import { formatDisplayDate, getTodayISO, isToday } from "../../lib/dateUtils";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const PRIORITY_META = {
  low: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20", Icon: Minus },
  medium: { color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", Icon: TrendingUp },
  high: { color: "text-red-500 bg-red-500/10 border-red-500/20", Icon: TrendingDown },
  urgent: { color: "text-purple-500 bg-purple-500/10 border-purple-500/20", Icon: AlertOctagon },
};

const CATEGORY_COLORS = {
  work: "text-blue-500",
  personal: "text-green-500",
  health: "text-red-500",
  study: "text-purple-500",
  social: "text-orange-500",
};

export default function DayDetailPanel({ dateISO, onClose }) {
  const getPlansByDate = useCalenderStore((s) => s.getPlansByDate);
  const togglePlan = useCalenderStore((s) => s.togglePlan);
  const removePlan = useCalenderStore((s) => s.removePlan);
  const syncToFirestore = useCalenderStore((s) => s.syncToFirestore);
  const tasks = useTasksStore((s) => s.tasks);
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const navigate = useNavigate();

  const dayPlans = getPlansByDate(dateISO).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const dayTasks = tasks.filter((t) => t.dateISO === dateISO && !(t.snoozedUntil && t.snoozedUntil > getTodayISO()));

  const handleToggle = async (id) => {
    togglePlan(id);
    await syncToFirestore();
  };

  const handleDelete = async (id) => {
    removePlan(id);
    await syncToFirestore();
    toast.success("Plan deleted");
  };

  const handleFocusOnTask = (task) => {
    useTimeManagerStore.getState().setActiveTask(task.id, task.title);
    navigate("/pomodoro");
  };

  const today = getTodayISO();

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-card border-l border-border z-50 shadow-2xl flex flex-col"
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{formatDisplayDate(dateISO)}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{dayPlans.length} plans · {dayTasks.length} tasks</span>
            {isToday(dateISO) && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Today</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Tasks section */}
        {dayTasks.length > 0 && (
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-primary" />
              Tasks
            </h4>
            <div className="space-y-2">
              {dayTasks.map((task) => (
                <div key={task.id} className="group p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-2.5">
                    <button onClick={() => toggleTask(task.id)} className={`mt-0.5 flex-shrink-0 ${task.done ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}>
                      {task.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {task.recurrence && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-0.5 capitalize"><Repeat size={8} />{task.recurrence.type}</span>}
                        {task.trackedMinutes > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500">⏱ {task.trackedMinutes}m</span>}
                        <button onClick={() => handleFocusOnTask(task)} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 transition-colors">
                          <Timer size={9} /> Focus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Plans section */}
        <section>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock size={12} className="text-primary" />
            Plans
          </h4>
          {dayPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <CalendarEmptyIcon />
              <p className="text-sm mt-3">No plans for this day</p>
              {dayTasks.length === 0 && <p className="text-xs mt-1">Nothing scheduled. Enjoy the day!</p>}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {dayPlans.map((plan) => {
                const meta = PRIORITY_META[plan.priority] || PRIORITY_META.medium;
                const catColor = CATEGORY_COLORS[plan.category] || "text-muted-foreground";
                return (
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`group p-3.5 rounded-xl border transition-all ${
                      plan.completed ? "border-border bg-accent/50 opacity-60" : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button onClick={() => handleToggle(plan.id)} className={`mt-0.5 flex-shrink-0 transition-colors ${plan.completed ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}>
                        {plan.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${plan.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{plan.title}</h4>
                        {plan.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {plan.time && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock size={10} />
                              {plan.time}
                              {plan.endTime && ` - ${plan.endTime}`}
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${meta.color}`}>
                            <meta.Icon size={8} className="inline mr-1 -mt-px" />
                            {plan.priority}
                          </span>
                          <span className={`text-[10px] capitalize ${catColor}`}>{plan.category}</span>
                          {plan.recurrence && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide border border-border px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Repeat size={8} /> {plan.recurrence}
                            </span>
                          )}
                          {plan.subtasks && plan.subtasks.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">{plan.subtasks.filter((s) => s.completed).length}/{plan.subtasks.length} subtasks</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(plan.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </section>
      </div>
    </motion.aside>
  );
}

function CalendarEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-20">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
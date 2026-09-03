import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCalenderStore } from "../../stores/CalenderStore";
import { addDays, getTodayISO, getShortDayName, getMonthName } from "../../lib/dateUtils";

const PRIORITY_META = {
  low: { bg: "bg-blue-500/10 text-blue-500 border-blue-500/20", Icon: Minus },
  medium: { bg: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", Icon: TrendingUp },
  high: { bg: "bg-red-500/10 text-red-500 border-red-500/20", Icon: TrendingDown },
  urgent: { bg: "bg-purple-500/10 text-purple-500 border-purple-500/20", Icon: AlertTriangle },
};

export default function AgendaView({ onSelectDate }) {
  const plans = useCalenderStore((s) => s.plans);
  const togglePlan = useCalenderStore((s) => s.togglePlan);
  const syncToFirestore = useCalenderStore((s) => s.syncToFirestore);
  const today = getTodayISO();

  const range = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => addDays(today, i));
  }, [today]);

  const grouped = range
    .map((date) => ({
      date,
      items: plans
        .filter((p) => p.dateISO === date)
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99")),
    }))
    .filter((g) => g.items.length > 0);

  const handleToggle = async (id) => {
    togglePlan(id);
    await syncToFirestore();
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card">
      <h2 className="text-xl font-semibold text-foreground mb-6">Upcoming Agenda</h2>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Clock size={40} className="opacity-20" />
          <p className="text-sm mt-3">No upcoming plans in the next 30 days</p>
          <p className="text-xs">Add plans to your calendar to see them here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const isTodayDay = group.date === today;
            return (
              <div key={group.date}>
                {/* Sticky date header */}
                <div className="sticky top-0 z-10 flex items-center gap-2 mb-3 -mx-4 px-4 py-2 bg-card/95 backdrop-blur">
                  <span className="text-sm font-semibold text-foreground">
                    {isTodayDay ? "Today" : getShortDayName(group.date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(group.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {isTodayDay && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">NOW</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{group.items.length} plans</span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {group.items.map((plan) => {
                      const meta = PRIORITY_META[plan.priority] || PRIORITY_META.medium;
                      return (
                        <motion.div
                          key={plan.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          onClick={() => onSelectDate(group.date)}
                          className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-accent hover:border-primary/30 cursor-pointer transition-all"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggle(plan.id); }}
                            className={`flex-shrink-0 ${plan.completed ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            {plan.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${plan.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {plan.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {plan.time && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock size={10} />
                                  {plan.time}
                                  {plan.endTime && ` - ${plan.endTime}`}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.bg}`}>
                            <meta.Icon size={8} />
                            {plan.priority}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
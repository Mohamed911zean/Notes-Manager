import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCalenderStore } from "../../stores/CalenderStore";
import { getTodayISO, addDays, getShortDayName, getMonthName } from "../../lib/dateUtils";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6AM to 7PM
const START_HOUR = 6;

const PRIORITY_BG = {
  low: "bg-blue-500/20 border-blue-500/50 text-blue-500",
  medium: "bg-yellow-500/20 border-yellow-500/50 text-yellow-500",
  high: "bg-red-500/20 border-red-500/50 text-red-500",
  urgent: "bg-purple-500/20 border-purple-500/50 text-purple-500",
};

export default function WeekView({ selectedDate, onSelectDate }) {
  const plans = useCalenderStore((s) => s.plans);
  const addPlan = useCalenderStore((s) => s.addPlan);
  const syncToFirestore = useCalenderStore((s) => s.syncToFirestore);
  const today = getTodayISO();

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today + "T00:00:00");
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString("en-CA");
  });

  const [emptySlot, setEmptySlot] = useState(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekLabel = days.length > 0
    ? `${getShortDayName(days[0])} ${Number(days[0].slice(8, 10))} - ${getShortDayName(days[6])} ${Number(days[6].slice(8, 10))} ${getMonthName(Number(days[0].slice(5, 7)) - 1)}`
    : "";

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const goToday = () => {
    const d = new Date(today + "T00:00:00");
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    setWeekStart(d.toLocaleDateString("en-CA"));
  };

  const handleQuickAdd = async (dateISO, hour) => {
    const time = `${String(hour).padStart(2, "0")}:00`;
    await addPlan({ title: "New plan", time, dateISO });
    await syncToFirestore();
    setEmptySlot(null);
    onSelectDate(dateISO);
  };

  // Current time indicator
  const nowEgypt = (() => {
    const str = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
    const d = new Date(str);
    return { hour: d.getHours(), minute: d.getMinutes() };
  })();

  const pixelPerHour = 64;

  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">{weekLabel}</h2>
          <button
            onClick={goToday}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-accent text-foreground hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable time grid */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[720px]">
          {/* Day headers */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-px mb-2">
            <div />
            {days.map((day) => {
              const isTodayDay = day === today;
              const isSel = selectedDate === day;
              return (
                <button
                  key={day}
                  onClick={() => onSelectDate(day)}
                  className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                    isSel ? "bg-primary text-primary-foreground" : isTodayDay ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase">{getShortDayName(day)}</span>
                  <span className="text-lg font-semibold">{Number(day.slice(8, 10))}</span>
                </button>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative">
            <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-px">
              {HOURS.map((hour) => (
                <div key={hour} className="flex flex-col relative" style={{ height: pixelPerHour }}>
                  {/* Time label */}
                  <div className="col-start-1 h-full relative">
                    <div className="absolute -top-2 left-0 text-[10px] text-muted-foreground">
                      {hour === 12 ? "12 PM" : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                    </div>
                    <div className="absolute top-0 left-12 right-0 h-px bg-border" />
                  </div>

                  {/* Day columns */}
                  {days.map((day, dayIdx) => (
                    <div key={day} className="relative border-l border-border">
                      {/* Hour line */}
                      <div className={`absolute top-0 left-0 right-0 ${hour === 0 ? "" : "bg-border"}`} style={{ height: 1 }} />

                      {/* Plans at this hour */}
                      {plans
                        .filter((p) => p.dateISO === day && p.time && Number(p.time.slice(0, 2)) === hour)
                        .map((plan) => {
                          const h = Number(plan.time.slice(0, 2));
                          const m = Number(plan.time.slice(3, 5));
                          const duration = plan.endTime
                            ? (Number(plan.endTime.slice(0, 2)) * 60 + Number(plan.endTime.slice(3, 5))) - (h * 60 + m)
                            : 60;
                          const topOffset = (m / 60) * pixelPerHour;
                          const height = Math.max((duration / 60) * pixelPerHour - 4, 28);

                          return (
                            <motion.button
                              key={plan.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => onSelectDate(day)}
                              className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-left transition-all hover:z-10 ${PRIORITY_BG[plan.priority] || PRIORITY_BG.medium} ${
                                plan.completed ? "opacity-50" : ""
                              }`}
                              style={{ top: topOffset + 2, height, overflow: "hidden" }}
                            >
                              <p className="text-[10px] font-semibold truncate leading-tight">{plan.time}</p>
                              <p className="text-[11px] font-medium truncate leading-tight">{plan.title}</p>
                            </motion.button>
                          );
                        })}

                      {/* Quick add button on hover */}
                      <button
                        onClick={() => setEmptySlot(emptySlot?.day === day && emptySlot?.hour === hour ? null : { day, hour })}
                        className="absolute right-1 top-1 p-0.5 rounded bg-accent/80 text-muted-foreground hover:text-foreground hover:bg-accent text-[10px] transition-opacity opacity-0 group-hover:opacity-100"
                        style={{ opacity: emptySlot?.day === day && emptySlot?.hour === hour ? 1 : undefined }}
                      >
                        <Plus size={10} />
                      </button>

                      {/* Empty slot quick add */}
                      {emptySlot?.day === day && emptySlot?.hour === hour && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute left-1 right-1 top-1 z-20 bg-card border border-primary rounded-lg shadow-xl p-2"
                        >
                          <button
                            onClick={() => handleQuickAdd(day, hour)}
                            className="text-xs text-foreground hover:text-primary w-full text-left"
                          >
                            + Add plan at {String(hour).padStart(2, "0")}:00
                          </button>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Current time line */}
            {nowEgypt.hour >= START_HOUR && (
              <div
                className="absolute left-12 right-0 z-20 pointer-events-none"
                style={{ top: (nowEgypt.hour - START_HOUR) * pixelPerHour + (nowEgypt.minute / 60) * pixelPerHour }}
              >
                <div className="relative h-0.5 bg-destructive">
                  <span className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-destructive" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
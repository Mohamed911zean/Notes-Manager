import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";
import { useCalenderStore } from "../../stores/CalenderStore";
import { useTasksStore } from "../../stores/useTasksStore";
import { getTodayISO, isToday, getMonthName } from "../../lib/dateUtils";

const PRIORITY_COLORS = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
  urgent: "bg-purple-500",
};

export default function MonthView({ selectedDate, onSelectDate }) {
  const tasks = useTasksStore((s) => s.tasks);
  const getPlansByDate = useCalenderStore((s) => s.getPlansByDate);
  const today = getTodayISO();

  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
    return isNaN(d) ? new Date() : d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, month: month - 1, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, month, date: new Date(year, month, i) });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, month: month + 1, date: new Date(year, month + 1, i) });
  }

  const dateISO = (d) => d.toLocaleDateString("en-CA");

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const d = new Date(today + "T00:00:00");
    setViewDate(d);
    onSelectDate(today);
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            {getMonthName(month)} {year}
          </h2>
          <button
            onClick={goToday}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-accent text-foreground hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const iso = dateISO(cell.date);
          const isCurrentMonth = cell.month === month;
          const dayPlans = getPlansByDate(iso);
          const dayTasks = tasks.filter((t) => t.dateISO === iso && !t.done);
          const isSelected = selectedDate === iso;
          const todayCell = isToday(iso);
          const total = dayPlans.length + dayTasks.length;

          return (
            <button
              key={i}
              onClick={() => onSelectDate(iso)}
              className={`relative aspect-square rounded-xl border transition-all duration-200 flex flex-col items-center justify-start pt-1.5 group ${
                isCurrentMonth
                  ? isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-accent hover:bg-accent text-foreground border-transparent"
                  : "bg-accent/30 text-muted-foreground/50 border-transparent"
              } ${todayCell ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""}`}
            >
              <span className={`text-sm ${todayCell ? "font-bold" : "font-medium"}`}>{cell.day}</span>

              {total > 0 && (
                <div className="flex flex-col items-center gap-0.5 mt-1 px-1 w-full">
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayPlans.slice(0, 3).map((p) => (
                      <span key={p.id} className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[p.priority] || PRIORITY_COLORS.medium}`} />
                    ))}
                    {dayTasks.slice(0, 2).map((t) => (
                      <span key={t.id} className="w-1.5 h-1.5 rounded-sm bg-zinc-400/70" />
                    ))}
                  </div>
                  {total > 4 && <span className="text-[9px] text-muted-foreground">+{total - 4}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-zinc-400/70" />
          <span className="text-xs text-muted-foreground">Task</span>
        </div>
        {Object.entries(PRIORITY_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-muted-foreground capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
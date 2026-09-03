import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalenderStore } from "../../stores/CalenderStore";
import { getShortMonthName, getTodayISO } from "../../lib/dateUtils";

export default function YearView({ selectedDate, onSelectDate, onSelectMonth }) {
  const plans = useCalenderStore((s) => s.plans);
  const today = getTodayISO();
  const [year, setYear] = useState(() => new Date().getFullYear());

  const plansByDate = plans.reduce((acc, p) => {
    if (!acc[p.dateISO]) acc[p.dateISO] = 0;
    acc[p.dateISO]++;
    return acc;
  }, {});

  const prevYear = () => setYear((y) => y - 1);
  const nextYear = () => setYear((y) => y + 1);

  const getHeatColor = (count) => {
    if (count === 0) return "bg-accent";
    if (count <= 2) return "bg-primary/30";
    if (count <= 5) return "bg-primary/60";
    return "bg-primary";
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card">
      {/* Year navigation */}
      <div className="flex items-center justify-center gap-8 py-2 mb-6">
        <button onClick={prevYear} className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-3xl font-light tracking-tight text-foreground">{year}</h2>
        <button onClick={nextYear} className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Months grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, monthIdx) => {
          const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
          const firstWeekday = new Date(year, monthIdx, 1).getDay();

          return (
            <motion.button
              key={monthIdx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectMonth(monthIdx)}
              className={`p-3 rounded-xl border text-left transition-all ${
                monthIdx === new Date(today + "T00:00:00").getMonth() && year === new Date(today + "T00:00:00").getFullYear()
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-accent hover:border-primary/30"
              }`}
            >
              <h3 className="text-sm font-semibold mb-2 text-foreground">{getShortMonthName(monthIdx)}</h3>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <span key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }, (_, d) => {
                  const dateISO = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;
                  const count = plansByDate[dateISO] || 0;
                  const isTodayDay = dateISO === today;
                  return (
                    <span
                      key={d}
                      className={`aspect-square rounded-[3px] flex items-center justify-center text-[8px] ${getHeatColor(count)} ${
                        isTodayDay ? "ring-1 ring-primary" : ""
                      }`}
                    />
                  );
                })}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
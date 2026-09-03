import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, LayoutGrid, CalendarRange, CalendarClock, ListTodo, Plus } from "lucide-react";
import { useCalenderStore } from "../../stores/CalenderStore";
import { getTodayISO } from "../../lib/dateUtils";
import { getDayName, getMonthName } from "../../lib/dateUtils";
import MonthView from "../calendar/MonthView";
import WeekView from "../calendar/WeekView";
import YearView from "../calendar/YearView";
import AgendaView from "../calendar/AgendaView";
import DayDetailPanel from "../calendar/DayDetailPanel";
import PlanForm from "../calendar/PlanForm";

const VIEWS = [
  { id: "month", label: "Month", icon: LayoutGrid },
  { id: "week", label: "Week", icon: CalendarRange },
  { id: "year", label: "Year", icon: CalendarClock },
  { id: "agenda", label: "Agenda", icon: ListTodo },
];

export default function CalendarPage() {
  const selectedDate = useCalenderStore((s) => s.selectedDate);
  const setSelectedDate = useCalenderStore((s) => s.setSelectedDate);
  const plans = useCalenderStore((s) => s.plans);

  const [view, setView] = useState("month");
  const [panelOpen, setPanelOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setSelectedDate(selectedDate || getTodayISO());
  }, []);

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setPanelOpen(true);
  };

  const handleSelectMonth = (monthIdx) => {
    const parts = selectedDate.split("-");
    const year = Number(parts[0]);
    const day = Math.min(Number(parts[2]), new Date(year, monthIdx + 1, 0).getDate());
    const newDate = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(newDate);
    setView("month");
  };

  const plansToday = plans.filter((p) => p.dateISO === selectedDate).length;

  const title = (() => {
    const d = new Date(selectedDate + "T00:00:00");
    return `${getDayName(selectedDate)}, ${getMonthName(d.getMonth())} ${d.getDate()}`;
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl lg:text-3xl font-medium tracking-tight flex items-center gap-3"
          >
            <CalendarDays size={28} className="text-primary" />
            Calendar
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-sm mt-1">
            {title} · {plansToday} plan{plansToday !== 1 ? "s" : ""}
          </motion.p>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-2 bg-accent p-1 rounded-xl border border-border w-fit">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                view === v.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <v.icon size={15} />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          {view === "month" && <MonthView selectedDate={selectedDate} onSelectDate={handleSelectDate} />}
          {view === "week" && <WeekView selectedDate={selectedDate} onSelectDate={handleSelectDate} />}
          {view === "year" && (
            <YearView selectedDate={selectedDate} onSelectDate={handleSelectDate} onSelectMonth={handleSelectMonth} />
          )}
          {view === "agenda" && <AgendaView onSelectDate={handleSelectDate} />}
        </motion.div>
      </AnimatePresence>

      {/* Floating add button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddForm(!showAddForm)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
      >
        <Plus size={22} />
      </motion.button>

      {/* Quick add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-40 w-80"
          >
            <PlanForm dateISO={selectedDate} onClose={() => setShowAddForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day detail panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setPanelOpen(false)} />
            <DayDetailPanel dateISO={selectedDate} onClose={() => setPanelOpen(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
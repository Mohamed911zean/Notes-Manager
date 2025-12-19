import React, { useState, useEffect } from "react";
import { Calendar } from "./ui/calendar.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Trash2, CheckCircle2, Circle, Clock, Tag, AlertCircle } from "lucide-react";
import { setMonth, setYear, format } from "date-fns";
import { useCalenderStore } from "../stores/CalenderStore";
import toast from "react-hot-toast";
import SideBar from "./sidebar.jsx";

export default function CalendarPage() {
  const { 
    selectedDate, 
    setSelectedDate, 
    plans, 
    addPlan, 
    togglePlan, 
    removePlan, 
    getPlansByDate,
    getDatesWithPlans,
    syncToFirestore
  } = useCalenderStore();

  const [date, setDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return isNaN(d) ? new Date() : d;
  });
  const [view, setView] = useState("month");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanTime, setNewPlanTime] = useState("");
  const [newPlanPriority, setNewPlanPriority] = useState("medium");
  const [newPlanType, setNewPlanType] = useState("event");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Sync local date with store
  useEffect(() => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setSelectedDate(dateStr);
    }
  }, [date, setSelectedDate]);

  const handleMonthSelect = (monthIndex) => {
    const newDate = setMonth(setYear(date, currentYear), monthIndex);
    setDate(newDate);
    setView("month");
  };

  const nextYear = () => setCurrentYear(prev => prev + 1);
  const prevYear = () => setCurrentYear(prev => prev - 1);

  // Add plan modal function with Egypt timezone
  const handleAddPlan = async (e) => {
    e.preventDefault();

    // Egypt timezone
    const egyptDate = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
    const today = new Date(egyptDate);
    const selected = new Date(selectedDate);

    if (selected.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
      toast.error("Cannot add plans to past dates.");
      return;
    }

    if (!newPlanTitle.trim()) return;

    await addPlan({
      title: newPlanTitle,
      time: newPlanTime,
      priority: newPlanPriority,
      type: newPlanType
    });

    // Sync to Firebase
    await syncToFirestore();

    setNewPlanTitle("");
    setNewPlanTime("");
    setNewPlanPriority("medium");
    setShowAddForm(false);
    toast.success("Plan added successfully!");
  };

  const currentPlans = getPlansByDate(selectedDate);
  const datesWithPlans = getDatesWithPlans();

  // Custom Day Component to show indicators
  const modifiers = {
    hasPlan: (date) => datesWithPlans.includes(format(date, "yyyy-MM-dd"))
  };

  const modifiersStyles = {
    hasPlan: {
      fontWeight: 'bold',
      textDecoration: 'underline',
      textDecorationColor: '#fbbf24'
    }
  };

  const deletePlan = async (id) => {
    removePlan(id);
    await syncToFirestore();
    toast.success("Plan deleted successfully!");
  };

  return (
    <>
    <SideBar/>
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-8 pt-12 md:pt-0">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-3xl font-medium tracking-tight text-white flex items-center gap-3'
            >
              <CalendarIcon className="text-zinc-400" size={28} />
              Calendar
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-500 text-sm font-medium mt-1"
            >
              Manage your schedule and events
            </motion.p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
            <button
              onClick={() => setView("month")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "month" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("year")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "year" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Year
            </button>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Calendar Section */}
          <div className="lg:col-span-7 xl:col-span-8">
            <AnimatePresence mode="wait">
              {view === "month" ? (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-center h-full"
                >
                  <div className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl shadow-xl w-full flex justify-center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      month={date}
                      onMonthChange={setDate}
                      modifiers={modifiers}
                      modifiersStyles={modifiersStyles}
                      className="rounded-md border-none text-zinc-100 p-4"
                      classNames={{
                        day_selected: "bg-yellow-500 text-black hover:bg-yellow-400 hover:text-black focus:bg-yellow-500 focus:text-black font-bold",
                        day_today: "bg-zinc-800 text-zinc-100",
                        day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 hover:bg-zinc-800/50 rounded-xl transition-all text-base",
                        head_cell: "text-zinc-500 rounded-md w-12 font-medium text-sm pb-4",
                        caption: "flex justify-center pt-1 relative items-center mb-6",
                        caption_label: "text-xl font-medium text-zinc-100",
                        nav_button: "h-9 w-9 bg-zinc-800/50 p-0 hover:bg-zinc-800 rounded-xl transition-all text-zinc-100",
                        table: "w-full border-collapse space-y-1",
                        cell: "p-1"
                      }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="year"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Year Navigation */}
                  <div className="flex items-center justify-center gap-8 py-4">
                    <button 
                      onClick={prevYear}
                      className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <span className="text-4xl font-thin tracking-tight text-white">{currentYear}</span>
                    <button 
                      onClick={nextYear}
                      className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  {/* Months Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {months.map((month, index) => (
                      <motion.button
                        key={month}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMonthSelect(index)}
                        className={`p-6 rounded-2xl border text-left transition-all ${
                          index === new Date().getMonth() && currentYear === new Date().getFullYear()
                            ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500 shadow-lg shadow-yellow-500/10"
                            : "border-zinc-800/50 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900/40"
                        }`}
                      >
                        <span className="text-lg font-medium">{month}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Plans Section */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-[500px]">
            <div className="flex-1 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                  </h2>
                  <p className="text-zinc-500 text-sm">
                    {currentPlans.length} plans for today
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="p-2 rounded-full bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                >
                  <Plus size={20} />
                </motion.button>
              </div>

              {/* Add Plan Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0, mb: 0 }}
                    animate={{ opacity: 1, height: "auto", mb: 24 }}
                    exit={{ opacity: 0, height: 0, mb: 0 }}
                    onSubmit={handleAddPlan}
                    className="overflow-hidden space-y-3"
                  >
                    <input
                      type="text"
                      placeholder="What's the plan?"
                      value={newPlanTitle}
                      onChange={(e) => setNewPlanTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-yellow-500/50 transition-colors"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={newPlanTime}
                        onChange={(e) => setNewPlanTime(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
                      />
                      <select
                        value={newPlanPriority}
                        onChange={(e) => setNewPlanPriority(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-100 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-medium"
                    >
                      Add Plan
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Plans List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {currentPlans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                    <CalendarIcon size={40} className="mb-3 opacity-20" />
                    <p className="text-sm">No plans for this day</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {currentPlans.map((plan) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`group p-4 rounded-xl border transition-all ${
                          plan.completed 
                            ? "bg-zinc-900/30 border-zinc-800/30 opacity-60" 
                            : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={async () => {
                              togglePlan(plan.id);
                              await syncToFirestore();
                            }}
                            className={`mt-1 flex-shrink-0 transition-colors ${
                              plan.completed ? "text-green-500" : "text-zinc-600 hover:text-zinc-400"
                            }`}
                          >
                            {plan.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium truncate ${plan.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                              {plan.title}
                            </h3>
                            
                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                              {plan.time && (
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  <span>{plan.time}</span>
                                </div>
                              )}
                              
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                plan.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                plan.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-blue-500/10 text-blue-500'
                              }`}>
                                <AlertCircle size={10} />
                                <span className="capitalize">{plan.priority}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
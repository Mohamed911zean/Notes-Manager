import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, FolderOpen, ChevronLeft, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasksStore } from "../stores/useTasksStore";
import { useCalenderStore } from "../stores/CalenderStore";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl z-50 flex items-center gap-3 border ${
        type === "success"
          ? "bg-zinc-900 border-zinc-800 text-zinc-100"
          : "bg-zinc-900 border-zinc-800 text-red-400"
      } font-medium shadow-xl`}
    >
      <span className="text-lg">{type === "success" ? "✓" : "✕"}</span>
      <span className="text-sm">{message}</span>
    </motion.div>
  );
};

export default function DayTasksView({ day, onBack, className = "" }) {
  const plans = useCalenderStore(state => state.plans);
  const togglePlan = useCalenderStore(state => state.togglePlan);
  const removePlan = useCalenderStore(state => state.removePlan);
  const syncToFirestore = useCalenderStore(state => state.syncToFirestore);
  
  const [todayPlans, setTodayPlans] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showInputModal, setShowInputModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const addTask = useTasksStore(state => state.addTask);
  const toggleTask = useTasksStore(state => state.toggleTask);
  const removeTask = useTasksStore(state => state.removeTask);
  const allTasks = useTasksStore(state => state.tasks);

  // Egypt timezone (UTC+2)
  const egyptDate = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
  const today = new Date(egyptDate).toLocaleDateString("en-CA");
  const todayName = new Date(egyptDate).toLocaleDateString("en-CA", { weekday: 'long' });

  // Subscribe to calendar store changes
  useEffect(() => {
    const updatePlans = () => {
      // Filter plans for today's date
      const plansForDay = Array.isArray(plans) 
        ? plans.filter(plan => plan.dateISO === today)
        : [];
      
      setTodayPlans(plansForDay);
    };

    // Initial load
    updatePlans();

    // Subscribe to changes
    const unsubscribe = useCalenderStore.subscribe(updatePlans);

    return () => unsubscribe();
  }, [plans, today]);

  const isToday = true;
  const tasksForDay = allTasks.filter(task => task.dateISO === today);

  const mergedTasks = [
    ...tasksForDay.map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      done: task.done,
      source: "task",
      originalId: task.id,
    })),
    ...todayPlans.map(plan => ({
      id: `plan-${plan.id}`,
      title: plan.title,
      done: plan.completed,
      source: "calendar",
      originalId: plan.id,
      time: plan.time,
    }))
  ];

  const showToast = (message, type) => { 
    setToast({ message, type }); 
  };

  const filteredTasks = mergedTasks
    .filter(item => item.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.id.localeCompare(a.id));

  const completedTasks = mergedTasks.filter(t => t.done).length;
  const totalTasks = mergedTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleAdd = async () => {
    if (!input.trim() || isProcessing) return;

    const egyptDate = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
    const todayDate = new Date(egyptDate).toLocaleDateString("en-CA");

    setIsProcessing(true);
    try {
      // Always add tasks to TODAY (Egypt time), not day.dateISO
      await addTask({ title: input.trim(), dateISO: todayDate });
      showToast("Task created successfully", "success");
      setInput("");
      setShowInputModal(false);
    } catch (error) {
      showToast("Failed to create task", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = async (item) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (item.source === "task") {
        await toggleTask(item.originalId);
        const task = allTasks.find(t => t.id === item.originalId);
        showToast(
          task?.done ? "Task marked as incomplete" : "Task completed! 🎉", 
          "success"
        );
      } else if (item.source === "calendar") {
        // Toggle the plan
        togglePlan(item.originalId);
        
        // Sync to Firebase
        await syncToFirestore();
        
        // Find the updated plan state
        const updatedPlan = useCalenderStore.getState().plans.find(
          p => p.id === item.originalId
        );
        
        showToast(
          updatedPlan?.completed 
            ? "Plan marked as incomplete" 
            : "Plan completed! 🎉", 
          "success"
        );
      }
    } catch (error) {
      showToast("Failed to update item", "error");
      console.error("Error toggling item:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (item) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (item.source === "task") {
        await removeTask(item.originalId);
        showToast("Task deleted", "error");
      } else if (item.source === "calendar") {
        // Remove the plan
        removePlan(item.originalId);
        
        // Sync to Firebase
        await syncToFirestore();
        
        showToast("Plan deleted", "error");
      }
    } catch (error) {
      showToast("Failed to delete item", "error");
      console.error("Error removing item:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const dayName = todayName;
  const dayDate = today;

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInputModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => !isProcessing && setShowInputModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-zinc-100">New Task</h2>
                <button
                  onClick={() => !isProcessing && setShowInputModal(false)}
                  disabled={isProcessing}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <textarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey && !isProcessing) {
                    handleAdd();
                  }
                }}
                disabled={isProcessing}
                placeholder="What do you need to do?"
                className="w-full h-32 px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 outline-none placeholder-zinc-600 border border-zinc-800 focus:border-zinc-700 transition-all resize-none mb-4 disabled:opacity-50 text-sm"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  disabled={!input.trim() || isProcessing}
                  className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isProcessing ? "Adding..." : "Add Task"}
                </button>
                <button
                  onClick={() => !isProcessing && setShowInputModal(false)}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-zinc-500 mt-3 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">Ctrl</kbd> +{" "}
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">Enter</kbd> to save
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex flex-col ${className || "h-screen bg-[#09090b] text-zinc-100 pb-24"}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-zinc-100">{dayName}</h1>
                {isToday && (
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-medium rounded-full border border-zinc-700 uppercase tracking-wide">
                    Today
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-sm">{dayDate}</p>
            </div>
            {totalTasks > 0 && (
              <div className="text-right">
                <div className="text-lg font-semibold text-zinc-200">
                  {completedTasks}/{totalTasks}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">completed</div>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {totalTasks > 0 && (
            <div className="mt-4">
              <div className="bg-zinc-800/50 rounded-full h-1 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-zinc-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-6 py-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/50 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none text-zinc-200 placeholder-zinc-600 border border-zinc-800/50 focus:border-zinc-700 transition-all"
            />
          </div>
        </div>

        {/* Quick Add - Desktop */}
        <div className="px-6 pb-3">
          <input
            type="text"
            placeholder="Add a new task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isProcessing && handleAdd()}
            disabled={isProcessing}
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900/30 text-zinc-200 outline-none placeholder-zinc-600 border border-zinc-800/50 focus:border-zinc-700 transition-all disabled:opacity-50 text-sm"
          />
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {filteredTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-zinc-500"
            >
              <FolderOpen
                size={48}
                className="mb-3 opacity-20"
                strokeWidth={1.5}
              />
              <p className="text-sm mb-2 text-zinc-600">
                {search ? "No tasks found" : "No tasks yet"}
              </p>
              {!search && (
                <button
                  onClick={() => setShowInputModal(true)}
                  className="mt-2 px-4 py-1.5 bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 transition-colors text-xs font-medium"
                >
                  Add task
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    layout
                    className={`group p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all flex items-center gap-3 ${task.done ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => handleToggle(task)}
                      disabled={isProcessing}
                      className="flex-shrink-0 disabled:opacity-50"
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                        task.done
                          ? "bg-zinc-200 border-zinc-200"
                          : "border-zinc-600 hover:border-zinc-400"
                      }`}>
                        {task.done && (
                          <Check size={12} className="text-black" strokeWidth={3} />
                        )}
                      </div>
                    </button>
                    
                    <span className={`flex-1 text-sm transition-all ${
                      task.done ? "text-zinc-500 line-through" : "text-zinc-200"
                    }`}>
                      {task.title}
                    </span>

                    {task.source === "calendar" && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Calendar
                      </span>
                    )}

                    <button
                      onClick={() => handleRemove(task)}
                      disabled={isProcessing}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, FolderOpen, ChevronLeft, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasksStore } from "../stores/useTasksStore";

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
      className={`fixed top-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl z-50 flex items-center gap-3 border ${
        type === "success"
          ? "bg-emerald-500 border-emerald-400"
          : "bg-rose-500 border-rose-400"
      } text-white font-medium shadow-2xl`}
    >
      <span className="text-xl">{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
    </motion.div>
  );
};

export default function DayTasksView({ day, onBack }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const addTask = useTasksStore(state => state.addTask);
  const toggleTask = useTasksStore(state => state.toggleTask);
  const removeTask = useTasksStore(state => state.removeTask);
  const currentWeek = useTasksStore(state => state.currentWeek);

  // Get updated tasks from store
  const currentDay = currentWeek?.days.find(d => d.dateISO === day.dateISO);
  const tasks = currentDay?.tasks || [];

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const filteredTasks = tasks
    .filter((task) => task.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;


const handleAdd = async () => {
  if (!input.trim() || isProcessing) return;

  const today = new Date().toISOString().slice(0, 10);
  const isPast = day.dateISO < today;


 

  if (isPast) {
    showToast("Cannot add Task to past days ");
    return;
  }

  setIsProcessing(true);
  try {
    await addTask({ title: input.trim(), dateISO: day.dateISO });
    showToast("Task created successfully", "success");
    setInput("");
    setShowInputModal(false);
  } catch (error) {
    showToast("Failed to create task", "error");
  } finally {
    setIsProcessing(false);
  }
};


  const handleToggle = async (id) => {
    if (isProcessing) return;
    
      const today = new Date().toISOString().slice(0, 10);
        const isFuture = day.dateISO > today;

        if(isFuture)  {
            showToast("Cannot complete tasks before their day", "error");
            return;
        }

    setIsProcessing(true);
    try {
      await toggleTask(id, day.dateISO);
      const task = tasks.find(t => t.id === id);
      showToast(task?.done ? "Task marked as incomplete" : "Task completed! 🎉", "success");
    } catch (error) {
      showToast("Failed to update task", "error");
      console.error("Error toggling task:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (id) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await removeTask(id, day.dateISO);
      showToast("Task deleted", "error");
    } catch (error) {
      showToast("Failed to delete task", "error");
      console.error("Error removing task:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const dayName = new Date(day.dateISO).toLocaleDateString('en-US', { weekday: 'long' });
  const dayDate = new Date(day.dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isToday = day.dateISO === new Date().toISOString().slice(0, 10);

  

  return (
    <>
      <style>{`
        .glass {
          background: rgba(24, 24, 27, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        
        .premium-card {
          background: linear-gradient(135deg, rgba(39, 39, 42, 0.4) 0%, rgba(24, 24, 27, 0.4) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(63, 63, 70, 0.3);
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .premium-card:hover {
          transform: translateY(-2px);
          border-color: rgba(234, 179, 8, 0.3);
          box-shadow: 0 8px 32px rgba(234, 179, 8, 0.1);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .task-complete {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
          border-color: rgba(16, 185, 129, 0.3);
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
              className="w-full max-w-lg glass rounded-3xl p-6 border border-zinc-800/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold gradient-text">New Task</h2>
                <button
                  onClick={() => !isProcessing && setShowInputModal(false)}
                  disabled={isProcessing}
                  className="p-2 hover:bg-zinc-800/70 rounded-lg text-zinc-400 transition-colors disabled:opacity-50"
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
                className="w-full h-48 px-4 py-3 rounded-xl glass text-white outline-none placeholder-zinc-500 border border-zinc-800/50 focus:border-yellow-500/50 transition-all duration-300 resize-none mb-4 disabled:opacity-50"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  disabled={!input.trim() || isProcessing}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl text-black font-semibold hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                      />
                      Adding...
                    </>
                  ) : (
                    "Add Task"
                  )}
                </button>
                <button
                  onClick={() => !isProcessing && setShowInputModal(false)}
                  disabled={isProcessing}
                  className="px-6 py-3 glass rounded-xl text-white border border-zinc-800/50 hover:bg-zinc-800/50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-zinc-500 mt-3 text-center">
                Press <kbd className="px-2 py-1 bg-zinc-800 rounded">Ctrl</kbd> +{" "}
                <kbd className="px-2 py-1 bg-zinc-800 rounded">Enter</kbd> to save
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white flex flex-col pb-24">
        {/* Header */}
        <div className="px-6 py-6 border-b border-zinc-800/50">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Week</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold gradient-text">{dayName}</h1>
                {isToday && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-semibold rounded-full border border-yellow-500/30">
                    Today
                  </span>
                )}
              </div>
              <p className="text-zinc-500">{dayDate}</p>
            </div>
            {totalTasks > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {completedTasks}/{totalTasks}
                </div>
                <div className="text-xs text-zinc-500">completed</div>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {totalTasks > 0 && (
            <div className="mt-4">
              <div className="bg-zinc-800/30 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${
                    progressPercentage === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tasks"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass rounded-xl pl-11 pr-4 py-3 text-sm outline-none text-white placeholder-zinc-500 border border-zinc-800/50 focus:border-yellow-500/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Quick Add - Desktop */}
        <div className="px-6 pb-4 hidden md:block">
          <input
            type="text"
            placeholder="Write a task and press Enter..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isProcessing && handleAdd()}
            disabled={isProcessing}
            className="w-full px-4 py-3.5 rounded-xl glass text-white outline-none placeholder-zinc-500 border border-zinc-800/50 focus:border-yellow-500/50 transition-all duration-300 disabled:opacity-50"
          />
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-zinc-500"
            >
              <FolderOpen
                size={64}
                className="mb-4 opacity-20"
                strokeWidth={1.5}
              />
              <p className="text-sm mb-2">
                {search
                  ? "No tasks found"
                  : "No tasks yet for this day"}
              </p>
              {!search && (
                <button
                  onClick={() => setShowInputModal(true)}
                  className="mt-4 px-6 py-2 bg-yellow-500/20 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm font-medium"
                >
                  Add your first task
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                    className={`premium-card p-4 flex items-center gap-4 ${task.done ? 'task-complete' : ''}`}
                  >
                    <button
                      onClick={() => handleToggle(task.id)}
                      disabled={isProcessing}
                      className="flex-shrink-0 disabled:opacity-50"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          task.done
                            ? "bg-yellow-500 border-yellow-500"
                            : "border-zinc-500 hover:border-yellow-500"
                        }`}
                      >
                        {task.done && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 text-black"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </motion.svg>
                        )}
                      </motion.div>
                    </button>
                    <span
                      className={`flex-1 transition-all duration-300 ${
                        task.done
                          ? "line-through text-zinc-500"
                          : "text-white"
                      }`}
                    >
                      {task.title}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemove(task.id)}
                      disabled={isProcessing}
                      className="p-2 hover:bg-zinc-800/70 rounded-lg text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Floating Action Button - Mobile */}
        <AnimatePresence>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowInputModal(true)}
            disabled={isProcessing}
            className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-full flex items-center justify-center hover:brightness-110 transition-all z-50 shadow-2xl disabled:opacity-50"
          >
            <Plus size={28} className="text-black" strokeWidth={2.5} />
          </motion.button>
        </AnimatePresence>
      </div>
    </>
  );
}
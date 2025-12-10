import React, { useState, useEffect } from "react";
import { Calendar, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasksStore } from "../stores/useTasksStore";

export default function WeeklyOverview({ onDaySelect }) {
  const currentWeek = useTasksStore(state => state.currentWeek);
  const initializeWeek = useTasksStore(state => state.initializeWeek);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (!currentWeek && !isInitializing) {
        setIsInitializing(true);
        try {
          await initializeWeek();
        } catch (error) {
          console.error("Failed to initialize week:", error);
        } finally {
          setIsInitializing(false);
        }
      }
    };
    initialize();
  }, [currentWeek, initializeWeek, isInitializing]);

  const handleDayClick = (day) => {
    if (onDaySelect) {
      onDaySelect(day);
    }
  };

  if (!currentWeek || isInitializing) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-yellow-500" size={40} />
          <div className="text-zinc-500">Loading your week...</div>
        </div>
      </div>
    );
  }

  const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const today = new Date().toISOString().slice(0, 10);
  
  const totalTasks = currentWeek.days.reduce((sum, day) => sum + (day.tasks || []).length, 0);
  const completedTasks = currentWeek.days.reduce((sum, day) => sum + (day.tasks || []).filter(t => t.done).length, 0);
  const remainingTasks = totalTasks - completedTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="h-full bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white overflow-y-auto pb-24">
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
          transition: all 0.2s ease-out;
        }
        
        .premium-card:hover {
          transform: translateY(-1px);
          border-color: rgba(234, 179, 8, 0.3);
          box-shadow: 0 4px 16px rgba(234, 179, 8, 0.08);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .day-card {
          background: linear-gradient(135deg, rgba(39, 39, 42, 0.5) 0%, rgba(24, 24, 27, 0.5) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(63, 63, 70, 0.3);
          transition: all 0.2s ease-out;
          cursor: pointer;
        }

        .day-card:hover {
          transform: translateY(-2px);
          border-color: rgba(234, 179, 8, 0.5);
          box-shadow: 0 8px 24px rgba(234, 179, 8, 0.12);
        }

        .day-card:active {
          transform: translateY(-1px);
        }

        .day-card.today {
          border-color: rgba(234, 179, 8, 0.6);
          box-shadow: 0 0 32px rgba(234, 179, 8, 0.2);
        }

        .pulse-animation {
          opacity: 1;
        }
      `}</style>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-yellow-500" size={32} />
            <h1 className="text-4xl font-bold gradient-text">Weekly Overview</h1>
          </div>
          <p className="text-zinc-500">
            {new Date(currentWeek.startISO).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(currentWeek.days[6].dateISO).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Week Progress Bar */}
        {totalTasks > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-4 mb-6 border border-zinc-800/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-400">Week Progress</span>
              <span className="text-sm font-bold text-yellow-500">{progressPercentage}%</span>
            </div>
            <div className="bg-zinc-800/30 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
              />
            </div>
          </motion.div>
        )}

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {currentWeek.days.map((day, index) => {
            const isToday = day.dateISO === today;
            const taskCount = (day.tasks || []).length;
            const completedCount = (day.tasks || []).filter(t => t.done).length;
            const date = new Date(day.dateISO);
            const dayNum = date.getDate();
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const completionRate = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;

            return (
              <motion.button
                key={day.dateISO}
                onClick={() => handleDayClick(day)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                className={`day-card rounded-2xl p-6 text-left ${isToday ? 'today' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">{dayNum}</div>
                    <div className="text-sm text-zinc-500 uppercase tracking-wide">{month}</div>
                  </div>
                  {isToday && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-semibold rounded-full border border-yellow-500/30 pulse-animation"
                    >
                      Today
                    </motion.span>
                  )}
                </div>

                <div className="text-zinc-400 text-lg font-semibold mb-3">
                  {weekDays[index]}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {taskCount}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {taskCount === 1 ? 'task' : 'tasks'}
                    </div>
                  </div>

                  {taskCount > 0 && (
                    <div className="flex flex-col items-end">
                      <div className={`text-sm font-semibold ${
                        completionRate === 100 ? 'text-emerald-500' : 
                        completionRate >= 50 ? 'text-yellow-500' : 
                        'text-orange-500'
                      }`}>
                        {completedCount}/{taskCount}
                      </div>
                      <div className="text-xs text-zinc-500">completed</div>
                    </div>
                  )}
                </div>

                {taskCount > 0 && (
                  <div className="mt-4 bg-zinc-800/30 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                      className={`h-full ${
                        completionRate === 100 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      }`}
                    />
                  </div>
                )}

                {taskCount === 0 && (
                  <div className="mt-4 text-xs text-zinc-600 italic">
                    No tasks yet
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Week Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 border border-zinc-800/50"
        >
          <h2 className="text-xl font-semibold mb-4 gradient-text">Week Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30"
            >
              <div className="text-3xl font-bold text-white mb-1">
                {totalTasks}
              </div>
              <div className="text-sm text-zinc-500">Total Tasks</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/30"
            >
              <div className="text-3xl font-bold text-emerald-500 mb-1">
                {completedTasks}
              </div>
              <div className="text-sm text-zinc-500">Completed</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-xl bg-yellow-900/20 border border-yellow-700/30"
            >
              <div className="text-3xl font-bold text-yellow-500 mb-1">
                {remainingTasks}
              </div>
              <div className="text-sm text-zinc-500">Remaining</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-xl bg-blue-900/20 border border-blue-700/30"
            >
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {progressPercentage}%
              </div>
              <div className="text-sm text-zinc-500">Progress</div>
            </motion.div>
          </div>

          {/* Motivational Message */}
          {totalTasks > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 pt-4 border-t border-zinc-800/50 text-center"
            >
              <p className="text-sm text-zinc-400">
                {progressPercentage === 100 
                  ? "🎉 Amazing! You've completed all tasks this week!"
                  : progressPercentage >= 75
                  ? "💪 Great progress! Keep pushing!"
                  : progressPercentage >= 50
                  ? "📈 You're halfway there! Keep going!"
                  : progressPercentage >= 25
                  ? "🚀 Good start! Stay focused!"
                  : "✨ Let's make this week productive!"}
              </p>
            </motion.div>
          )}

          {totalTasks === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 pt-4 border-t border-zinc-800/50 text-center"
            >
              <p className="text-sm text-zinc-400">
                📝 Click on any day above to start adding tasks!
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
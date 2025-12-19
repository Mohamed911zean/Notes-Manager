import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Plus, X, Clock, Timer as TimerIcon, Coffee, Brain, Zap } from "lucide-react";
import { useTimeManagerStore } from "../stores/TimeManagerStore";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalyticsStore } from "../stores/AnaliticsStore";
import SideBar from "./sidebar.jsx";

// Simple sound hook
const useSoundEffect = (url) => {
  const audio = new Audio(url);
  return () => {
    audio.currentTime = 0;
    audio.play().catch(() => { });
  };
};

// Sound URLs
const SOUNDS = {
  click: "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3",
  alarm: "https://assets.mixkit.co/active_storage/sfx/1005/1005-preview.mp3",
  timerEnd: "https://assets.mixkit.co/active_storage/sfx/1006/1006-preview.mp3",
  success: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
};

export default function TimeManager() {
  const [customMinutes, setCustomMinutes] = useState(25);
  
  // Sounds
  const playClick = useSoundEffect(SOUNDS.click);
  const playTimerEnd = useSoundEffect(SOUNDS.timerEnd);

  const startSession = useAnalyticsStore(state => state.startSession);
  const endSession = useAnalyticsStore(state => state.endSession);

  const {
    timers,
    tickTimers,
    toggleTimer,
    removeTimer,
    addTimer,
    resetTimer
  } = useTimeManagerStore();

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => {
      tickTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, [tickTimers]);

  // Check for completed timers
  useEffect(() => {
    timers.forEach((t) => {
      if (t.remaining === 0 && t.isRunning) {
        playTimerEnd();
        toast.success("⏰ Timer completed!");
        endSession();
        setTimeout(() => removeTimer(t.id), 100);
      }
    });
  }, [timers, playTimerEnd, removeTimer, endSession]);

  const handleStartTimer = (minutes) => {
    playClick();
    addTimer({ duration: minutes * 60, isRunning: true, label: `${minutes} min` });
    startSession();
    toast.success(`${minutes} min timer started!`);
  };

  const handleToggleTimer = (id) => {
    playClick();
    toggleTimer(id);
  };

  const handleResetTimer = (id) => {
    playClick();
    resetTimer(id);
  };

  const handleDeleteTimer = (id) => {
    playClick();
    endSession();
    removeTimer(id);
    toast("Timer cancelled");
  };

  const formatTimerDisplay = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <>
    <SideBar/>
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 p-6 md:p-12">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: 'rgba(28, 28, 30, 0.9)',
          color: '#fff',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }} />

      <div className="max-w-4xl mx-auto space-y-10 pt-12 md:pt-0">
        <header className="flex flex-col gap-2">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-3xl font-medium tracking-tight text-white'
          >
            Pomodoro Focus
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 text-sm font-medium"
          >
            Manage your time and boost productivity
          </motion.p>
        </header>

        {/* Presets */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <button
            onClick={() => handleStartTimer(25)}
            className="group p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-300 flex flex-col items-center gap-3"
          >
            <div className="p-3 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
              <Brain size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-zinc-100">Focus</h3>
              <p className="text-sm text-zinc-500">25 Minutes</p>
            </div>
          </button>

          <button
            onClick={() => handleStartTimer(5)}
            className="group p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-300 flex flex-col items-center gap-3"
          >
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500 group-hover:bg-green-500/20 transition-colors">
              <Coffee size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-zinc-100">Short Break</h3>
              <p className="text-sm text-zinc-500">5 Minutes</p>
            </div>
          </button>

          <button
            onClick={() => handleStartTimer(15)}
            className="group p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-300 flex flex-col items-center gap-3"
          >
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
              <Zap size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-zinc-100">Long Break</h3>
              <p className="text-sm text-zinc-500">15 Minutes</p>
            </div>
          </button>
        </motion.div>

        {/* Custom Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-zinc-400 mb-2 block">Custom Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
            <button
              onClick={() => handleStartTimer(customMinutes)}
              className="mt-7 p-3.5 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-zinc-300 transition-colors font-medium flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Start</span>
            </button>
          </div>
        </motion.div>

        {/* Active Timers */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
            <TimerIcon size={20} className="text-zinc-400" />
            Active Timers
          </h2>
          
          <AnimatePresence mode="popLayout">
            {timers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl"
              >
                No active timers. Start one above!
              </motion.div>
            ) : (
              timers.map((timer) => (
                <motion.div
                  key={timer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-6"
                >
                  <div className="text-center sm:text-left">
                    <div className="text-5xl font-thin tracking-tight font-mono text-zinc-100">
                      {formatTimerDisplay(timer.remaining)}
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">
                      {timer.label || "Custom Timer"} • {Math.round(timer.duration / 60)} min total
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTimer(timer.id)}
                      className={`p-4 rounded-full transition-all ${
                        timer.isRunning 
                          ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" 
                          : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      }`}
                    >
                      {timer.isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>
                    
                    <button
                      onClick={() => handleResetTimer(timer.id)}
                      className="p-4 rounded-full bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
                    >
                      <RotateCcw size={24} />
                    </button>

                    <button
                      onClick={() => handleDeleteTimer(timer.id)}
                      className="p-4 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </>
  );
}
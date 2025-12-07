import React, { useState, useEffect } from "react";
import { Globe, Bell, Timer, Plus, Trash2, Clock, X } from "lucide-react";
import { useTimeManagerStore } from "../stores/TimeManagerStore";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalyticsStore } from "../stores/AnaliticsStore";
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

export default function ClockView() {
  const [activeTab, setActiveTab] = useState("world");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [alarmHour, setAlarmHour] = useState(12);
  const [alarmMinute, setAlarmMinute] = useState(0);
  const [alarmLabel, setAlarmLabel] = useState("");
  const [alarmPeriod, setAlarmPeriod] = useState("AM");
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchStartTime, setStopwatchStartTime] = useState(null);
  const [showCustomTimerModal, setShowCustomTimerModal] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);

  // Sounds
  const playClick = useSoundEffect(SOUNDS.click);
  const playAlarm = useSoundEffect(SOUNDS.alarm);
  const playTimerEnd = useSoundEffect(SOUNDS.timerEnd);
  const playSuccess = useSoundEffect(SOUNDS.success);

const startSession = useAnalyticsStore(state => state.startSession);
const endSession = useAnalyticsStore(state => state.endSession);

  const {
    timers,
    tickTimers,
    toggleTimer,
    removeTimer,
    alarms,
    addAlarm,
    removeAlarm,
    checkAlarms,
    addTimer,
  } = useTimeManagerStore();

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      tickTimers();

      if (currentTime.getSeconds() === 0) {
        const triggered = checkAlarms();
        triggered.forEach((alarm) => {
          playAlarm();
          if (Notification.permission === "granted") {
            new Notification("⏰ Alarm!", {
              body: alarm.label || "Time's up!",
            });
          }
          toast.success(`Alarm: ${alarm.label || "Time's up!"}`);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTime, tickTimers, checkAlarms, playAlarm]);

  // High-precision stopwatch
  useEffect(() => {
    if (!stopwatchRunning) return;

    let animationFrame;
    const updateStopwatch = () => {
      setStopwatchMs(Date.now() - stopwatchStartTime);
      animationFrame = requestAnimationFrame(updateStopwatch);
    };

    animationFrame = requestAnimationFrame(updateStopwatch);
    return () => cancelAnimationFrame(animationFrame);
  }, [stopwatchRunning, stopwatchStartTime]);

 // Check for completed timers and save to analytics
useEffect(() => {
  timers.forEach((t) => {
    if (t.remaining === 0 && t.isRunning) {
      playTimerEnd();
      toast.success("⏰ Timer completed!");

      // End session when timer finishes
      endSession();
      setTimeout(() => removeTimer(t.id), 100);
    }
  });
}, [timers, playTimerEnd, removeTimer, endSession]);

// Timer control
const handleQuickTimer = (minutes) => {
  playClick();
  addTimer({ duration: minutes * 60, isRunning: true });

  // Start session at the beginning of the timer
  startSession();

  toast.success(`${minutes} min timer started!`);
};

const handleCustomTimer = () => {
  playClick();
  setShowCustomTimerModal(true);
};

const handleSaveCustomTimer = () => {
  const totalSeconds = customHours * 3600 + customMinutes * 60 + customSeconds;
  if (totalSeconds > 0) {
    addTimer({ duration: totalSeconds, isRunning: true });

    // Start session at the beginning of the custom timer
    startSession();

    toast.success("Custom timer started!");
    setShowCustomTimerModal(false);
    setCustomHours(0);
    setCustomMinutes(5);
    setCustomSeconds(0);
  }
};

const handleCancelTimer = (id) => {
  playClick();

  // End session if timer is cancelled
  endSession();

  removeTimer(id);
  toast("Timer cancelled");
};

  // Stopwatch control
  const handleStopwatchStartStop = () => {
    playClick();
    if (!stopwatchRunning) {
      setStopwatchStartTime(Date.now() - stopwatchMs);
      setStopwatchRunning(true);
    } else {
      setStopwatchRunning(false);
    }
  };

  const handleStopwatchReset = () => {
    playClick();
    setStopwatchMs(0);
    setStopwatchRunning(false);
    setStopwatchStartTime(null);
  };

  // Alarm control
  const handleAddAlarm = () => {
    playSuccess();
    let hour24 = alarmHour;
    if (alarmPeriod === "PM" && alarmHour !== 12) hour24 += 12;
    if (alarmPeriod === "AM" && alarmHour === 12) hour24 = 0;

    addAlarm({ hour: hour24, minute: alarmMinute, label: alarmLabel || "Alarm" });
    setShowAlarmForm(false);
    setAlarmLabel("");
    toast.success("Alarm created!");
    if (Notification.permission === "default") Notification.requestPermission();
  };

  const handleDeleteAlarm = (id) => {
    playClick();
    removeAlarm(id);
    toast("Alarm deleted");
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const formatTimerDisplay = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const formatStopwatch = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: 'rgba(28, 28, 30, 0.9)',
          color: '#fff',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }} />

      {/* Top Navigation - Premium & Compact */}
      <motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="glass border-b border-zinc-800/50 px-4 py-3 flex items-center justify-between flex-wrap sm:flex-nowrap w-full"
>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClick(); setActiveTab("world"); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${activeTab === "world" ? "bg-zinc-900/70 text-yellow-500 shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            }`}
        >
          <Globe size={18} strokeWidth={2} />
          <span className="text-sm font-medium">World</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClick(); setActiveTab("alarm"); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${activeTab === "alarm" ? "bg-zinc-900/70 text-yellow-500 shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            }`}
        >
          <Bell size={18} strokeWidth={2} />
          <span className="text-sm font-medium">Alarm</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClick(); setActiveTab("stopwatch"); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${activeTab === "stopwatch" ? "bg-zinc-900/70 text-yellow-500 shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            }`}
        >
          <Clock size={18} strokeWidth={2} />
          <span className="text-sm font-medium">Stopwatch</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClick(); setActiveTab("timer"); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${activeTab === "timer" ? "bg-zinc-900/70 text-yellow-500 shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            }`}
        >
          <Timer size={18} strokeWidth={2} />
          <span className="text-sm font-medium">Timer</span>
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "world" && (
            <motion.div
              key="world"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center h-full px-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="text-8xl sm:text-9xl font-thin tracking-tight mb-3"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {formatTime(currentTime)}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-light text-zinc-400 tracking-wide"
              >
                {formatDate(currentTime)}
              </motion.div>
            </motion.div>
          )}

          {activeTab === "alarm" && (
            <motion.div
              key="alarm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 space-y-4"
            >
              {/* Add Alarm Form */}
              <AnimatePresence>
                {showAlarmForm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="premium-card p-6 space-y-5"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold tracking-tight gradient-text">Add Alarm</h3>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowAlarmForm(false)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <X size={22} />
                      </motion.button>
                    </div>

                    <div className="flex justify-center gap-3 py-6">
                      <select value={alarmHour} onChange={(e) => setAlarmHour(Number(e.target.value))} className="glass text-white text-4xl font-thin px-4 py-3 rounded-xl outline-none border border-zinc-800/50 focus:border-yellow-500/50 transition-all" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                      </select>
                      <span className="text-4xl font-thin self-center">:</span>
                      <select value={alarmMinute} onChange={(e) => setAlarmMinute(Number(e.target.value))} className="glass text-white text-4xl font-thin px-4 py-3 rounded-xl outline-none border border-zinc-800/50 focus:border-yellow-500/50 transition-all" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {[...Array(60)].map((_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                      </select>
                      <select value={alarmPeriod} onChange={(e) => setAlarmPeriod(e.target.value)} className="glass text-white text-2xl font-light px-3 py-3 rounded-xl outline-none border border-zinc-800/50 focus:border-yellow-500/50 transition-all" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Label"
                      value={alarmLabel}
                      onChange={(e) => setAlarmLabel(e.target.value)}
                      className="w-full glass text-white px-4 py-3.5 rounded-xl outline-none placeholder-zinc-500 text-base border border-zinc-800/50 focus:border-yellow-500/50 transition-all"
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddAlarm}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black py-3.5 rounded-xl font-semibold tracking-wide hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                    >
                      Save Alarm
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alarms List */}
              {alarms.length === 0 && !showAlarmForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-96 text-zinc-500"
                >
                  <Bell size={64} className="mb-4 opacity-20" strokeWidth={1.5} />
                  <p className="text-base font-light">No Alarms</p>
                </motion.div>
              )}

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {alarms.map((alarm, index) => {
                    let h = alarm.hour, p = "AM";
                    if (h >= 12) { p = "PM"; if (h > 12) h -= 12; }
                    if (h === 0) h = 12;
                    return (
                      <motion.div
                        key={alarm.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="premium-card p-6 flex justify-between items-center group"
                      >
                        <div>
                          <div className="text-5xl font-thin tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {h}:{String(alarm.minute).padStart(2, "0")} <span className="text-2xl font-light">{p}</span>
                          </div>
                          <div className="text-sm text-zinc-400 mt-2 font-light">{alarm.label}</div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteAlarm(alarm.id)}
                          className="p-3 hover:bg-zinc-800/70 rounded-xl text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={20} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === "stopwatch" && (
            <motion.div
              key="stopwatch"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col h-full items-center justify-center px-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="text-8xl sm:text-9xl font-thin tracking-tight mb-16"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {formatStopwatch(stopwatchMs)}
              </motion.div>
              <div className="flex gap-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStopwatchReset}
                  className="w-24 h-24 rounded-full glass border border-zinc-800/50 text-white font-medium hover:bg-zinc-800/70 transition-all text-base shadow-lg"
                >
                  Reset
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStopwatchStartStop}
                  className={`w-24 h-24 rounded-full font-semibold transition-all text-base shadow-2xl ${stopwatchRunning ? 'bg-gradient-to-br from-yellow-500 to-yellow-400 text-black shadow-yellow-500/40' : 'bg-gradient-to-br from-yellow-500 to-yellow-400 text-black shadow-yellow-500/40'}`}
                >
                  {stopwatchRunning ? "Stop" : "Start"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === "timer" && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 space-y-4"
            >
              {/* Custom Timer Modal */}
              <AnimatePresence>
                {showCustomTimerModal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="premium-card p-6 space-y-5"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold tracking-tight gradient-text">Custom Timer</h3>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowCustomTimerModal(false)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <X size={22} />
                      </motion.button>
                    </div>

                    <div className="flex justify-center gap-3 py-6">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          value={customHours}
                          onChange={(e) => setCustomHours(Math.max(0, Math.min(23, Number(e.target.value))))}
                          className="w-20 glass text-white text-4xl font-thin px-3 py-3 rounded-xl outline-none text-center border border-zinc-800/50 focus:border-yellow-500/50 transition-all"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                          min="0"
                          max="23"
                        />
                        <span className="text-xs text-zinc-500 mt-2">hours</span>
                      </div>
                      <span className="text-4xl font-thin self-center mb-6">:</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                          className="w-20 glass text-white text-4xl font-thin px-3 py-3 rounded-xl outline-none text-center border border-zinc-800/50 focus:border-yellow-500/50 transition-all"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                          min="0"
                          max="59"
                        />
                        <span className="text-xs text-zinc-500 mt-2">minutes</span>
                      </div>
                      <span className="text-4xl font-thin self-center mb-6">:</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          value={customSeconds}
                          onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                          className="w-20 glass text-white text-4xl font-thin px-3 py-3 rounded-xl outline-none text-center border border-zinc-800/50 focus:border-yellow-500/50 transition-all"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                          min="0"
                          max="59"
                        />
                        <span className="text-xs text-zinc-500 mt-2">seconds</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveCustomTimer}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black py-3.5 rounded-xl font-semibold tracking-wide hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                    >
                      Start Timer
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Timer Grid */}
              {!showCustomTimerModal && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[1, 3, 5, 10, 15, 20, 30, 45, 60].map((min, index) => (
                      <motion.button
                        key={min}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickTimer(min)}
                        className="premium-card text-white py-10 font-light text-3xl tracking-tight"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      >
                        {min}<span className="text-sm text-zinc-400 block font-normal mt-1">min</span>
                      </motion.button>
                    ))}
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCustomTimer}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all tracking-wide"
                  >
                    + Custom Timer
                  </motion.button>
                </>
              )}

              {/* Active Timers */}
              {timers.length === 0 && !showCustomTimerModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-64 text-zinc-500 "
                >
                  <Timer size={64} className="mb-4 opacity-20" strokeWidth={1.5} />
                  <p className="text-base font-light">No Timers</p>
                </motion.div>
              )}

              {!showCustomTimerModal && (
                <div className="space-y-3 mb-10">
                  <AnimatePresence mode="popLayout">
                    {timers.map((t, index) => {
                      const progress = ((t.duration - t.remaining) / t.duration) * 100;
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className="premium-card p-6 relative overflow-hidden group"
                        >
                          <motion.div
                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-yellow-500 to-yellow-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-5xl font-thin tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                {formatTimerDisplay(t.remaining)}
                              </div>
                              <div className="text-sm text-zinc-400 mt-2 font-light">
                                {Math.floor(t.duration / 60)} min
                                {!t.isRunning && <span className="text-yellow-500"> • Paused</span>}
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { playClick(); toggleTimer(t.id); }}
                                className={`w-16 h-16 rounded-full text-sm font-semibold transition-all shadow-lg ${t.isRunning ? 'bg-gradient-to-br from-yellow-500 to-yellow-400 text-black shadow-yellow-500/30' : 'bg-gradient-to-br from-yellow-500 to-yellow-400 text-black shadow-yellow-500/30'}`}
                              >
                                {t.isRunning ? "Stop" : "Start"}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCancelTimer(t.id)}
                                className="w-16 h-16 rounded-full glass border border-zinc-800/50 text-red-500 hover:bg-zinc-800/70 transition-all flex items-center justify-center shadow-lg"
                              >
                                <Trash2 size={20} />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button - Only on Alarm Tab */}
      <AnimatePresence>
        {activeTab === "alarm" && !showAlarmForm && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200 }}
            onClick={() => { playClick(); setShowAlarmForm(true); }}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-full shadow-2xl shadow-yellow-500/40 flex items-center justify-center hover:shadow-yellow-500/60 transition-shadow z-50"
          >
            <Plus size={28} className="text-black" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
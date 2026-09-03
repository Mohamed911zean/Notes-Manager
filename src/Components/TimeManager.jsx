import React, { useState, useEffect } from "react";
import { setInterval as workerSetInterval, clearInterval as workerClearInterval, setTimeout as workerSetTimeout, clearTimeout as workerClearTimeout } from "worker-timers";
import { Play, Pause, RotateCcw, Plus, X, Clock, Timer as TimerIcon, Coffee, Brain, Zap, AlertTriangle, Square, CheckSquare, SkipForward, Repeat } from "lucide-react";
import { useTimeManagerStore } from "../stores/TimeManagerStore";
import { useTasksStore } from "../stores/useTasksStore";
import { getTodayISO } from "../lib/dateUtils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalyticsStore } from "../stores/AnaliticsStore";

const useSoundEffect = (url) => {
  const audio = new Audio(url);
  return () => {
    audio.currentTime = 0;
    audio.play().catch(() => { });
  };
};

const SOUNDS = {
  click: "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3",
  alarm: "https://assets.mixkit.co/active_storage/sfx/1005/1005-preview.mp3",
  timerEnd: "https://assets.mixkit.co/active_storage/sfx/1006/1006-preview.mp3",
  success: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
};

function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-destructive/10">
            <AlertTriangle className="text-destructive" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Delete Timer?</h3>
        </div>

        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete this timer? Your progress will be lost.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-accent text-foreground hover:bg-accent transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-destructive text-white hover:opacity-90 transition-opacity font-medium"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsNumber({ label, value, onChange }) {
  return (
    <div className="flex-1">
      <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
      <input
        type="number"
        min="1"
        max="120"
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
        className="w-full bg-accent border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

function PomodoroSettingsModal({ focus, short, long, sessions, autoStart, onFocus, onShort, onLong, onSessions, onAutoStart, onClose, onApply }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-full bg-primary/10">
            <Coffee className="text-primary" size={22} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Pomodoro Settings</h3>
            <p className="text-xs text-muted-foreground">Customize your focus cycle</p>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <SettingsNumber label="Focus (min)" value={focus} onChange={onFocus} />
          <SettingsNumber label="Short break" value={short} onChange={onShort} />
          <SettingsNumber label="Long break" value={long} onChange={onLong} />
        </div>

        <div className="mb-4">
          <SettingsNumber label={`Sessions before long break`} value={sessions} onChange={onSessions} />
        </div>

        <label className="flex items-center justify-between p-3 rounded-xl bg-accent mb-6 cursor-pointer">
          <span className="text-sm text-foreground">Auto-start next phase</span>
          <input type="checkbox" checked={autoStart} onChange={(e) => onAutoStart(e.target.checked)} className="w-4 h-4 accent-primary" />
        </label>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors font-medium">
            Cancel
          </button>
          <button onClick={onApply} className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
            Apply
          </button>
        </div>
      </motion.div>
    </div>
  );
}
const PRESETS = [
  { minutes: 25, label: "Focus", sub: "25 Minutes", icon: Brain, color: "text-red-500", bg: "bg-red-500/10" },
  { minutes: 5, label: "Short Break", sub: "5 Minutes", icon: Coffee, color: "text-green-500", bg: "bg-green-500/10" },
  { minutes: 15, label: "Long Break", sub: "15 Minutes", icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
];

export default function TimeManager() {
  const [customMinutes, setCustomMinutes] = useState(25);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [timerToDelete, setTimerToDelete] = useState(null);
  const [timerStyle, setTimerStyle] = useState("circle");
  const [pomodoroSettingsOpen, setPomodoroSettingsOpen] = useState(false);

  const [localFocus, setLocalFocus] = useState(25);
  const [localShort, setLocalShort] = useState(5);
  const [localLong, setLocalLong] = useState(15);
  const [localSessions, setLocalSessions] = useState(4);
  const [localAutoStart, setLocalAutoStart] = useState(true);

  const playClick = useSoundEffect(SOUNDS.click);
  const playTimerEnd = useSoundEffect(SOUNDS.timerEnd);

  const startSession = useAnalyticsStore(state => state.startSession);
  const endSession = useAnalyticsStore(state => state.endSession);

  const {
    timers,
    tickTimers,
    stopTimer,
    removeTimer,
    addTimer,
    resetTimer,
    activeTaskId,
    activeTaskTitle,
    setActiveTask,
    pomodoroLog,
    pomodoroEnabled,
    pomodoroPhase,
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    sessionsPerCycle,
    completedFocusSessions,
    autoStartNext,
    setPomodoroSettings,
    startPomodoro,
    completePomodoroPhase,
    stopPomodoro,
  } = useTimeManagerStore();

  const tasks = useTasksStore((s) => s.tasks);
  const addPomodoroTime = useTasksStore((s) => s.addPomodoroTime);
  const todayTasks = tasks.filter((t) => t.dateISO === getTodayISO() && !t.done);
  const selectedTask = tasks.find((t) => t.id === activeTaskId);

  useEffect(() => {
    const interval = workerSetInterval(() => {
      tickTimers();
    }, 1000);
    const onVisibility = () => { if (!document.hidden) tickTimers(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { workerClearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, [tickTimers]);

  // Schedule exact completion for running timers so the end event fires
  // at the right moment even in a background tab (worker-timers is not
  // throttled by the browser).
  useEffect(() => {
    const active = timers.find((t) => t.isRunning && t.endTime);
    if (!active) return;
    const delay = Math.max(0, active.endTime - Date.now()) + 50;
    const timeout = workerSetTimeout(() => tickTimers(), Math.min(delay, 2147483647));
    return () => workerClearTimeout(timeout);
  }, [timers, tickTimers]);

  useEffect(() => {
    timers.forEach((t) => {
      if (t.remaining === 0 && t.completed) {
        playTimerEnd();
        const durationMin = Math.round((t.duration || 0) / 60);
        if (activeTaskId && durationMin > 0) {
          addPomodoroTime(activeTaskId, durationMin);
        }
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Pomodoro Complete!", {
            body: activeTaskTitle ? `Great work on "${activeTaskTitle}"!` : "Time for a break!",
            icon: "/favicon.ico",
          });
        }
        toast.success("⏰ Timer completed!");
        endSession();

        if (t.pomodoro) {
          // Advance the pomodoro cycle and (optionally) auto-start the next phase.
          completePomodoroPhase();
          workerSetTimeout(() => removeTimer(t.id), 250);
        } else {
          workerSetTimeout(() => removeTimer(t.id), 100);
        }
      }
    });
  }, [timers, playTimerEnd, removeTimer, endSession, activeTaskId, activeTaskTitle, addPomodoroTime, completePomodoroPhase]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleStartTimer = (minutes) => {
    playClick();
    const success = addTimer({ duration: minutes * 60, isRunning: true, label: `${minutes} min` });

    if (!success) {
      toast.error("You already have an active timer! Complete or delete it first.");
      return;
    }

    startSession();
    toast.success(`${minutes} min timer started!`);
  };

  const handlePauseTimer = (id) => {
    playClick();
    endSession();
    stopTimer(id, 'paused');
    toast("Timer paused");
  };

  const handleResumeTimer = (id) => {
    playClick();
    startSession();
    stopTimer(id, 'running');
    toast.success("Timer resumed");
  };

  const handleStopTimer = (id) => {
    playClick();
    endSession();
    stopTimer(id, 'stopped');
    toast("Timer stopped");
  };

  const handleResetTimer = (id) => {
    playClick();
    endSession();
    resetTimer(id);
    toast("Timer reset");
  };

  const handleDeleteTimer = (id) => {
    setTimerToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (timerToDelete) {
      playClick();
      endSession();
      removeTimer(timerToDelete);
      toast("Timer deleted");
      setDeleteModalOpen(false);
      setTimerToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setTimerToDelete(null);
  };

  const formatTimerDisplay = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getProgress = (timer) => {
    return ((timer.duration - timer.remaining) / timer.duration) * 100;
  };

  // Today's sessions stats
  const todaySessions = useAnalyticsStore(state => state.sessions).filter(
    s => s.date === new Date().toLocaleString("en-CA", { timeZone: "Africa/Cairo" })
  );
  const todayFocus = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  // Task focus time stats
  const taskFocusMap = {};
  todayTasks.forEach((t) => { if (t.trackedMinutes > 0) taskFocusMap[t.title] = t.trackedMinutes; });
  const topTaskEntries = Object.entries(taskFocusMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <AnimatePresence>
        {deleteModalOpen && (
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={cancelDelete}
            onConfirm={confirmDelete}
          />
        )}
        {pomodoroSettingsOpen && (
          <PomodoroSettingsModal
            focus={localFocus}
            short={localShort}
            long={localLong}
            sessions={localSessions}
            autoStart={localAutoStart}
            onFocus={setLocalFocus}
            onShort={setLocalShort}
            onLong={setLocalLong}
            onSessions={setLocalSessions}
            onAutoStart={setLocalAutoStart}
            onClose={() => setPomodoroSettingsOpen(false)}
            onApply={() => {
              setPomodoroSettings({
                focusMinutes: localFocus,
                shortBreakMinutes: localShort,
                longBreakMinutes: localLong,
                sessionsPerCycle: localSessions,
                autoStartNext: localAutoStart,
              });
              setPomodoroSettingsOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {timers.length === 0 ? (
        <>
          <header className="flex flex-col gap-2">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl lg:text-3xl font-medium tracking-tight flex items-center gap-3"
            >
              <TimerIcon size={28} className="text-primary" />
              Pomodoro Focus
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-sm font-medium"
            >
              Manage your time and boost productivity
            </motion.p>
          </header>

          {/* Pomodoro Mode */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="p-6 rounded-2xl border border-border bg-card"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Coffee size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    Pomodoro Mode
                    {pomodoroPhase && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                        pomodoroPhase === "focus" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                      }`}>
                        {pomodoroPhase}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {completedFocusSessions}/{sessionsPerCycle} focus sessions this cycle · {focusMinutes}m focus / {shortBreakMinutes}m short / {longBreakMinutes}m long
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setLocalFocus(focusMinutes); setLocalShort(shortBreakMinutes); setLocalLong(longBreakMinutes); setLocalSessions(sessionsPerCycle); setLocalAutoStart(autoStartNext); setPomodoroSettingsOpen(true); }}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:border-primary/40 transition-colors flex items-center gap-2"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    const ok = startPomodoro();
                    if (!ok) { toast.error("You already have an active timer!"); return; }
                    startSession();
                    toast.success("Pomodoro started!");
                  }}
                  disabled={timers.length > 0}
                  className={`px-6 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                    timers.length > 0 ? "bg-accent text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  <Play size={16} />
                  Start Pomodoro
                </button>
              </div>
            </div>
          </motion.div>

          {/* Today stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-4"
          >
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Sessions Today</p>
              <p className="text-xl font-semibold">{todaySessions.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Focus Time</p>
              <p className="text-xl font-semibold">
                {Math.floor(todayFocus / 60)}h {Math.floor(todayFocus % 60)}m
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Average</p>
              <p className="text-xl font-semibold">
                {todaySessions.length > 0 ? `${Math.floor(todayFocus / todaySessions.length / 60)}m` : "—"}
              </p>
            </div>
          </motion.div>

          {/* Task Picker */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare size={14} className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Link to task (optional)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTask(null, "")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !activeTaskId ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                No task
              </button>
              {todayTasks.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTask(t.id, t.title)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium truncate max-w-[160px] transition-colors ${
                    activeTaskId === t.id ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
            {selectedTask && <p className="text-xs text-primary mt-2">Focusing on: {selectedTask.title}</p>}
          </motion.div>

          {/* Task focus time */}
          {topTaskEntries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="p-4 rounded-xl border border-border bg-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Focus time by task today</p>
              <div className="space-y-2">
                {topTaskEntries.map(([title, min]) => (
                  <div key={title} className="flex items-center gap-3">
                    <span className="text-xs text-foreground truncate flex-1">{title}</span>
                    <span className="text-xs font-medium text-primary">{min}m</span>
                    <div className="w-24 h-1.5 rounded-full bg-accent overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((min / Math.max(...topTaskEntries.map((e) => e[1]))) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Presets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleStartTimer(preset.minutes)}
                disabled={timers.length > 0}
                className={`group p-6 rounded-2xl border border-border transition-all duration-300 flex flex-col items-center gap-3 ${
                  timers.length > 0
                    ? "bg-accent/30 opacity-50 cursor-not-allowed"
                    : "bg-card hover:border-primary/40"
                }`}
              >
                <div className={`p-3 rounded-xl ${preset.bg} ${preset.color} group-hover:scale-110 transition-transform`}>
                  <preset.icon size={24} />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">{preset.label}</h3>
                  <p className="text-sm text-muted-foreground">{preset.sub}</p>
                </div>
              </button>
            ))}
          </motion.div>

          {/* Custom Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl border border-border bg-card"
          >
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Custom Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
                  className="w-full bg-accent border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                  disabled={timers.length > 0}
                />
              </div>
              <button
                onClick={() => handleStartTimer(customMinutes)}
                disabled={timers.length > 0}
                className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                  timers.length > 0
                    ? 'bg-accent text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                <Play size={20} />
                <span>Start Timer</span>
              </button>
            </div>
          </motion.div>
        </>
      ) : (
        /* Active Timer */
        <AnimatePresence mode="popLayout">
          {timers.map((timer) => (
            <motion.div
              key={timer.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className="min-h-[calc(100vh-12rem)] flex items-center justify-center"
            >
              <div className="p-8 rounded-2xl border border-border bg-card flex flex-col items-center gap-8">
                {/* Style switcher */}
                <div className="flex gap-1 bg-accent p-1 rounded-lg">
                  {["circle", "bar", "digital"].map((style) => (
                    <button key={style} onClick={() => { playClick(); setTimerStyle(style); }} className={`px-3 py-1 rounded-md text-xs capitalize transition-all ${timerStyle === style ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{style}</button>
                  ))}
                </div>

                {timer.pomodoro && (
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xs uppercase tracking-widest font-medium px-3 py-1 rounded-full ${
                      timer.phase === "focus" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                    }`}>
                      {timer.phase === "focus" ? "Focus Session" : timer.phase === "longBreak" ? "Long Break" : "Short Break"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Session {Math.min(completedFocusSessions + (timer.phase === "focus" ? 1 : 0), sessionsPerCycle)}/{sessionsPerCycle}
                    </span>
                  </div>
                )}

                {selectedTask && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                    <CheckSquare size={14} className="text-primary" />
                    <span className="text-sm font-medium text-primary truncate max-w-[200px]">{selectedTask.title}</span>
                  </div>
                )}

                {timerStyle === "circle" ? (
                  <div className="relative flex items-center justify-center">
                    <svg className="w-72 h-72 -rotate-90">
                      <circle cx="144" cy="144" r="136" stroke="currentColor" strokeWidth="8" fill="none" className="text-border" />
                      <circle
                        cx="144"
                        cy="144"
                        r="136"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 136}`}
                        strokeDashoffset={`${2 * Math.PI * 136 * (1 - getProgress(timer) / 100)}`}
                        className={`transition-all duration-1000 ${
                          timer.status === 'running' ? 'text-primary' :
                          timer.status === 'paused' ? 'text-yellow-500' : 'text-destructive'
                        }`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-6xl font-light tracking-tight font-mono text-foreground">
                        {formatTimerDisplay(timer.remaining)}
                      </div>
                      {timer.status === 'paused' && <div className="text-sm text-muted-foreground mt-2">Paused</div>}
                      {timer.status === 'stopped' && <div className="text-sm text-muted-foreground mt-2">Stopped</div>}
                    </div>
                  </div>
                ) : timerStyle === "bar" ? (
                  <div className="w-full max-w-md space-y-6">
                    <div className="relative h-8 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${getProgress(timer)}%` }}
                      />
                    </div>
                    <div className="text-center text-5xl font-light font-mono">{formatTimerDisplay(timer.remaining)}</div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0:00</span>
                      <span>Progress: {Math.round(getProgress(timer))}%</span>
                      <span>{formatTimerDisplay(timer.duration)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-7xl font-light font-mono tracking-tight">{formatTimerDisplay(timer.remaining)}</div>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">{timer.label}</p>
                  </div>
                )}

                {/* Controls */}
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  {timer.status === 'running' && (
                    <button
                      onClick={() => handlePauseTimer(timer.id)}
                      className="w-full px-6 py-4 rounded-full bg-primary hover:opacity-90 text-primary-foreground font-medium transition-all text-lg"
                    >
                      {timerStyle === "circle" ? <Pause size={20} /> : "Pause"}
                    </button>
                  )}

                  {timer.status === 'paused' && (
                    <>
                      <button
                        onClick={() => handleResumeTimer(timer.id)}
                        className="w-full px-6 py-4 rounded-full bg-primary hover:opacity-90 text-primary-foreground font-medium transition-all text-lg"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => handleDeleteTimer(timer.id)}
                        className="w-full px-6 py-4 rounded-full border-2 border-primary text-primary hover:bg-primary/10 font-medium transition-all text-lg"
                      >
                        End
                      </button>
                    </>
                  )}

                  {timer.status === 'stopped' && (
                    <button
                      onClick={() => handleResetTimer(timer.id)}
                      className="w-full px-6 py-4 rounded-full bg-primary hover:opacity-90 text-primary-foreground font-medium transition-all text-lg"
                    >
                      Reset
                    </button>
                  )}

                  <div className="flex gap-2">
                    {timer.pomodoro && timer.status === 'running' && (
                      <button
                        onClick={() => { playClick(); completePomodoroPhase(); removeTimer(timer.id); }}
                        className="p-3 rounded-full bg-accent text-muted-foreground hover:text-primary transition-colors"
                        title="Skip phase"
                      >
                        <SkipForward size={18} />
                      </button>
                    )}
                    {timer.status === 'running' && (
                      <button
                        onClick={() => handleStopTimer(timer.id)}
                        className="p-3 rounded-full bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Stop"
                      >
                        <Square size={18} />
                      </button>
                    )}
                    {timer.status === 'paused' && (
                      <button
                        onClick={() => handleResetTimer(timer.id)}
                        className="p-3 rounded-full bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Reset"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTimer(timer.id)}
                      className="p-3 rounded-full bg-accent text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
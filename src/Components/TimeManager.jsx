import React, { useState, useEffect, useRef } from "react";
import { Globe, Bell, Timer, Plus, Trash2, Play, Pause, RotateCcw, X, Clock } from "lucide-react";
import { useTimeManagerStore } from "../stores/TimeManagerStore";
import toast, { Toaster } from 'react-hot-toast';

// Simple sound player
const useSoundEffect = (url) => {
  const audioRef = useRef(null);
  
  useEffect(() => {
    audioRef.current = new Audio(url);
  }, [url]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  return [play];
};

// Sound URLs from free sources
const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3',
  alarm: 'https://assets.mixkit.co/active_storage/sfx/1005/1005-preview.mp3', 
  timerEnd: 'https://assets.mixkit.co/active_storage/sfx/1006/1006-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
};

export default function ClockView() {
  const [activeSubTab, setActiveSubTab] = useState("world");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Sound hooks
  const [playClick] = useSoundEffect(SOUNDS.click);
  const [playAlarm] = useSoundEffect(SOUNDS.alarm);
  const [playTimerEnd] = useSoundEffect(SOUNDS.timerEnd);
  const [playSuccess] = useSoundEffect(SOUNDS.success);
  
  // Timer states (iOS Picker Style)
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerIntervalRef = useRef(null);
  
  // Stopwatch states
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const stopwatchIntervalRef = useRef(null);
  
  // Alarm states
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [alarmHour, setAlarmHour] = useState(12);
  const [alarmMinute, setAlarmMinute] = useState(0);
  const [alarmLabel, setAlarmLabel] = useState("");
  const [alarmPeriod, setAlarmPeriod] = useState("AM");

  const { alarms, addAlarm, removeAlarm, updateAlarm, checkAlarms } = useTimeManagerStore();

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check alarms every minute
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const triggeredAlarms = checkAlarms();
      if (triggeredAlarms.length > 0) {
        triggeredAlarms.forEach(alarm => {
          playAlarm();
          if (Notification.permission === "granted") {
            new Notification("⏰ Alarm!", {
              body: alarm.label || "Time's up!",
              icon: "⏰"
            });
          }
        });
      }
    }, 60000);
    
    return () => clearInterval(checkInterval);
  }, [checkAlarms, playAlarm]);

  // Timer countdown
  useEffect(() => {
    if (isTimerRunning && remainingTime > 0) {
      timerIntervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playTimerEnd();
            if (Notification.permission === "granted") {
              new Notification("⏱️ Timer Complete!", {
                body: "Your timer has finished!",
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, remainingTime, playTimerEnd]);

  // Stopwatch
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(prev => prev + 10);
      }, 10);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    }
    
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, [isStopwatchRunning]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ar-EG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimerDisplay = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatStopwatchDisplay = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    playClick();
    const totalSeconds = (timerHours * 3600) + (timerMinutes * 60) + timerSeconds;
    if (totalSeconds > 0) {
      setRemainingTime(totalSeconds);
      setIsTimerRunning(true);
      toast.success('Timer started!', {
        style: {
          background: '#1C1C1E',
          color: '#fff',
          borderRadius: '12px',
        },
        iconTheme: {
          primary: '#FF9500',
          secondary: '#fff',
        },
      });
    }
  };

  const handleCancelTimer = () => {
    playClick();
    setIsTimerRunning(false);
    setRemainingTime(0);
    toast('Timer cancelled', {
      icon: '⏹️',
      style: {
        background: '#1C1C1E',
        color: '#fff',
        borderRadius: '12px',
      },
    });
  };

  const handleStopwatchStartStop = () => {
    playClick();
    setIsStopwatchRunning(!isStopwatchRunning);
    if (!isStopwatchRunning) {
      toast.success('Stopwatch started!', {
        style: {
          background: '#1C1C1E',
          color: '#fff',
          borderRadius: '12px',
        },
        iconTheme: {
          primary: '#FF9500',
          secondary: '#fff',
        },
      });
    }
  };

  const handleStopwatchLap = () => {
    playClick();
    if (isStopwatchRunning) {
      setLaps([stopwatchTime, ...laps]);
      toast('Lap recorded', {
        icon: '🏁',
        style: {
          background: '#1C1C1E',
          color: '#fff',
          borderRadius: '12px',
        },
      });
    }
  };

  const handleStopwatchReset = () => {
    playClick();
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
    toast('Stopwatch reset', {
      icon: '🔄',
      style: {
        background: '#1C1C1E',
        color: '#fff',
        borderRadius: '12px',
      },
    });
  };

  const handleAddAlarm = () => {
    playSuccess();
    let hour24 = alarmHour;
    if (alarmPeriod === "PM" && alarmHour !== 12) {
      hour24 = alarmHour + 12;
    } else if (alarmPeriod === "AM" && alarmHour === 12) {
      hour24 = 0;
    }

    addAlarm({
      hour: hour24,
      minute: alarmMinute,
      label: alarmLabel || "Alarm",
    });

    setShowAlarmForm(false);
    setAlarmLabel("");
    setAlarmHour(12);
    setAlarmMinute(0);
    setAlarmPeriod("AM");

    toast.success('Alarm created!', {
      style: {
        background: '#1C1C1E',
        color: '#fff',
        borderRadius: '12px',
      },
      iconTheme: {
        primary: '#FF9500',
        secondary: '#fff',
      },
    });

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const handleDeleteAlarm = (id) => {
    playClick();
    removeAlarm(id);
    toast.error('Alarm deleted', {
      style: {
        background: '#1C1C1E',
        color: '#fff',
        borderRadius: '12px',
      },
    });
  };

  const handleTabChange = (tab) => {
    playClick();
    setActiveSubTab(tab);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toast Container */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
        }}
      />
      
      {/* Sub Tabs Navigation */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex bg-zinc-800 rounded-xl p-1">
          <button
            onClick={() => handleTabChange("world")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === "world"
                ? "bg-zinc-900 text-white shadow-lg"
                : "text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Globe size={14} />
              <span>Clock</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange("alarm")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === "alarm"
                ? "bg-zinc-900 text-white shadow-lg"
                : "text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Bell size={14} />
              <span>Alarm</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange("stopwatch")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === "stopwatch"
                ? "bg-zinc-900 text-white shadow-lg"
                : "text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Clock size={14} />
              <span>Stopwatch</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange("timer")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === "timer"
                ? "bg-zinc-900 text-white shadow-lg"
                : "text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Timer size={14} />
              <span>Timer</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* World Clock View */}
        {activeSubTab === "world" && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-7xl font-bold text-white mb-6 tracking-tight">
              {formatTime(currentTime)}
            </div>
            <div className="text-xl text-zinc-400">
              {formatDate(currentTime)}
            </div>
          </div>
        )}

        {/* Alarm View */}
        {activeSubTab === "alarm" && (
          <div className="space-y-3">
            <button
              onClick={() => {
                playClick();
                setShowAlarmForm(!showAlarmForm);
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Plus size={20} />
              <span>Add Alarm</span>
            </button>

            {showAlarmForm && (
              <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">New Alarm</h3>
                  <button
                    onClick={() => {
                      playClick();
                      setShowAlarmForm(false);
                    }}
                    className="p-2 hover:bg-zinc-800 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <select
                    value={alarmHour}
                    onChange={(e) => setAlarmHour(Number(e.target.value))}
                    className="bg-zinc-800 text-white text-3xl font-bold px-4 py-2 rounded-xl outline-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="text-3xl font-bold">:</span>
                  <select
                    value={alarmMinute}
                    onChange={(e) => setAlarmMinute(Number(e.target.value))}
                    className="bg-zinc-800 text-white text-3xl font-bold px-4 py-2 rounded-xl outline-none"
                  >
                    {[...Array(60)].map((_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={alarmPeriod}
                    onChange={(e) => setAlarmPeriod(e.target.value)}
                    className="bg-zinc-800 text-white text-2xl font-bold px-3 py-2 rounded-xl outline-none"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                  placeholder="Alarm label (optional)"
                  className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl outline-none"
                />

                <button
                  onClick={handleAddAlarm}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
                >
                  Save Alarm
                </button>
              </div>
            )}

            {alarms.length === 0 && !showAlarmForm ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <Bell size={64} className="mb-4 opacity-50" />
                <p className="text-lg">No Alarms</p>
                <p className="text-sm mt-2">Tap "Add Alarm" to create one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alarms.map((alarm) => {
                  let displayHour = alarm.hour;
                  let period = "AM";
                  
                  if (displayHour >= 12) {
                    period = "PM";
                    if (displayHour > 12) displayHour -= 12;
                  }
                  if (displayHour === 0) displayHour = 12;

                  return (
                    <div
                      key={alarm.id}
                      className="bg-zinc-900 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-800 transition"
                    >
                      <div className="flex-1">
                        <div className="text-3xl font-bold mb-1">
                          {String(displayHour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')} {period}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {alarm.label}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAlarm(alarm.id)}
                        className="p-2 hover:bg-zinc-700 rounded-lg text-red-500 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stopwatch View */}
        {activeSubTab === "stopwatch" && (
          <div className="flex flex-col h-full">
            {/* Time Display */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-7xl font-bold text-white tracking-tight">
                {formatStopwatchDisplay(stopwatchTime)}
              </div>
            </div>

            {/* Laps List */}
            {laps.length > 0 && (
              <div className="bg-zinc-900 rounded-2xl p-4 mb-4 max-h-48 overflow-y-auto">
                <h3 className="text-sm font-semibold mb-3 text-zinc-400">Laps</h3>
                <div className="space-y-2">
                  {laps.map((lap, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Lap {laps.length - index}</span>
                      <span className="font-mono">{formatStopwatchDisplay(lap)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-4 pb-4">
              <button
                onClick={handleStopwatchReset}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 rounded-xl transition"
              >
                Reset
              </button>
              {isStopwatchRunning && (
                <button
                  onClick={handleStopwatchLap}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 rounded-xl transition"
                >
                  Lap
                </button>
              )}
              <button
                onClick={handleStopwatchStartStop}
                className={`flex-1 font-semibold py-4 rounded-xl transition ${
                  isStopwatchRunning
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isStopwatchRunning ? "Stop" : "Start"}
              </button>
            </div>
          </div>
        )}

        {/* Timer View - iOS Picker Style */}
        {activeSubTab === "timer" && (
          <div className="flex flex-col h-full">
            {remainingTime === 0 ? (
              <>
                {/* iOS Style Picker */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    {/* Hours Picker */}
                    <div className="flex flex-col items-center">
                      <div className="text-6xl font-light text-white bg-zinc-900 rounded-2xl px-6 py-4 w-32 text-center">
                        {String(timerHours).padStart(2, '0')}
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          onClick={() => {
                            playClick();
                            setTimerHours(prev => (prev + 1) % 24);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"
                        >
                          <span className="text-xl">▲</span>
                        </button>
                        <button
                          onClick={() => {
                            playClick();
                            setTimerHours(prev => (prev - 1 + 24) % 24);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"
                        >
                          <span className="text-xl">▼</span>
                        </button>
                      </div>
                      <span className="text-sm text-zinc-400 mt-2">hours</span>
                    </div>

                    <span className="text-6xl font-light text-zinc-500 mb-16">:</span>

                    {/* Minutes Picker */}
                    <div className="flex flex-col items-center">
                      <div className="text-6xl font-light text-white bg-zinc-900 rounded-2xl px-6 py-4 w-32 text-center">
                        {String(timerMinutes).padStart(2, '0')}
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          onClick={() => {
                            playClick();
                            setTimerMinutes(prev => (prev + 1) % 60);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"
                        >
                          <span className="text-xl">▲</span>
                        </button>
                        <button
                          onClick={() => {
                            playClick();
                            setTimerMinutes(prev => (prev - 1 + 60) % 60);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"
                        >
                          <span className="text-xl">▼</span>
                        </button>
                      </div>
                      <span className="text-sm text-zinc-400 mt-2">min</span>
                    </div>

                    <span className="text-6xl font-light text-zinc-500 mb-16">:</span>

                    {/* Seconds Picker */}
                    <div className="flex flex-col items-center">
                      <div className="text-6xl font-light text-white bg-zinc-900 rounded-2xl px-6 py-4 w-32 text-center">
                        {String(timerSeconds).padStart(2, '0')}
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          onClick={() => {
                            playClick();
                            setTimerSeconds(prev => (prev + 1) % 60);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"
                        >
                          <span className="text-xl">▲</span>
                        </button>
                        <button
                          onClick={() => {
                            playClick();
                            setTimerSeconds(prev => (prev - 1 + 60) % 60);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"
                        >
                          <span className="text-xl">▼</span>
                        </button>
                      </div>
                      <span className="text-sm text-zinc-400 mt-2">sec</span>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <div className="pb-4">
                  <button
                    onClick={handleStartTimer}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition text-lg"
                  >
                    Start
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Timer Running Display */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="text-7xl font-bold text-white mb-8 tracking-tight">
                    {formatTimerDisplay(remainingTime)}
                  </div>

                  {/* Progress Ring */}
                  <div className="relative w-64 h-64">
                    <svg className="transform -rotate-90 w-64 h-64">
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-zinc-800"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 120}`}
                        strokeDashoffset={`${2 * Math.PI * 120 * (1 - remainingTime / ((timerHours * 3600) + (timerMinutes * 60) + timerSeconds))}`}
                        className="text-yellow-500 transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-4 pb-4">
                  <button
                    onClick={handleCancelTimer}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      playClick();
                      setIsTimerRunning(!isTimerRunning);
                    }}
                    className={`flex-1 font-semibold py-4 rounded-xl transition ${
                      isTimerRunning
                        ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isTimerRunning ? "Pause" : "Resume"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
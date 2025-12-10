import { useEffect, useRef, useState } from "react";

export function useTimer(initialDurationMs) {
  const [remaining, setRemaining] = useState(initialDurationMs);
  const [running, setRunning] = useState(false);

  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const start = () => {
    if (running) return;
    setRunning(true);

    const now = Date.now();
    endTimeRef.current = now + remaining;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const r = endTimeRef.current - now;
      if (r <= 0) {
        setRemaining(0);
        setRunning(false);
        clearInterval(intervalRef.current);
      } else {
        setRemaining(r);
      }
    }, 200); // تحديث 5 مرات في الثانية يكفي
  };

  const pause = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
  };

  const reset = () => {
    pause();
    setRemaining(initialDurationMs);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return {
    remainingMs: remaining,
    remainingSeconds: Math.ceil(remaining / 1000),
    running,
    start,
    pause,
    reset,
  };
}

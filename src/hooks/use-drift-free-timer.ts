import { useCallback, useEffect, useRef, useState } from "react";

interface UseDriftFreeTimerOptions {
  initialSeconds: number;
  onComplete: () => Promise<void> | void;
}

export function useDriftFreeTimer({ initialSeconds, onComplete }: UseDriftFreeTimerOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(initialSeconds * 1000);

  const targetEndTimeRef = useRef<number | null>(null);
  const completingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const setDurationSeconds = useCallback((seconds: number, startImmediately: boolean) => {
    completingRef.current = false;
    const nextMs = seconds * 1000;
    if (startImmediately) {
      targetEndTimeRef.current = Date.now() + nextMs;
      setRemainingMs(nextMs);
      setIsRunning(true);
    } else {
      targetEndTimeRef.current = null;
      setIsRunning(false);
      setRemainingMs(nextMs);
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    if (targetEndTimeRef.current === null) {
      targetEndTimeRef.current = Date.now() + remainingMs;
    }

    const triggerComplete = () => {
      if (completingRef.current) return;
      completingRef.current = true;
      targetEndTimeRef.current = null;
      setRemainingMs(0);
      setIsRunning(false);
      void Promise.resolve(onCompleteRef.current()).finally(() => {
        completingRef.current = false;
      });
    };

    const syncClock = () => {
      const endAt = targetEndTimeRef.current;
      if (endAt === null) return;

      const msLeft = endAt - Date.now();
      if (msLeft <= 0) {
        triggerComplete();
      } else {
        setRemainingMs(msLeft);
      }
    };

    syncClock();
    const intervalId = window.setInterval(syncClock, 250);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncClock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isRunning, remainingMs]);

  const togglePlayPause = useCallback(() => {
    if (isRunning) {
      const now = Date.now();
      const left = Math.max(0, (targetEndTimeRef.current ?? now) - now);
      targetEndTimeRef.current = null;
      setRemainingMs(left);
      setIsRunning(false);
    } else {
      const effectiveMs = remainingMs > 0 ? remainingMs : initialSeconds * 1000;
      targetEndTimeRef.current = Date.now() + effectiveMs;
      setRemainingMs(effectiveMs);
      setIsRunning(true);
    }
  }, [isRunning, remainingMs, initialSeconds]);

  const reset = useCallback(() => {
    setDurationSeconds(initialSeconds, false);
  }, [setDurationSeconds, initialSeconds]);

  return {
    isRunning,
    remainingMs,
    togglePlayPause,
    reset,
    setDurationSeconds,
  };
}

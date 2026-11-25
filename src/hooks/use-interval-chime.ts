import { useCallback, useEffect, useRef, useState } from "react";

const CHIME_STORAGE_KEY = "pomodoro-pglite:chime-enabled";

function readInitialChimeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = window.localStorage.getItem(CHIME_STORAGE_KEY);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export function useIntervalChime() {
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(readInitialChimeEnabled);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHIME_STORAGE_KEY, String(chimeEnabled));
    } catch {
      // Ignore storage quota or privacy-mode errors
    }
  }, [chimeEnabled]);

  const getAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof window === "undefined") return null;

    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) return null;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }

    if (audioCtxRef.current.state === "suspended") {
      try {
        await audioCtxRef.current.resume();
      } catch {
        return null;
      }
    }

    return audioCtxRef.current;
  }, []);

  const toggleChime = useCallback(() => {
    setChimeEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Warm up / unlock AudioContext on user toggle gesture
        void getAudioContext();
      }
      return next;
    });
  }, [getAudioContext]);

  const playChime = useCallback(
    async (variant: "pomodoro" | "routine" = "pomodoro") => {
      if (!chimeEnabled) return;

      const ctx = await getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes =
        variant === "pomodoro"
          ? [
              { freq: 880, start: 0, duration: 0.22 }, // A5
              { freq: 1318.51, start: 0.16, duration: 0.45 }, // E6
            ]
          : [
              { freq: 659.25, start: 0, duration: 0.18 }, // E5
              { freq: 880, start: 0.14, duration: 0.35 }, // A5
            ];

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, now + note.start);

        gain.gain.setValueAtTime(0.0001, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.14, now + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration + 0.02);
      }
    },
    [chimeEnabled, getAudioContext],
  );

  return {
    chimeEnabled,
    toggleChime,
    playChime,
  };
}

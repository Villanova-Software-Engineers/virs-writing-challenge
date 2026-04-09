// src/context/TimerContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { auth } from "../firebase/config";

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [description, setDescriptionState] = useState("");
  const [sessionSavedToday, setSessionSavedToday] = useState(false);

  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  const getStorageKey = (key) => {
    const userId = auth.currentUser?.uid;
    return userId ? `${key}_${userId}` : key;
  };

  // Track current user and reset timer when user changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // User logged out - reset everything
        setSeconds(0);
        startTimeRef.current = null;
        pausedTimeRef.current = 0;
        setIsRunning(false);
        setDescriptionState("");
        setSessionSavedToday(false);
        return;
      }

      // User logged in - load their data from localStorage
      const savedStartTime = localStorage.getItem(getStorageKey("timerStartTime"));
      const savedPausedTime = localStorage.getItem(getStorageKey("timerPausedTime"));
      const savedIsRunning = localStorage.getItem(getStorageKey("timerIsRunning"));
      const savedDescription = localStorage.getItem(getStorageKey("timerDescription"));

      if (savedDescription) setDescriptionState(savedDescription);

      if (savedStartTime) {
        startTimeRef.current = parseInt(savedStartTime, 10);
        pausedTimeRef.current = savedPausedTime ? parseInt(savedPausedTime, 10) : 0;

        if (savedIsRunning === "true") {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setSeconds(elapsed);
          setIsRunning(true);
        } else {
          const elapsed = Math.floor(pausedTimeRef.current / 1000);
          setSeconds(elapsed);
        }
      } else {
        // No saved data for this user - reset to fresh state
        setSeconds(0);
        startTimeRef.current = null;
        pausedTimeRef.current = 0;
        setIsRunning(false);
        setDescriptionState("");
      }
    });

    return () => unsubscribe();
  }, []);

  // Tick every second when running
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning]);

  // Auto-stop at 11:59 PM EST (mirrors Timer.jsx behaviour)
  useEffect(() => {
    const checkCutoff = () => {
      const now = new Date();
      const estTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      if (estTime.getHours() === 23 && estTime.getMinutes() === 59 && isRunning) {
        handleStop();
      }
    };
    const interval = setInterval(checkCutoff, 30000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStop = useCallback(() => {
    if (!isRunning) return;
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setSeconds(elapsed);
    pausedTimeRef.current = elapsed * 1000;
    localStorage.setItem(getStorageKey("timerPausedTime"), pausedTimeRef.current.toString());
    localStorage.setItem(getStorageKey("timerIsRunning"), "false");
    setIsRunning(false);
  }, [isRunning]);

  const handleToggle = useCallback(() => {
    if (isRunning) {
      handleStop();
    } else {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        pausedTimeRef.current = 0;
      } else {
        startTimeRef.current = Date.now() - pausedTimeRef.current;
      }
      localStorage.setItem(getStorageKey("timerStartTime"), startTimeRef.current.toString());
      localStorage.setItem(getStorageKey("timerIsRunning"), "true");
      setIsRunning(true);
    }
  }, [isRunning, handleStop]);

  const handleReset = useCallback(() => {
    setSeconds(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    setIsRunning(false);
    setDescriptionState("");
    localStorage.removeItem(getStorageKey("timerStartTime"));
    localStorage.removeItem(getStorageKey("timerPausedTime"));
    localStorage.removeItem(getStorageKey("timerIsRunning"));
    localStorage.removeItem(getStorageKey("timerDescription"));
  }, []);

  const setDescription = useCallback((desc) => {
    setDescriptionState(desc);
    localStorage.setItem(getStorageKey("timerDescription"), desc);
  }, []);

  return (
    <TimerContext.Provider value={{
      seconds,
      isRunning,
      description,
      sessionSavedToday,
      handleToggle,
      handleReset,
      handleStop,
      setDescription,
      setSessionSavedToday,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimerContext must be used within TimerProvider");
  return ctx;
}

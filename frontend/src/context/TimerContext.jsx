// src/context/TimerContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { auth } from "../firebase/config";
import { useSessionState, useUpdateSessionState, useResetSessionState } from "../hooks/useApi";

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [description, setDescriptionState] = useState("");
  const [sessionSavedToday, setSessionSavedToday] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const hasInitializedFromBackend = useRef(false);
  const isResetting = useRef(false);

  // Backend session state - only fetch when authenticated
  const { data: sessionState } = useSessionState({
    enabled: isAuthenticated,
  });
  const updateSessionStateMutation = useUpdateSessionState();
  const resetSessionStateMutation = useResetSessionState();

  // Sync to backend periodically when state changes
  const syncToBackend = useCallback(() => {
    if (!auth.currentUser || updateSessionStateMutation.isPending) return;

    // Calculate current elapsed time if running
    const currentSeconds = isRunning && startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : seconds;

    updateSessionStateMutation.mutate({
      accumulated_seconds: currentSeconds,
      description: description || null,
      is_running: isRunning,
      session_start_time: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : null,
      last_pause_time: pausedTimeRef.current ? new Date(Date.now() - pausedTimeRef.current).toISOString() : null,
    });
  }, [seconds, description, isRunning, updateSessionStateMutation]);

  // Load state from backend when sessionState is fetched
  useEffect(() => {
    if (!sessionState || !auth.currentUser) return;

    // Only load from backend once per login session
    if (hasInitializedFromBackend.current) return;

    // Don't reload if we're in the middle of resetting
    if (isResetting.current) return;

    hasInitializedFromBackend.current = true;

    if (sessionState.is_running && sessionState.session_start_time) {
      // Timer was running - calculate current elapsed time from session_start_time
      const sessionStartMs = new Date(sessionState.session_start_time).getTime();
      const currentElapsed = Math.floor((Date.now() - sessionStartMs) / 1000);

      startTimeRef.current = sessionStartMs;
      pausedTimeRef.current = 0;
      setSeconds(currentElapsed);
      setIsRunning(true);
    } else if (sessionState.accumulated_seconds > 0) {
      // Timer was paused - use accumulated_seconds directly
      const accumulatedMs = sessionState.accumulated_seconds * 1000;

      pausedTimeRef.current = accumulatedMs;
      startTimeRef.current = Date.now() - accumulatedMs;
      setSeconds(sessionState.accumulated_seconds);
      setIsRunning(false);
    }

    if (sessionState.description) {
      setDescriptionState(sessionState.description);
    }
  }, [sessionState]);

  // Debounced sync to backend (every 3 seconds when running)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      syncToBackend();
    }, 3000); // Sync every 3 seconds for more frequent saves

    return () => clearInterval(interval);
  }, [isRunning, syncToBackend]);

  // Save state when browser is closing or page is unloading
  useEffect(() => {
    const syncBeforeUnload = async () => {
      if (!auth.currentUser || !startTimeRef.current) return;

      // Calculate current elapsed time
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const data = {
        accumulated_seconds: elapsed,
        description: description || null,
        is_running: isRunning,
        session_start_time: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : null,
        last_pause_time: isRunning ? null : new Date().toISOString(),
      };

      // Get token synchronously if possible
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();

        // Use fetch with keepalive for reliable delivery during page unload
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sessions/state`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {
          // Silently fail - browser is closing anyway
        });
      } catch {
        // Silently fail - browser is closing anyway
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncBeforeUnload();
      }
    };

    const handlePageHide = () => {
      syncBeforeUnload();
    };

    // Listen to multiple events for better cross-browser support
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isRunning, description]);

  // Track current user and reset timer when user changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // User logged out - reset everything
        setIsAuthenticated(false);
        setSeconds(0);
        startTimeRef.current = null;
        pausedTimeRef.current = 0;
        setIsRunning(false);
        setDescriptionState("");
        setSessionSavedToday(false);
        hasInitializedFromBackend.current = false;
        return;
      } else {
        // User logged in - enable backend queries and allow re-initialization
        setIsAuthenticated(true);
        hasInitializedFromBackend.current = false; // Reset flag so we load from backend
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStop = useCallback(() => {
    if (!isRunning) return;
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setSeconds(elapsed);
    pausedTimeRef.current = elapsed * 1000;
    setIsRunning(false);

    // Sync to backend immediately when stopping
    if (auth.currentUser && !updateSessionStateMutation.isPending) {
      updateSessionStateMutation.mutate({
        accumulated_seconds: elapsed,
        description: description || null,
        is_running: false,
        session_start_time: null,
        last_pause_time: new Date().toISOString(),
      });
    }
  }, [isRunning, description, updateSessionStateMutation]);

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

  // Auto-save at 11:59 PM EST
  useEffect(() => {
    const checkCutoff = () => {
      const now = new Date();
      const estTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      if (estTime.getHours() === 23 && estTime.getMinutes() === 59 && isRunning) {
        handleStop();

        // Trigger auto-save if there's data worth saving
        if (seconds > 0 && description.trim()) {
          // We'll expose this via context so Timer component can use it
          if (window.autoSaveSession) {
            const session = {
              duration: seconds,
              started_at: new Date(Date.now() - seconds * 1000).toISOString(),
              ended_at: new Date().toISOString(),
              description: description.trim(),
            };
            window.autoSaveSession(session);
          }
        }
      }
    };
    const interval = setInterval(checkCutoff, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isRunning, seconds, description, handleStop]);

  const handleToggle = useCallback(() => {
    if (isRunning) {
      handleStop();
    } else {
      // Starting the timer
      if (startTimeRef.current === null) {
        // Brand new timer
        startTimeRef.current = Date.now();
        pausedTimeRef.current = 0;
      } else {
        // Resuming from pause
        startTimeRef.current = Date.now() - pausedTimeRef.current;
      }
      setIsRunning(true);

      // Sync to backend immediately when starting
      if (auth.currentUser) {
        updateSessionStateMutation.mutate({
          accumulated_seconds: 0, // Will be updated by periodic sync
          description: description || null,
          is_running: true,
          session_start_time: new Date(startTimeRef.current).toISOString(),
          last_pause_time: null,
        });
      }
    }
  }, [isRunning, handleStop, description, updateSessionStateMutation]);

  const handleReset = useCallback(() => {
    isResetting.current = true;
    setSeconds(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    setIsRunning(false);
    setDescriptionState("");

    // Reset backend state
    if (auth.currentUser) {
      resetSessionStateMutation.mutate(undefined, {
        onSettled: () => {
          // Allow reinitialization after reset completes
          isResetting.current = false;
        }
      });
    } else {
      isResetting.current = false;
    }
  }, [resetSessionStateMutation]);

  const setDescription = useCallback((desc) => {
    setDescriptionState(desc);
    // Description will be synced to backend on next periodic sync or when stopping
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

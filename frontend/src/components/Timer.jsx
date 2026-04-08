import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  CheckCircle2,
} from 'lucide-react';
import WarningPopup from './WarningPopup';
import { auth } from '../firebase/config';
import { useTodaySessions } from '../hooks/useApi';

function Timer({ onSessionSave, onTimerUpdate }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [description, setDescription] = useState('');
  const [sessionSavedToday, setSessionSavedToday] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  // Fetch today's sessions from backend to check if session was already saved
  const { data: todaySessionsData } = useTodaySessions();
  const sessionSavedToday = (todaySessionsData?.sessions?.length ?? 0) > 0;

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('writingSessions') || '[]');
    const todayDate = getESTDateString();
    const savedToday = sessions.some(session => session.date === todayDate);
    setSessionSavedToday(savedToday);
    setSavedMessage(savedToday ? 'You can only log one session per day.' : '');
  }, []);

  useEffect(() => {
    const savedStartTime = localStorage.getItem(getStorageKey('timerStartTime'));
    const savedPausedTime = localStorage.getItem(getStorageKey('timerPausedTime'));
    const savedIsRunning = localStorage.getItem(getStorageKey('timerIsRunning'));
    const savedDescription = localStorage.getItem(getStorageKey('timerDescription'));

    if (savedDescription) setDescription(savedDescription);

    if (savedStartTime) {
      startTimeRef.current = parseInt(savedStartTime, 10);
      pausedTimeRef.current = savedPausedTime ? parseInt(savedPausedTime, 10) : 0;

      if (savedIsRunning === 'true') {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setSeconds(elapsed);
        setIsRunning(true);
      } else {
        const elapsed = Math.floor((parseInt(savedPausedTime, 10)) / 1000);
        setSeconds(elapsed);
        setIsRunning(false);
      }
    }
  }, []);

  useEffect(() => {
    const checkTimeLimits = () => {
      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const hours = estTime.getHours();
      const minutes = estTime.getMinutes();

      if (hours === 23 && minutes === 59 && isRunning) {
        handleStop();
        setError('Timer automatically stopped at 11:59 PM EST cutoff');
      }

      if (hours === 0 && minutes === 0) {
        handleReset();
        setSessionSavedToday(false);
        setSavedMessage('');
      }
    };

    const interval = setInterval(checkTimeLimits, 30000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    if (onTimerUpdate) onTimerUpdate(seconds);
  }, [seconds, onTimerUpdate]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleDescriptionChange = (e) => {
    const newText = e.target.value;
    const wc = countWords(newText);
    if (wc <= 10) {
      setDescription(newText);
      localStorage.setItem(getStorageKey('timerDescription'), newText);
      setError('');
    } else {
      setError('Description must be 10 words or less');
    }
  };

  const handleReset = () => {
    setSeconds(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    setIsRunning(false);
    setDescription('');
    setError('');
    localStorage.removeItem(getStorageKey('timerStartTime'));
    localStorage.removeItem(getStorageKey('timerPausedTime'));
    localStorage.removeItem(getStorageKey('timerIsRunning'));
    localStorage.removeItem(getStorageKey('timerDescription'));
  };

  const handleStop = () => {
    if (!isRunning) return;
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setSeconds(elapsed);
    pausedTimeRef.current = elapsed * 1000;
    localStorage.setItem(getStorageKey('timerPausedTime'), pausedTimeRef.current.toString());
    localStorage.setItem(getStorageKey('timerIsRunning'), 'false');
    setIsRunning(false);
  };

  const handleToggle = () => {
    if (isRunning) {
      handleStop();
    } else {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        pausedTimeRef.current = 0;
      } else {
        startTimeRef.current = Date.now() - pausedTimeRef.current;
      }
      localStorage.setItem(getStorageKey('timerStartTime'), startTimeRef.current.toString());
      localStorage.setItem(getStorageKey('timerIsRunning'), 'true');
      setIsRunning(true);
      setError('');
    }
  };

  const handleSaveSession = () => {
    if (sessionSavedToday) {
      setError('You have already saved a session today. Only one session per day is allowed.');
      return;
    }
    if (seconds === 0) {
      setError('Cannot save a session with 0 time');
      return;
    }
    if (!description.trim()) {
      setError('Description is required to save session');
      return;
    }
    if (countWords(description) > 10) {
      setError('Description must be 10 words or less');
      return;
    }

    if (isRunning) handleStop();

    const now = new Date();
    const startTime = new Date(now.getTime() - seconds * 1000);
    const session = {
      duration: seconds,
      started_at: startTime.toISOString(),
      ended_at: now.toISOString(),
      description: description.trim(),
    };

    const sessions = JSON.parse(localStorage.getItem('writingSessions') || '[]');
    sessions.push(session);
    localStorage.setItem('writingSessions', JSON.stringify(sessions));

    setSessionSavedToday(true);
    setSavedMessage('You can only save/log one session per day.');
    handleReset();
    setError('');

    if (onSessionSave) onSessionSave(session);
  };

  const wordCount = countWords(description);
  const progress = (seconds % 3600) / 3600;
  const radius = 116;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <>
      <WarningPopup />
      <div className="flex flex-col lg:flex-row items-center gap-12">
        {/* Left Side - Timer Display */}
        <div className="flex flex-col items-center flex-1">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm transition-all duration-300 ${
            sessionSavedToday
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400/50'
              : isRunning
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/50 animate-pulse'
                : 'bg-gradient-to-r from-slate-100/80 to-slate-200/80 dark:from-slate-700/50 dark:to-slate-600/50 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-500/50'
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${
              sessionSavedToday
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : isRunning
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse'
                  : 'bg-slate-400 dark:bg-slate-500'
            }`} />
            {sessionSavedToday ? 'Session Saved For Today' : isRunning ? 'Session Started' : 'Ready'}
          </span>

        {!sessionSavedToday && (
          <>
            {/* Timer display */}
            <div className="text-6xl font-bold text-text tabular-nums my-4 font-mono">
              {formatTime(seconds)}
            </div>

            {/* Controls */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleToggle}
                className={`px-8 py-3 text-background rounded-lg text-base font-semibold transition-all ${
                  isRunning
                    ? 'bg-red-500 hover:bg-red-600 cursor-pointer'
                    : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                }`}
              >
                {isRunning ? 'Stop' : 'Start'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-secondary text-text rounded-lg text-base font-semibold hover:bg-secondary/80 transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Description + Save */}
            <div className="w-full max-w-md">
              <label className="block mb-1.5 font-semibold text-text text-sm">
                Session Description
                <span className="font-normal text-muted ml-1">(max 10 words)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="What did you write about today?"
                className="w-full p-3 text-sm rounded-lg border border-accent/30 focus:border-primary focus:outline-none"
              />
              <div className={`text-xs mt-1 text-right ${wordCount > 8 ? (wordCount > 10 ? 'text-red-500' : 'text-yellow-600') : 'text-muted'}`}>
                {wordCount}/10 words
              </div>
              <button
                onClick={handleSaveSession}
                className="mt-3 py-3 text-background rounded-lg text-sm font-bold w-full transition-all bg-primary hover:opacity-90 cursor-pointer"
              >
                Save Session
              </button>
            </div>
          </>
        )}

        {/* Save limit message — only shown after saving */}
        {savedMessage && (
          <div className="w-full max-w-md flex flex-col items-center gap-2 mt-2">
            <div className="text-6xl font-bold text-text tabular-nums font-mono">
              {formatTime(seconds)}
            </div>
            <p className="text-[#003366] text-lg font-bold text-center">
              {savedMessage}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default Timer;
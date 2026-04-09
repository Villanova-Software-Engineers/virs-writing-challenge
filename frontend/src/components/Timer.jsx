// src/components/Timer.jsx
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Save, CheckCircle2 } from 'lucide-react';
import WarningPopup from './WarningPopup';
import { useTodaySessions } from '../hooks/useApi';
import { useTimerContext } from '../context/TimerContext';

function Timer({ onSessionSave, onTimerUpdate }) {
  const {
    seconds,
    isRunning,
    description,
    sessionSavedToday,
    setSessionSavedToday,
    handleToggle,
    handleReset,
    handleStop,
    setDescription,
  } = useTimerContext();

  const [error, setError] = useState('');

  // Sync sessionSavedToday from the API into context
  // Backend is the source of truth - no localStorage needed for this
  const { data: todaySessionsData } = useTodaySessions();
  useEffect(() => {
    setSessionSavedToday((todaySessionsData?.sessions?.length ?? 0) > 0);
  }, [todaySessionsData, setSessionSavedToday]);

  // Keep Dashboard's todayWritingTime stat in sync
  useEffect(() => {
    if (onTimerUpdate) onTimerUpdate(seconds);
  }, [seconds, onTimerUpdate]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const countWords = (text) =>
    text.trim().split(/\s+/).filter((w) => w.length > 0).length;

  const handleDescriptionChange = (e) => {
    const newText = e.target.value;
    if (countWords(newText) <= 10) {
      setDescription(newText); // context setter — also persists to localStorage
      setError('');
    } else {
      setError('Description must be 10 words or less');
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

    handleReset(); // clears context state + localStorage
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
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm transition-all duration-300 ${
              sessionSavedToday
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400/50'
                : isRunning
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/50 animate-pulse'
                : 'bg-gradient-to-r from-slate-100/80 to-slate-200/80 dark:from-slate-700/50 dark:to-slate-600/50 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-500/50'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                sessionSavedToday
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  : isRunning
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                  : 'bg-slate-400 dark:bg-slate-500'
              }`}
            />
            {sessionSavedToday ? 'Session Saved' : isRunning ? 'Writing...' : 'Ready'}
          </span>

          {/* Circular Timer */}
          <div className="relative flex h-[280px] w-[280px] items-center justify-center sm:h-[320px] sm:w-[320px] mb-8">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 280 280" aria-hidden="true">
              <defs>
                <linearGradient id="timer-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r="116" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="12" />
              <circle
                cx="140"
                cy="140"
                r="116"
                fill="none"
                stroke="url(#timer-progress-gradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="relative text-4xl font-black tabular-nums leading-none tracking-tight bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 dark:from-blue-400 dark:via-blue-400 dark:to-blue-400 bg-clip-text text-transparent sm:text-5xl px-20">
              {formatTime(seconds)}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5">
            <button
              onClick={handleToggle}
              disabled={sessionSavedToday}
              title={isRunning ? 'Pause' : 'Start'}
              className={`group relative flex h-16 w-16 items-center justify-center rounded-full text-white transition-all duration-300 ${
                sessionSavedToday
                  ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed opacity-50'
                  : isRunning
                  ? 'bg-pink-500 hover:bg-pink-600 hover:scale-110'
                  : 'bg-primary hover:opacity-90 hover:scale-110'
              }`}
            >
              {isRunning ? <Pause className="h-7 w-7" /> : <Play className="ml-0.5 h-7 w-7" />}
              {!sessionSavedToday && (
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {isRunning ? 'Pause' : 'Start'}
                </span>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={seconds === 0 && !isRunning}
              title="Reset"
              className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <RotateCcw className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Reset
              </span>
            </button>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col flex-1 w-full space-y-5">
          {/* Error */}
          {error && (
            <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-5 py-3.5 rounded-xl backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5" />
              <p className="relative text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <label className="block text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-blue-400 dark:to-blue-400 bg-clip-text text-transparent">
                Session Description
              </label>
              <span
                className={`rounded-full px-3.5 py-1.5 text-xs font-black tabular-nums backdrop-blur-sm transition-all duration-300 ${
                  wordCount > 10
                    ? 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-950/50 dark:to-pink-950/50 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                    : wordCount > 8
                    ? 'bg-gradient-to-r from-yellow-100 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-950/50 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800'
                    : 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                }`}
              >
                {wordCount}/10 words
              </span>
            </div>
            <div className="relative">
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="What did you write about today?"
                disabled={sessionSavedToday}
                rows="5"
                className="w-full px-5 py-4 text-base border-2 border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl text-gray-900 dark:text-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 dark:focus:ring-blue-500 dark:focus:border-blue-400 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-all duration-300 resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleSaveSession}
              disabled={sessionSavedToday}
              className={`inline-flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                sessionSavedToday
                  ? 'bg-emerald-600 text-white cursor-not-allowed'
                  : 'bg-blue-600 dark:bg-blue-400 hover:opacity-90 text-white hover:scale-105'
              }`}
            >
              {sessionSavedToday ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
              {sessionSavedToday ? 'Session Saved for Today' : 'Save Session'}
            </button>
          </div>

          {/* Info */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 dark:from-blue-400/10 dark:via-blue-400/15 dark:to-blue-400/10 border border-blue-300 dark:border-blue-400/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 dark:from-blue-400/5 dark:via-blue-400/10 dark:to-blue-400/5" />
            <p className="relative text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
              <span className="font-bold">Daily Limit:</span> You can only save one writing session per day. Track all your writing time before saving.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Timer;

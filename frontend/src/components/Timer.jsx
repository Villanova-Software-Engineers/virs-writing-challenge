import { useState, useEffect, useRef } from 'react';
import WarningPopup from './WarningPopup';

function Timer({ onSessionSave, onTimerUpdate }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [description, setDescription] = useState('');
  const [sessionSavedToday, setSessionSavedToday] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  const getESTDateString = () => {
    const now = new Date();
    const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return estDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('writingSessions') || '[]');
    const todayDate = getESTDateString();
    const savedToday = sessions.some(session => session.date === todayDate);
    setSessionSavedToday(savedToday);
    setSavedMessage(savedToday ? 'You can only log one session per day.' : '');
  }, []);

  useEffect(() => {
    const savedStartTime = localStorage.getItem('timerStartTime');
    const savedPausedTime = localStorage.getItem('timerPausedTime');
    const savedIsRunning = localStorage.getItem('timerIsRunning');
    const savedDescription = localStorage.getItem('timerDescription');

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
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
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
      localStorage.setItem('timerDescription', newText);
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
    localStorage.removeItem('timerStartTime');
    localStorage.removeItem('timerPausedTime');
    localStorage.removeItem('timerIsRunning');
    localStorage.removeItem('timerDescription');
  };

  const handleStop = () => {
    if (!isRunning) return;
    pausedTimeRef.current = Date.now() - startTimeRef.current - pausedTimeRef.current;
    localStorage.setItem('timerPausedTime', pausedTimeRef.current.toString());
    localStorage.setItem('timerIsRunning', 'false');
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
      localStorage.setItem('timerStartTime', startTimeRef.current.toString());
      localStorage.setItem('timerIsRunning', 'true');
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

    const session = {
      date: getESTDateString(),
      duration: seconds,
      description: description.trim(),
      timestamp: new Date().toISOString()
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

  return (
    <>
      <WarningPopup />
      <div className="flex flex-col items-center">
        {/* Status indicator */}
        <div className="mb-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
            sessionSavedToday
              ? 'bg-green-100 text-green-700'
              : isRunning
                ? 'bg-red-100 text-red-600'
                : 'bg-secondary/50 text-muted'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              sessionSavedToday
                ? 'bg-green-500'
                : isRunning
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-accent'
            }`} />
            {sessionSavedToday ? 'Session Saved For Today' : isRunning ? 'Session Started' : 'Ready'}
          </span>
        </div>

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
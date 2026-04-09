// src/components/FloatingMiniTimer.jsx
import { useLocation } from "react-router-dom";
import { Play, Pause, LayoutDashboard } from "lucide-react";
import { useTimerContext } from "../context/TimerContext";

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FloatingMiniTimer() {
  const { pathname } = useLocation();
  const { seconds, isRunning, handleToggle, sessionSavedToday } = useTimerContext();

  // Hide on dashboard (full timer is there) and before the timer has ever been started
  if (pathname === "/dashboard") return null;
  if (seconds === 0 && !isRunning) return null;

  const progress = (seconds % 3600) / 3600;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={[
          "flex items-center gap-3 pl-3 pr-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300",
          sessionSavedToday
            ? "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800"
            : isRunning
            ? "bg-white/95 dark:bg-slate-800/95 border-blue-200 dark:border-blue-700 shadow-blue-200/50 dark:shadow-blue-900/50"
            : "bg-white/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700",
        ].join(" ")}
      >
        {/* Mini circular progress ring */}
        <div className="relative w-11 h-11 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <defs>
              <linearGradient id="mini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="4" />
            {/* Progress */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke={sessionSavedToday ? "#10b981" : isRunning ? "url(#mini-grad)" : "#94a3b8"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          {/* Pulse dot while running */}
          {isRunning && (
            <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500">
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
            </span>
          )}
        </div>

        {/* Time + status label */}
        <div className="flex flex-col min-w-[72px]">
          <span
            className={[
              "font-mono font-black text-lg leading-none tabular-nums tracking-tight",
              sessionSavedToday
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-slate-800 dark:text-white",
            ].join(" ")}
          >
            {formatTime(seconds)}
          </span>
          <span
            className={[
              "text-[10px] font-semibold uppercase tracking-wider mt-0.5",
              isRunning
                ? "text-blue-500 dark:text-blue-400"
                : sessionSavedToday
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 dark:text-slate-500",
            ].join(" ")}
          >
            {sessionSavedToday ? "Saved ✓" : isRunning ? "Writing..." : "Paused"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {!sessionSavedToday && (
            <button
              onClick={handleToggle}
              title={isRunning ? "Pause" : "Resume"}
              className={[
                "flex h-8 w-8 items-center justify-center rounded-xl text-white transition-all duration-200 hover:scale-110",
                isRunning ? "bg-pink-500 hover:bg-pink-600" : "bg-primary hover:opacity-90",
              ].join(" ")}
            >
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </button>
          )}
          <a
            href="/dashboard"
            title="Go to Dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all duration-200 hover:scale-110"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

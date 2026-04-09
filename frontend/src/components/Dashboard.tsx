import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Loader2,
  MessageSquare,
  Clock,
  ChevronRight,
  Calendar,
  ThumbsUp,
  ChevronDown,
  History,
  Pin,
} from "lucide-react";
import Timer from "./Timer";
import { auth } from "../firebase/config";
import {
  useCurrentStreak,
  useUpdateStreak,
  useActiveSemester,
  useSessions,
  useSaveSession,
  useInfiniteMessages,
  useLikeMessage,
} from "../hooks/useApi";
import type { MessageResponse } from "../types/api.types";

// ── Mini Message Card ─────────────────────────────────────────────────────────
function MiniMessageCard({ msg }: { msg: MessageResponse }) {
  const currentUserId = auth.currentUser?.uid || "";
  const hasLiked = msg.likes.includes(currentUserId);
  const likeMutation = useLikeMessage();

  const timeAgo = (isoString: string): string => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  // Check if message is truncated (roughly more than 2 lines)
  const isTruncated = msg.content.length > 100 || msg.content.includes('\n');

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border-l-4 border-primary shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 group">
      <Link to="/messages" className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {msg.is_pinned && (
                <Pin className="text-primary shrink-0" size={14} fill="currentColor" />
              )}
              <span className="font-bold text-slate-900 dark:text-white">
                {msg.author_name}
              </span>
              {msg.author_is_admin && (
                <span className="text-[9px] text-white bg-[#003366] dark:bg-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Admin
                </span>
              )}
              {msg.author_department && (
                <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                  {msg.author_department}
                </span>
              )}
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 px-2 py-0.5 rounded-full">
                {timeAgo(msg.created_at)}
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 line-clamp-2 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            {isTruncated && (
              <span className="text-xs text-primary font-semibold mt-2 inline-flex items-center gap-1 group-hover:gap-2 group-hover:underline transition-all">
                Read more <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-blue-200/50 dark:border-slate-600">
        <button
          onClick={(e) => {
            e.preventDefault();
            likeMutation.mutate(msg.id);
          }}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-all ${
            hasLiked ? "text-primary scale-105" : "text-slate-500 dark:text-slate-400 hover:text-primary hover:scale-105"
          }`}
        >
          <ThumbsUp size={14} className={hasLiked ? "fill-current" : ""} />
          {msg.likes.length > 0 && msg.likes.length}
        </button>
        <Link
          to="/messages"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageSquare size={14} />
          {msg.comments.length > 0 && msg.comments.length}
        </Link>
      </div>
    </div>
  );
}

// ── Recent Messages Panel ─────────────────────────────────────────────────────────
function RecentMessagesPanel() {
  const { data, isLoading } = useInfiniteMessages(5);

  // Get first 5 messages from first page
  const messages = data?.pages?.[0]?.messages?.slice(0, 5) ?? [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          <h3 className="font-semibold text-text text-lg">Recent Messages</h3>
        </div>
        <Link
          to="/messages"
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          View all <ChevronRight size={16} />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : messages && messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg: MessageResponse) => (
            <MiniMessageCard key={msg.id} msg={msg} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <MessageSquare className="mx-auto mb-3" size={40} />
          <p className="text-base font-medium">No messages yet</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
          <Link
            to="/messages"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Messages
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Recent Sessions Dropdown ─────────────────────────────────────────────────────────
function RecentSessionsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: sessionsData, isLoading } = useSessions(5);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sessionCount = sessionsData?.sessions?.length ?? 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700"
      >
        <History size={16} className="text-primary" />
        <span>Recent Sessions</span>
        {sessionCount > 0 && (
          <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
            {sessionCount}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-sm text-slate-800">Recent Sessions</span>
            <Link
              to="/sessions"
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-slate-400" size={20} />
            </div>
          ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {sessionsData.sessions.map((session) => (
                <div
                  key={session.id}
                  className="px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {formatDate(session.started_at)}
                      </span>
                    </div>
                    <span className="font-semibold text-xs text-primary">
                      {formatDuration(session.duration)}
                    </span>
                  </div>
                  {session.description && (
                    <p className="text-xs text-slate-600 truncate mt-1 pl-4">
                      {session.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <Clock className="mx-auto mb-2" size={20} />
              <p className="text-xs">No sessions yet</p>
            </div>
          )}

          {sessionsData?.sessions && sessionsData.sessions.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Semester Total</span>
                <span className="font-bold text-primary">
                  {formatDuration(sessionsData.total_time)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [currentTimerSeconds, setCurrentTimerSeconds] = useState(0);
  const [sessionSaved, setSessionSaved] = useState(false);

  const { data: streak, isLoading: streakLoading } = useCurrentStreak();
  const { data: semester } = useActiveSemester();
  const { data: allSessionsData } = useSessions(1000); // Get all sessions for total
  const updateStreak = useUpdateStreak();
  const saveSession = useSaveSession();

  // Calculate today's total time from saved sessions (using EST/EDT)
  const todayWritingTime = (() => {
    if (!allSessionsData?.sessions) return currentTimerSeconds;

    // Get today's start in EST/EDT (midnight in Eastern Time)
    // Convert current time to EST by getting UTC time and subtracting 5 hours
    const now = new Date();
    const estOffset = -5 * 60; // EST is UTC-5 (minutes)
    const estTime = new Date(now.getTime() + (now.getTimezoneOffset() + estOffset) * 60000);

    // Set to midnight EST
    const todayStart = new Date(estTime.getFullYear(), estTime.getMonth(), estTime.getDate(), 0, 0, 0, 0);
    // Convert back to UTC for comparison
    const todayStartUTC = new Date(todayStart.getTime() - (now.getTimezoneOffset() + estOffset) * 60000);

    const todaySessions = allSessionsData.sessions.filter(session => {
      const sessionDate = new Date(session.started_at);
      return sessionDate >= todayStartUTC;
    });

    const todayTotal = todaySessions.reduce((sum, session) => sum + session.duration, 0);
    return todayTotal + currentTimerSeconds;
  })();

  const handleTimerUpdate = useCallback((seconds: number) => {
    setCurrentTimerSeconds(seconds);
  }, []);

  const handleSessionSave = useCallback(
    async (session: { duration: number; timestamp: string; description?: string }) => {
      setSessionSaved(true);
      setCurrentTimerSeconds(0);

      // Save session to backend
      const now = new Date();
      const startTime = new Date(now.getTime() - session.duration * 1000);
      saveSession.mutate({
        duration: session.duration,
        started_at: startTime.toISOString(),
        ended_at: now.toISOString(),
        description: session.description,
      });

      // Update streak
      updateStreak.mutate();
    },
    [updateStreak, saveSession]
  );

  const formatTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
      s
    ).padStart(2, "0")}`;
  };

  const streakCount = streak?.count ?? 0;
  const flameColor =
    streakCount >= 7
      ? "text-orange-500"
      : streakCount > 0
      ? "text-amber-400"
      : "text-slate-300";

  return (
    <div className="p-6 lg:p-8 min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text">Dashboard</h1>
          {semester && (
            <p className="text-sm text-muted mt-1">{semester.name}</p>
          )}
        </div>
        <RecentSessionsDropdown />
      </div>

      {/* Main Content - Full Width */}
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Semester Total */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
            <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
              Semester Total
            </div>
            <div className="text-3xl font-bold text-primary font-mono">
              {allSessionsData ? formatTime(allSessionsData.total_time) : "00:00:00"}
            </div>
          </div>

          {/* Streak */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
            <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
              Writing Streak
            </div>
            <div className="flex items-center gap-2">
              {streakLoading ? (
                <Loader2 size={28} className="text-slate-300 animate-spin" />
              ) : (
                <Flame
                  size={28}
                  className={`${flameColor} transition-colors duration-500`}
                  fill={streakCount > 0 ? "currentColor" : "none"}
                />
              )}
              <span className="text-3xl font-bold text-text">
                {streakLoading ? "—" : `${streakCount} days`}
              </span>
            </div>
          </div>

          {/* Today's Time */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
            <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
              Today's Time
            </div>
            <div className="text-3xl font-bold text-text font-mono">
              {formatTime(todayWritingTime)}
            </div>
          </div>
        </div>

        {/* Timer Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 lg:p-8">
          <Timer
            onTimerUpdate={handleTimerUpdate}
            onSessionSave={handleSessionSave}
          />
        </div>

        {/* Recent Messages - Below Timer */}
        <RecentMessagesPanel />
      </div>
    </div>
  );
}

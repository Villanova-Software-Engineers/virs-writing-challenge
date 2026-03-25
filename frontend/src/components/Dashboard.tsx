import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Loader2,
  MessageSquare,
  Clock,
  ChevronRight,
  Calendar,
  ThumbsUp,
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
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid || "";
  const hasLiked = msg.likes.includes(currentUserId);
  const likeMutation = useLikeMessage();

  const handleCommentClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigate(`/messages?highlight=${encodeURIComponent(msg.id)}`);
  };

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
    <div className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors group">
      <a href="/messages" className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-slate-800 truncate">
                {msg.author_name}
              </span>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2 whitespace-pre-wrap">{msg.content}</p>
            {isTruncated && (
              <span className="text-xs text-[#003366] font-medium mt-1 inline-flex items-center gap-1 group-hover:underline">
                Read more <ChevronRight size={12} />
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 shrink-0">
            {timeAgo(msg.created_at)}
          </span>
        </div>
      </a>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            likeMutation.mutate(msg.id);
          }}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-1 text-xs ${
            hasLiked ? "text-[#003366] font-medium" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <ThumbsUp size={12} />
          {msg.likes.length > 0 && msg.likes.length}
        </button>
        <button
          onClick={handleCommentClick}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          title="Comment"
        >
          <MessageSquare size={12} />
          {msg.comments.length > 0 && msg.comments.length}
        </button>
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
    <div className="bg-background rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-[#003366]" />
          <h3 className="font-semibold text-text">Recent Messages</h3>
        </div>
        <a
          href="/messages"
          className="flex items-center gap-1 text-xs text-[#003366] font-medium hover:underline"
        >
          View all <ChevronRight size={14} />
        </a>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      ) : messages && messages.length > 0 ? (
        <div className="space-y-2">
          {messages.map((msg: MessageResponse) => (
            <MiniMessageCard key={msg.id} msg={msg} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-slate-400">
          <MessageSquare className="mx-auto mb-2" size={24} />
          <p className="text-sm">No messages yet</p>
        </div>
      )}
    </div>
  );
}

// ── Saved Sessions Panel ─────────────────────────────────────────────────────────
function SavedSessionsPanel() {
  const { data: sessionsData, isLoading } = useSessions(5);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
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

  return (
    <div className="bg-background rounded-xl shadow p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-primary" />
        <h3 className="font-semibold text-text">Recent Sessions</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
        <div className="space-y-2">
          {sessionsData.sessions.map((session) => (
            <div
              key={session.id}
              className="py-2 px-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {formatDate(session.started_at)}
                  </span>
                </div>
                <span className="font-medium text-sm text-[#003366]">
                  {formatDuration(session.duration)}
                </span>
              </div>
              {session.description && (
                <p className="text-xs text-slate-500 truncate pl-5">
                  {session.description}
                </p>
              )}
            </div>
          ))}
          <div className="pt-2 border-t border-slate-100 mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total</span>
              <span className="font-bold text-[#003366]">
                {formatDuration(sessionsData.total_time)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-slate-400">
          <Clock className="mx-auto mb-2" size={24} />
          <p className="text-sm">No sessions yet</p>
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text">Dashboard</h1>
        {semester && (
          <p className="text-base text-muted mt-1">{semester.name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Semester Total */}
            <div className="bg-background rounded-xl shadow p-5">
              <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                Semester Total
              </div>
              <div className="text-xl font-bold text-primary font-mono">
                {allSessionsData ? formatTime(allSessionsData.total_time) : "00:00:00"}
              </div>
            </div>

            {/* Streak */}
            <div className="bg-background rounded-xl shadow p-5">
              <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                Writing Streak
              </div>
              <div className="flex items-center gap-2">
                {streakLoading ? (
                  <Loader2
                    size={22}
                    className="text-slate-300 animate-spin"
                  />
                ) : (
                  <Flame
                    size={22}
                    className={`${flameColor} transition-colors duration-500`}
                    fill={streakCount > 0 ? "currentColor" : "none"}
                  />
                )}
                <span className="text-xl font-bold text-text">
                  {streakLoading
                    ? "—"
                    : `${streakCount} day${streakCount !== 1 ? "s" : ""}`}
                </span>
              </div>
              {streakCount >= 7 && (
                <p className="text-xs text-orange-500 mt-1 font-medium">
                  On fire!
                </p>
              )}
            </div>

            {/* Today's Time */}
            <div className="bg-background rounded-xl shadow p-5">
              <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                Today's Time
              </div>
              <div className="text-xl font-bold text-text font-mono">
                {formatTime(todayWritingTime)}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-background rounded-xl shadow p-8">
            <Timer
              onTimerUpdate={handleTimerUpdate}
              onSessionSave={handleSessionSave}
            />
          </div>

          {/* Recent Messages */}
          <RecentMessagesPanel />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SavedSessionsPanel />
        </div>
      </div>
    </div>
  );
}

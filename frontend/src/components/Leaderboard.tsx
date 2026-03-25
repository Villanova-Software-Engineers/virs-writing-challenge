import { Trophy, Flame, Clock, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useLeaderboard } from "../hooks/useApi";
import type { LeaderboardEntry } from "../types/api.types";

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getRankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case 2:
      return "bg-slate-100 text-slate-600 border-slate-300";
    case 3:
      return "bg-orange-100 text-orange-700 border-orange-300";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

function getRankIcon(rank: number): React.ReactNode {
  if (rank === 1) return <Trophy className="text-yellow-500" size={16} />;
  if (rank === 2) return <Trophy className="text-slate-400" size={16} />;
  if (rank === 3) return <Trophy className="text-orange-400" size={16} />;
  return null;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const rankStyle = getRankStyle(entry.rank);
  const rankIcon = getRankIcon(entry.rank);

  return (
    <tr
      className={`border-b border-slate-100 transition-colors ${
        entry.is_current_user ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50"
      }`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-sm font-bold ${rankStyle}`}
          >
            {entry.rank}
          </span>
          {rankIcon}
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`text-base font-medium ${
            entry.is_current_user ? "text-primary font-bold" : "text-text"
          }`}
        >
          {entry.is_current_user ? `${entry.user_name} (You)` : entry.user_name}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-text font-mono">
          <Clock size={14} className="text-muted" />
          {formatTime(entry.total_time)}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Flame
            size={16}
            className={entry.streak >= 7 ? "text-orange-500" : entry.streak > 0 ? "text-amber-400" : "text-slate-300"}
            fill={entry.streak > 0 ? "currentColor" : "none"}
          />
          <span className="text-text">{entry.streak} days</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-text">
          <Calendar size={14} className="text-muted" />
          {entry.active_days}
        </div>
      </td>
    </tr>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="bg-background rounded-xl shadow overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100">
        <div className="h-6 bg-slate-200 rounded w-48" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-32" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-16" />
            <div className="h-4 bg-slate-100 rounded w-20" />
            <div className="h-4 bg-slate-100 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data: leaderboard, isLoading, error } = useLeaderboard();

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="text-primary" size={32} />
        <h1 className="text-4xl font-bold text-text">Leaderboard</h1>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <div>
            <p className="text-red-800 font-medium">Failed to load leaderboard</p>
            <p className="text-red-600 text-sm">{error.message}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <LeaderboardSkeleton />}

      {/* Leaderboard Table */}
      {!isLoading && !error && (
        <div className="bg-background rounded-xl shadow overflow-hidden">
          {leaderboard && leaderboard.entries.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent/20 bg-slate-50">
                  <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                    Rank
                  </th>
                  <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                    Name
                  </th>
                  <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                    Total Time
                  </th>
                  <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                    Streak
                  </th>
                  <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                    Active Days
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.entries.map((entry) => (
                  <LeaderboardRow key={entry.user_uid} entry={entry} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Trophy className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500">No rankings yet. Start writing to join the leaderboard!</p>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-muted mt-6">
        Leaderboard data is per semester. Rankings update after each saved session.
      </p>
    </div>
  );
}

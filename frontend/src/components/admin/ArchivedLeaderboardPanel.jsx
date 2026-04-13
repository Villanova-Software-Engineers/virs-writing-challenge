import { useState } from "react";
import { Loader2, Trophy, Calendar, Clock, Flame } from "lucide-react";
import AdminSection from "./AdminSection";
import { useSemesters, useArchivedLeaderboard } from "../../hooks/useApi";

// LeaderboardRow component - same as in Leaderboard.tsx but without current user highlighting
function LeaderboardRow({ entry }) {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-muted font-bold text-lg">{rank}</span>;
  };

  const getRowClass = (rank) => {
    if (rank === 1) return "bg-yellow-50 dark:bg-yellow-950/20";
    if (rank === 2) return "bg-slate-50 dark:bg-slate-800/50";
    if (rank === 3) return "bg-orange-50 dark:bg-orange-950/20";
    return "";
  };

  return (
    <tr className={`border-b border-slate-100 dark:border-slate-700 last:border-0 ${getRowClass(entry.rank)}`}>
      <td className="px-6 py-4 w-20">
        <div className="flex items-center justify-center w-12 h-12">
          {getRankBadge(entry.rank)}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-base font-medium text-text">
          {entry.user_name}
        </span>
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
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-text font-mono">
          <Clock size={14} className="text-muted" />
          {formatTime(entry.total_time)}
        </div>
      </td>
    </tr>
  );
}

function ArchivedLeaderboardPanel() {
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const { data: allSemesters, isLoading: semestersLoading } = useSemesters();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useArchivedLeaderboard(selectedSemesterId);

  const semesters = allSemesters || [];
  const selectedSemester = semesters.find(s => s.id === selectedSemesterId);
  const entries = leaderboardData?.entries || [];

  if (semestersLoading) {
    return (
      <AdminSection title="Past Leaderboards" description="View archived leaderboards from previous semesters.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminSection>
    );
  }

  return (
    <AdminSection
      title="Past Leaderboards"
      description="View archived leaderboards from previous semesters. Users are ranked by streak (highest first), then by active days, then by total time."
    >
      <div className="flex flex-col gap-6">
        {/* Semester Selector */}
        <div>
          <label className="block text-sm font-semibold text-muted uppercase mb-2">
            Select Semester
          </label>
          <select
            value={selectedSemesterId || ""}
            onChange={(e) => setSelectedSemesterId(e.target.value ? Number(e.target.value) : null)}
            className="w-full max-w-md px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">-- Select a semester --</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name} {semester.is_active ? "(Active)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Leaderboard Display */}
        {selectedSemesterId && (
          <div>
            <h3 className="text-sm font-semibold text-muted uppercase mb-3 flex items-center gap-2">
              <Trophy size={16} />
              Leaderboard for {selectedSemester?.name || "Selected Semester"}
            </h3>

            {leaderboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Trophy className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                <p>No leaderboard data found for this semester</p>
              </div>
            ) : (
              <div className="bg-background rounded-xl shadow overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-accent/20 bg-slate-50 dark:bg-slate-800">
                      <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                        Rank
                      </th>
                      <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                        Name
                      </th>
                      <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                        Streak
                      </th>
                      <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                        Active Days
                      </th>
                      <th className="text-left text-sm font-semibold text-muted uppercase tracking-wide px-6 py-4">
                        Total Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <LeaderboardRow key={entry.user_uid} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!selectedSemesterId && (
          <div className="text-center py-12 text-muted bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a semester to view its leaderboard</p>
          </div>
        )}
      </div>
    </AdminSection>
  );
}

export default ArchivedLeaderboardPanel;

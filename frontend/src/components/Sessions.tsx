import { useState } from "react";
import {
  Clock,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useSessions, useActiveSemester } from "../hooks/useApi";

export default function Sessions() {
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;

  const { data: semester } = useActiveSemester();
  const { data: sessionsData, isLoading } = useSessions(1000);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDurationShort = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const allSessions = sessionsData?.sessions ?? [];
  const totalPages = Math.ceil(allSessions.length / sessionsPerPage);
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const paginatedSessions = allSessions.slice(startIndex, startIndex + sessionsPerPage);

  const totalTime = sessionsData?.total_time ?? 0;
  const totalSessions = allSessions.length;
  const avgSessionTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

  const sessionsByMonth = allSessions.reduce((acc, session) => {
    const date = new Date(session.started_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { count: 0, duration: 0 };
    }
    acc[monthKey].count++;
    acc[monthKey].duration += session.duration;
    return acc;
  }, {} as Record<string, { count: number; duration: number }>);

  const maxMonthDuration = totalTime || 1;

  return (
    <div className="p-6 lg:p-8 min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="p-2 text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </a>
          <div>
            <h1 className="text-3xl font-bold text-text">Writing Sessions</h1>
            {semester && (
              <p className="text-sm text-muted mt-1">{semester.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Sessions List */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-background rounded-xl shadow p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock size={20} className="text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary font-mono">
                {formatDuration(totalTime)}
              </div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wide mt-1">
                Total Time
              </div>
            </div>

            <div className="bg-background rounded-xl shadow p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Calendar size={20} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-text">
                {totalSessions}
              </div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wide mt-1">
                Total Sessions
              </div>
            </div>

            <div className="bg-background rounded-xl shadow p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <TrendingUp size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-text font-mono">
                {formatDuration(avgSessionTime)}
              </div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wide mt-1">
                Avg Session
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="bg-background rounded-xl shadow overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-text text-lg">All Sessions</h2>
              {totalPages > 1 && (
                <span className="text-sm text-muted">
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-slate-400" size={32} />
              </div>
            ) : paginatedSessions.length > 0 ? (
              <>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {paginatedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <Calendar size={16} className="text-slate-400" />
                              <span className="font-medium">
                                {formatDate(session.started_at)}
                              </span>
                            </div>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {formatTime(session.started_at)}
                            </span>
                          </div>
                          {session.description && (
                            <p className="text-slate-600 dark:text-slate-400">
                              {session.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 bg-primary/5 px-3 py-2 rounded-lg">
                          <Clock size={16} className="text-primary" />
                          <span className="font-bold text-primary font-mono text-lg">
                            {formatDuration(session.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                              currentPage === pageNum
                                ? "bg-primary text-white"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-muted">
                <Clock className="mx-auto mb-4" size={48} />
                <p className="text-xl font-medium text-text">No sessions yet</p>
                <p className="text-sm mt-2 text-muted">
                  Start your first writing session from the dashboard
                </p>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Go to Dashboard
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Monthly Summary */}
        <div className="xl:col-span-1">
          <div className="bg-background rounded-xl shadow overflow-hidden sticky top-6">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              <h2 className="font-semibold text-text text-lg">Monthly Summary</h2>
            </div>

            {Object.keys(sessionsByMonth).length > 0 ? (
              <div className="p-5 space-y-4">
                {Object.entries(sessionsByMonth)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([monthKey, data]) => {
                    const [year, month] = monthKey.split("-");
                    const monthName = new Date(
                      parseInt(year),
                      parseInt(month) - 1
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    });
                    const barWidth = (data.duration / maxMonthDuration) * 100;
                    return (
                      <div key={monthKey}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {monthName}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {data.count} session{data.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-8 bg-slate-100 dark:bg-slate-700/30 rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-600/30">
                            <div
                              className="h-full bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 dark:from-blue-400/90 dark:via-sky-400/90 dark:to-cyan-400/90 rounded-lg transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-sm text-blue-700 dark:text-blue-200 font-mono">
                            {formatDurationShort(data.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted">
                <BarChart3 className="mx-auto mb-3" size={32} />
                <p className="text-sm">No data yet</p>
              </div>
            )}

            {/* Total Summary */}
            {Object.keys(sessionsByMonth).length > 0 && (
              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800/80 dark:to-slate-700/80 border-t border-blue-200 dark:border-slate-600/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Semester Total</span>
                  <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-300 dark:to-cyan-300 bg-clip-text text-transparent font-mono">
                    {formatDuration(totalTime)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
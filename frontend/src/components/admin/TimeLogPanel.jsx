import { useState } from "react";
import { Loader2, Clock, FileDown } from "lucide-react";
import AdminSection from "./AdminSection";
import { useAdminUsers, useAdminSessions, useSemesters } from "../../hooks/useApi";
import { exportSessionsToPDF, exportSessionsToExcel } from "../../utils/exportUtils";

function TimeLogPanel() {
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");

  const { data: sessionsData, isLoading: sessionsLoading } = useAdminSessions(
    100,
    selectedSemesterId ? parseInt(selectedSemesterId) : undefined,
    selectedUserId ? parseInt(selectedUserId) : undefined
  );
  const { data: semestersData } = useSemesters();

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (usersLoading || sessionsLoading) {
    return (
      <AdminSection title="Writing Sessions" description="View all writing sessions across all users.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminSection>
    );
  }

  const users = usersData?.users || [];
  const sessions = sessionsData?.sessions || [];
  const semesters = semestersData || [];
  const totalSeconds = sessionsData?.total_time || 0;

  // Aggregate sessions by user when no specific user is selected
  const userAggregates = !selectedUserId ? sessions.reduce((acc, session) => {
    const key = session.user_uid;
    if (!acc[key]) {
      acc[key] = {
        user_uid: session.user_uid,
        user_name: session.user_name,
        total_time: 0,
        session_count: 0
      };
    }
    acc[key].total_time += session.duration;
    acc[key].session_count += 1;
    return acc;
  }, {}) : {};

  const aggregatedData = Object.values(userAggregates);

  const handleExportPDF = () => {
    const selectedUserName = users.find(u => u.id === parseInt(selectedUserId))?.first_name + ' ' + users.find(u => u.id === parseInt(selectedUserId))?.last_name;
    const selectedSemesterName = semesters.find(s => s.id === parseInt(selectedSemesterId))?.name;
    const dataToExport = selectedUserId ? sessions : aggregatedData;
    exportSessionsToPDF(dataToExport, !selectedUserId, selectedUserName, selectedSemesterName, totalSeconds);
  };

  const handleExportExcel = () => {
    const selectedUserName = users.find(u => u.id === parseInt(selectedUserId))?.first_name + ' ' + users.find(u => u.id === parseInt(selectedUserId))?.last_name;
    const selectedSemesterName = semesters.find(s => s.id === parseInt(selectedSemesterId))?.name;
    const dataToExport = selectedUserId ? sessions : aggregatedData;
    exportSessionsToExcel(dataToExport, !selectedUserId, selectedUserName, selectedSemesterName, totalSeconds);
  };

  return (
    <AdminSection
      title="Writing Sessions"
      description="View all writing sessions across all users and semesters."
    >
      <div className="flex flex-col gap-4">
        {/* Export Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
            disabled={sessions.length === 0}
          >
            <FileDown size={16} />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
            disabled={sessions.length === 0}
          >
            <FileDown size={16} />
            Export Excel
          </button>
        </div>

        {/* Filters and Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Filter by User</label>
            <select
              className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted uppercase">Filter by Semester</label>
            <select
              className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm"
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-3">
            <Clock className="text-primary" size={24} />
            <div>
              <div className="text-xs font-semibold text-muted uppercase">Total Time</div>
              <div className="text-lg font-bold text-text">{formatDuration(totalSeconds)}</div>
            </div>
          </div>
        </div>

        {/* Conditional Table Rendering */}
        {!selectedUserId ? (
          /* Aggregated View - Show total time per user */
          <div className="overflow-hidden rounded-xl border border-accent/30">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Total Sessions</th>
                  <th className="px-4 py-3 text-left font-semibold">Total Time Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/20 bg-white">
                {aggregatedData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">
                      No sessions found
                    </td>
                  </tr>
                ) : (
                  aggregatedData.map((userStat) => (
                    <tr key={userStat.user_uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text">
                        {userStat.user_name}
                      </td>
                      <td className="px-4 py-3 text-muted">{userStat.session_count}</td>
                      <td className="px-4 py-3 text-muted font-mono font-bold">{formatDuration(userStat.total_time)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Detailed View - Show individual sessions */
          <div className="overflow-hidden rounded-xl border border-accent/30">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Start</th>
                  <th className="px-4 py-3 text-left font-semibold">End</th>
                  <th className="px-4 py-3 text-left font-semibold">Duration</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/20 bg-white">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No sessions found
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-muted">{formatDate(session.started_at)}</td>
                      <td className="px-4 py-3 text-muted">{formatTime(session.started_at)}</td>
                      <td className="px-4 py-3 text-muted">{formatTime(session.ended_at)}</td>
                      <td className="px-4 py-3 text-muted font-mono">{formatDuration(session.duration)}</td>
                      <td className="px-4 py-3 text-muted text-xs">{session.description || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-muted text-center">
          {!selectedUserId
            ? `Showing ${aggregatedData.length} users with ${sessions.length} total sessions`
            : `Showing ${sessions.length} sessions`
          }
        </div>
      </div>
    </AdminSection>
  );
}

export default TimeLogPanel;

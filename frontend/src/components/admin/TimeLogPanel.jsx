import { useState, useEffect } from "react";
import { Loader2, Clock, FileDown, Plus, Edit2, Trash2, X, Check, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdminSection from "./AdminSection";
import { useAdminUsers, useAdminSessions, useSemesters, useAdminCreateSession, useAdminUpdateSession, useAdminDeleteSession } from "../../hooks/useApi";
import { exportSessionsToPDF, exportSessionsToExcel } from "../../utils/exportUtils";
import { formatDuration, formatDurationDetailed, formatTime, formatDate, calculateDuration } from "../../utils/dateTimeUtils";

function TimeLogPanel() {
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  const createSessionMutation = useAdminCreateSession();
  const updateSessionMutation = useAdminUpdateSession();
  const deleteSessionMutation = useAdminDeleteSession();

  const { data: semestersData } = useSemesters();

  // Default to active semester when data loads
  useEffect(() => {
    if (semestersData && semestersData.length > 0 && selectedSemesterId === "") {
      const activeSemester = semestersData.find(s => s.is_active);
      if (activeSemester) {
        setSelectedSemesterId(String(activeSemester.id));
      }
    }
  }, [semestersData, selectedSemesterId]);

  const { data: sessionsData, isLoading: sessionsLoading } = useAdminSessions(
    100,
    selectedSemesterId ? parseInt(selectedSemesterId) : undefined,
    selectedUserId ? parseInt(selectedUserId) : undefined
  );


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

  const handleStartEdit = (session) => {
    setEditingSessionId(session.id);
    setEditForm({
      description: session.description || '',
      started_at: new Date(session.started_at),
      ended_at: new Date(session.ended_at),
    });
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (sessionId) => {
    try {
      const startDate = editForm.started_at;
      const endDate = editForm.ended_at;
      const totalSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

      if (totalSeconds <= 0) {
        alert('End time must be after start time.');
        return;
      }

      await updateSessionMutation.mutateAsync({
        sessionId,
        data: {
          duration: totalSeconds,
          description: editForm.description || undefined,
          started_at: startDate.toISOString(),
          ended_at: endDate.toISOString(),
        },
      });
      setEditingSessionId(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update session:', error);
      alert('Failed to update session. Please try again.');
    }
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const handleOpenAddModal = () => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }
    const now = new Date();
    setEditForm({
      description: '',
      started_at: new Date(now.getTime() - 3600000), // 1 hour ago
      ended_at: now, // now
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditForm({});
  };

  const handleAddSession = async () => {
    if (!selectedUserId || !editForm.started_at || !editForm.ended_at) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const startDate = editForm.started_at;
      const endDate = editForm.ended_at;
      const totalSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

      if (totalSeconds <= 0) {
        alert('End time must be after start time.');
        return;
      }

      await createSessionMutation.mutateAsync({
        user_id: parseInt(selectedUserId),
        duration: totalSeconds,
        description: editForm.description || undefined,
        started_at: startDate.toISOString(),
        ended_at: endDate.toISOString(),
      });
      setShowAddModal(false);
      setEditForm({});
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  // Calculate current duration for form
  const currentDuration = calculateDuration(editForm.started_at, editForm.ended_at);
  const durationDetails = formatDurationDetailed(currentDuration);

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
              <thead className="bg-slate-100 dark:bg-slate-700 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Total Sessions</th>
                  <th className="px-4 py-3 text-left font-semibold">Total Time Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/20 bg-white dark:bg-slate-800">
                {aggregatedData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">
                      No sessions found
                    </td>
                  </tr>
                ) : (
                  aggregatedData.map((userStat) => (
                    <tr key={userStat.user_uid} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
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
          /* Detailed View - Show individual sessions with edit/delete */
          <>
            <div className="flex justify-end">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                <Plus size={16} />
                Add Session
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-accent/30">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700 text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Start</th>
                    <th className="px-4 py-3 text-left font-semibold">End</th>
                    <th className="px-4 py-3 text-left font-semibold">Duration</th>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/20 bg-white dark:bg-slate-800">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        No sessions found
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        {editingSessionId === session.id ? (
                          <>
                            <td className="px-4 py-3" colSpan={6}>
                              <div className="space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                                      <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                                      Start Date & Time
                                    </label>
                                    <DatePicker
                                      selected={editForm.started_at}
                                      onChange={(date) => setEditForm({ ...editForm, started_at: date })}
                                      showTimeSelect
                                      timeFormat="h:mm aa"
                                      timeIntervals={15}
                                      dateFormat="MMMM d, yyyy h:mm aa"
                                      className="w-full px-4 py-4 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all outline-none shadow-sm hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer"
                                      wrapperClassName="w-full"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                                      <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                                      End Date & Time
                                    </label>
                                    <DatePicker
                                      selected={editForm.ended_at}
                                      onChange={(date) => setEditForm({ ...editForm, ended_at: date })}
                                      showTimeSelect
                                      timeFormat="h:mm aa"
                                      timeIntervals={15}
                                      dateFormat="MMMM d, yyyy h:mm aa"
                                      minDate={editForm.started_at}
                                      className="w-full px-4 py-4 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all outline-none shadow-sm hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer"
                                      wrapperClassName="w-full"
                                    />
                                  </div>
                                </div>

                                {/* Duration Display */}
                                <div className="px-4 py-3 bg-blue-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Clock size={18} className="text-blue-400" />
                                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        Duration
                                      </span>
                                    </div>
                                    <div className="text-xl font-bold font-mono text-slate-800 dark:text-white">
                                      {durationDetails.hours}h {String(durationDetails.minutes).padStart(2, '0')}m {String(durationDetails.seconds).padStart(2, '0')}s
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                                    Description (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all outline-none"
                                    placeholder="What did they write about?"
                                  />
                                </div>

                                <div className="flex gap-3 justify-end pt-2">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-500 text-white rounded-xl hover:bg-slate-600 transition-all text-sm font-bold shadow-md hover:shadow-lg"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(session.id)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all text-sm font-bold shadow-md hover:shadow-lg"
                                  >
                                    <Check size={16} />
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-muted">{formatDate(session.started_at)}</td>
                            <td className="px-4 py-3 text-muted">{formatTime(session.started_at)}</td>
                            <td className="px-4 py-3 text-muted">{formatTime(session.ended_at)}</td>
                            <td className="px-4 py-3 text-muted font-mono font-semibold">{formatDuration(session.duration)}</td>
                            <td className="px-4 py-3 text-muted text-xs">{session.description || '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStartEdit(session)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(session.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="text-xs text-muted text-center">
          {!selectedUserId
            ? `Showing ${aggregatedData.length} users with ${sessions.length} total sessions`
            : `Showing ${sessions.length} sessions`
          }
        </div>
      </div>

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleCloseAddModal}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <Plus className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-text">Add New Writing Session</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                    Start Date & Time *
                  </label>
                  <DatePicker
                    selected={editForm.started_at}
                    onChange={(date) => setEditForm({ ...editForm, started_at: date })}
                    showTimeSelect
                    timeFormat="h:mm aa"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-4 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all outline-none shadow-sm hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer"
                    wrapperClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                    End Date & Time *
                  </label>
                  <DatePicker
                    selected={editForm.ended_at}
                    onChange={(date) => setEditForm({ ...editForm, ended_at: date })}
                    showTimeSelect
                    timeFormat="h:mm aa"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    minDate={editForm.started_at}
                    className="w-full px-4 py-4 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-semibold text-slate-800 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all outline-none shadow-sm hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>

              {/* Duration Display */}
              <div className="px-5 py-4 bg-blue-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-blue-400" />
                    <span className="text-base font-semibold text-slate-600 dark:text-slate-300">
                      Duration
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white">
                    {durationDetails.hours}h {String(durationDetails.minutes).padStart(2, '0')}m {String(durationDetails.seconds).padStart(2, '0')}s
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all outline-none hover:border-slate-300 dark:hover:border-slate-500"
                  placeholder="What did they write about?"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-700">
              <button
                onClick={handleCloseAddModal}
                className="px-6 py-3 bg-slate-500 text-white rounded-xl hover:bg-slate-600 transition-all text-sm font-bold shadow-md hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSession}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-bold shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Plus size={18} />
                Add Session
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminSection>
  );
}

export default TimeLogPanel;

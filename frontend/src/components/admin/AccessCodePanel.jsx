import { useState } from "react";
import { Loader2, Copy, Check, Pencil } from "lucide-react";
import AdminSection from "./AdminSection";
import { useActiveSemester, useSemesters, useCreateSemester, useEndSemester, useUpdateSemester } from "../../hooks/useApi";

function AccessCodePanel() {
  const { data: activeSemester, isLoading: loadingActive, refetch: refetchActive } = useActiveSemester();
  const { data: allSemesters, isLoading: loadingAll } = useSemesters();
  const createSemesterMutation = useCreateSemester();
  const endSemesterMutation = useEndSemester();
  const updateSemesterMutation = useUpdateSemester();

  const [newSemesterName, setNewSemesterName] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAccessCode, setEditAccessCode] = useState("");

  const handleCreateSemester = async () => {
    if (!newSemesterName || !newStartDate || !newEndDate) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createSemesterMutation.mutateAsync({
        name: newSemesterName,
        start_date: new Date(newStartDate).toISOString(),
        end_date: new Date(newEndDate).toISOString(),
        auto_clear: false,
      });
      setShowCreateForm(false);
      setNewSemesterName("");
      setNewStartDate("");
      setNewEndDate("");
      refetchActive();
    } catch (error) {
      alert(error.message || "Failed to create semester");
    }
  };

  const handleEndSemester = async () => {
    if (!activeSemester) return;

    if (!confirm(`Are you sure you want to end "${activeSemester.name}"? This will prevent new users from joining.`)) {
      return;
    }

    try {
      await endSemesterMutation.mutateAsync(activeSemester.id);
      refetchActive();
    } catch (error) {
      alert(error.message || "Failed to end semester");
    }
  };

  const handleCopyCode = () => {
    if (activeSemester?.access_code) {
      navigator.clipboard.writeText(activeSemester.access_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartEdit = () => {
    if (activeSemester) {
      setEditName(activeSemester.name);
      setEditAccessCode(activeSemester.access_code);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName("");
    setEditAccessCode("");
  };

  const handleSaveEdit = async () => {
    if (!activeSemester || !editName.trim() || !editAccessCode.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await updateSemesterMutation.mutateAsync({
        semesterId: activeSemester.id,
        name: editName.trim(),
        access_code: editAccessCode.trim(),
      });
      setIsEditing(false);
      refetchActive();
    } catch (error) {
      alert(error.message || "Failed to update semester");
    }
  };

  if (loadingActive || loadingAll) {
    return (
      <AdminSection title="Semester Access Codes" description="Manage semester access codes for user enrollment.">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </AdminSection>
    );
  }

  return (
    <AdminSection
      title="Semester Access Codes"
      description="Manage semester access codes for user enrollment."
      actions={
        !showCreateForm && !activeSemester && (
          <button
            className="px-3 py-2 rounded-lg bg-primary text-background text-sm font-semibold hover:opacity-90"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Semester
          </button>
        )
      }
    >
      {showCreateForm && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-accent/40">
          <h3 className="text-sm font-semibold text-text mb-3">Create New Semester</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted uppercase">Semester Name</label>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm"
                placeholder="e.g., Spring 2026"
                value={newSemesterName}
                onChange={(e) => setNewSemesterName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted uppercase">Start Date</label>
              <input
                type="date"
                className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted uppercase">End Date</label>
              <input
                type="date"
                className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              className="px-4 py-2 rounded-lg bg-primary text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              onClick={handleCreateSemester}
              disabled={createSemesterMutation.isPending}
            >
              {createSemesterMutation.isPending ? "Creating..." : "Create Semester"}
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-accent/40 text-sm font-semibold text-text hover:bg-slate-50"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeSemester ? (
        isEditing ? (
          // Edit Mode
          <div className="grid grid-cols-1 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label className="text-xs font-semibold text-muted uppercase">Semester Name</label>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Semester name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase">Access Code</label>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm font-mono"
                value={editAccessCode}
                onChange={(e) => setEditAccessCode(e.target.value)}
                placeholder="Access code"
              />
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                onClick={handleSaveEdit}
                disabled={updateSemesterMutation.isPending}
              >
                {updateSemesterMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="px-4 py-2 rounded-lg border border-accent/40 text-sm font-semibold text-text hover:bg-slate-50"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted uppercase">Active Semester</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-accent/40 px-4 py-3">
                <div>
                  <div className="text-lg font-semibold text-text">{activeSemester.name}</div>
                  <div className="text-xs text-muted mt-1">
                    {new Date(activeSemester.start_date).toLocaleDateString()} - {new Date(activeSemester.end_date).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="px-3 py-2 rounded-lg border border-accent/40 bg-white text-sm font-semibold text-text hover:bg-slate-50 flex items-center gap-2"
                  onClick={handleStartEdit}
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase">Access Code</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <div>
                  <div className="text-lg font-mono text-text font-bold">{activeSemester.access_code}</div>
                  <div className="text-xs text-green-700 mt-1">Active - Users can join with this code</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 rounded-lg border border-accent/40 bg-white text-sm font-semibold text-text hover:bg-slate-50 flex items-center gap-2"
                    onClick={handleCopyCode}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg border border-red-300 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    onClick={handleEndSemester}
                    disabled={endSemesterMutation.isPending}
                  >
                    {endSemesterMutation.isPending ? "Ending..." : "End Semester"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-8 text-muted">
          <p>No active semester. Create one to generate an access code.</p>
        </div>
      )}
    </AdminSection>
  );
}

export default AccessCodePanel;

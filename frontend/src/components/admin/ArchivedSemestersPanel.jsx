import { Loader2, Archive, Calendar } from "lucide-react";
import AdminSection from "./AdminSection";
import { useSemesters, useDeleteSemester } from "../../hooks/useApi";

function ArchivedSemestersPanel() {
  const { data: allSemesters, isLoading } = useSemesters();
  const deleteSemesterMutation = useDeleteSemester();

  const handleDelete = async (semester) => {
    if (!confirm(`Are you sure you want to permanently delete "${semester.name}" and ALL associated data? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteSemesterMutation.mutateAsync(semester.id);
    } catch (error) {
      alert(error.message || "Failed to delete semester");
    }
  };

  if (isLoading) {
    return (
      <AdminSection title="All Semesters" description="View and manage all semesters (active and archived).">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminSection>
    );
  }

  const semesters = allSemesters || [];
  const activeSemesters = semesters.filter(s => s.is_active);
  const archivedSemesters = semesters.filter(s => !s.is_active);

  return (
    <AdminSection
      title="All Semesters"
      description="View and manage all semesters. Archived semesters are read-only for users."
    >
      <div className="flex flex-col gap-6">
        {/* Active Semesters */}
        {activeSemesters.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted uppercase mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Active Semesters
            </h3>
            <div className="flex flex-col gap-3">
              {activeSemesters.map((semester) => (
                <div
                  key={semester.id}
                  className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-text">{semester.name}</div>
                      <div className="text-xs text-muted mt-1">
                        {new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                        Access Code: <span className="font-mono font-semibold">{semester.access_code}</span>
                      </div>
                    </div>
                    <div className="inline-flex px-3 py-1.5 rounded-full bg-green-600 text-white text-xs font-semibold">
                      ACTIVE
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archived Semesters */}
        <div>
          <h3 className="text-sm font-semibold text-muted uppercase mb-3 flex items-center gap-2">
            <Archive size={16} />
            Archived Semesters ({archivedSemesters.length})
          </h3>
          {archivedSemesters.length === 0 ? (
            <div className="text-center py-8 text-muted bg-slate-50 dark:bg-slate-800 rounded-lg">
              No archived semesters
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {archivedSemesters.map((semester) => (
                <div
                  key={semester.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-text">{semester.name}</div>
                      <div className="text-xs text-muted mt-1">
                        {new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Access Code: <span className="font-mono font-semibold">{semester.access_code}</span>
                      </div>
                      {semester.ended_at && (
                        <div className="text-xs text-muted mt-1">
                          Ended: {new Date(semester.ended_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(semester)}
                      disabled={deleteSemesterMutation.isPending}
                      className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      {deleteSemesterMutation.isPending ? "Deleting..." : "Delete Permanently"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminSection>
  );
}

export default ArchivedSemestersPanel;

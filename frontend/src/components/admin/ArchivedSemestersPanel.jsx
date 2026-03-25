import AdminSection from "./AdminSection";

const archivedSemesters = [
  {
    id: "arch-2025-fall",
    name: "Fall 2025",
    archivedOn: "Jan 10, 2026",
    notes: "Hidden from users. Read-only for admins.",
  },
  {
    id: "arch-2025-summer",
    name: "Summer 2025",
    archivedOn: "Aug 25, 2025",
    notes: "Hidden from users. Read-only for admins.",
  },
];

function ArchivedSemestersPanel() {
  return (
    <AdminSection
      title="Archived Semesters"
      description="Archived semesters are invisible to users and read-only for admins. Deletions are irreversible."
    >
      <div className="flex flex-col gap-4">
        {archivedSemesters.map((semester) => (
          <div
            key={semester.id}
            className="rounded-xl border border-accent/30 p-4 bg-background"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-text">
                  {semester.name}
                </div>
                <div className="text-xs text-muted mt-1">
                  Archived on {semester.archivedOn}
                </div>
                <div className="text-xs text-muted">{semester.notes}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-accent/40 text-xs font-semibold text-text">
                  View Messages
                </button>
                <button className="px-3 py-1.5 rounded-lg border border-accent/40 text-xs font-semibold text-text">
                  View Sessions
                </button>
                <button className="px-3 py-1.5 rounded-lg border border-red-300 text-xs font-semibold text-red-600">
                  Permanently Delete Data
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminSection>
  );
}

export default ArchivedSemestersPanel;

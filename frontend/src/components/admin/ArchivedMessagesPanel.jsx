import { useState, useEffect } from "react";
import { Loader2, MessageSquare, Calendar } from "lucide-react";
import AdminSection from "./AdminSection";
import { useSemesters, useArchivedMessages } from "../../hooks/useApi";
import { MessageCard } from "../MessageBoard";

function ArchivedMessagesPanel() {
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const { data: allSemesters, isLoading: semestersLoading } = useSemesters();
  const { data: messagesData, isLoading: messagesLoading } = useArchivedMessages(selectedSemesterId);

  const semesters = allSemesters || [];
  const selectedSemester = semesters.find(s => s.id === selectedSemesterId);

  // Default to active semester when data loads
  useEffect(() => {
    if (semesters.length > 0 && selectedSemesterId === null) {
      const activeSemester = semesters.find(s => s.is_active);
      if (activeSemester) {
        setSelectedSemesterId(activeSemester.id);
      }
    }
  }, [semesters, selectedSemesterId]);

  // Sort messages: pinned first, then by date
  const messages = (messagesData?.messages ?? []).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (semestersLoading) {
    return (
      <AdminSection title="Past Message Boards" description="View archived messages from previous semesters.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminSection>
    );
  }

  return (
    <AdminSection
      title="Past Message Boards"
      description="View archived messages from previous semesters. Messages are read-only."
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

        {/* Messages Display */}
        {selectedSemesterId && (
          <div>
            <h3 className="text-sm font-semibold text-muted uppercase mb-3 flex items-center gap-2">
              <MessageSquare size={16} />
              Messages from {selectedSemester?.name || "Selected Semester"}
            </h3>

            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted bg-slate-50 dark:bg-slate-800 rounded-lg">
                No messages found for this semester
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <MessageCard
                    key={msg.id}
                    msg={msg}
                    currentUserId=""
                    isAdmin={false}
                    readOnly={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedSemesterId && (
          <div className="text-center py-12 text-muted bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a semester to view its message board</p>
          </div>
        )}
      </div>
    </AdminSection>
  );
}

export default ArchivedMessagesPanel;

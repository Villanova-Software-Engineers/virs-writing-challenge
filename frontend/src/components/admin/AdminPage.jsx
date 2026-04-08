import { useMemo, useState } from "react";
import AccessCodePanel from "./AccessCodePanel";
import UserManagementPanel from "./UserManagementPanel";
import AdminManagementPanel from "./AdminManagementPanel";
import TimeLogPanel from "./TimeLogPanel";
import ArchivedSemestersPanel from "./ArchivedSemestersPanel";
import AdminNav from "./AdminNav";

function AdminPage() {
  const sections = useMemo(
    () => [
      { id: "access", label: "Semester & Access Codes", content: <AccessCodePanel /> },
      { id: "users", label: "User Management", content: <UserManagementPanel /> },
      { id: "admins", label: "Admin Management", content: <AdminManagementPanel /> },
      { id: "timelog", label: "Writing Sessions", content: <TimeLogPanel /> },
      { id: "archived", label: "Archived Semesters", content: <ArchivedSemestersPanel /> },
    ],
    []
  );
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const activeContent = sections.find((section) => section.id === activeSection)?.content;

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminNav activeId={activeSection} onSelect={setActiveSection} />
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8">
        <div className="flex flex-col gap-8">
          {activeContent}
        </div>
      </main>
    </div>
  );
}

export default AdminPage;

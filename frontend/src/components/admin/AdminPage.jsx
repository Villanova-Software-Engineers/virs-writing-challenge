import { useMemo, useState } from "react";
import AccessCodePanel from "./AccessCodePanel";
import UserManagementPanel from "./UserManagementPanel";
import TimeManagementPanel from "./TimeManagementPanel";
import TimeLogPanel from "./TimeLogPanel";
import MessagingPanel from "./MessagingPanel";
import NotificationPanel from "./NotificationPanel";
import ArchivedSemestersPanel from "./ArchivedSemestersPanel";
import AdminNav from "./AdminNav";

const quickStats = [
  { label: "Active Users", value: "1,284" },
  { label: "Pending Requests", value: "12" },
  { label: "Archived Semesters", value: "4" },
];

function AdminPage() {
  const sections = useMemo(
    () => [
      { id: "access", label: "Access Codes", content: <AccessCodePanel /> },
      { id: "users", label: "User Management", content: <UserManagementPanel /> },
      { id: "time", label: "Time Management", content: <TimeManagementPanel /> },
      { id: "timelog", label: "Time Log", content: <TimeLogPanel /> },
      { id: "messages", label: "Messaging", content: <MessagingPanel /> },
      { id: "notifications", label: "In-App Notifications", content: <NotificationPanel /> },
      { id: "archived", label: "Archived Semesters", content: <ArchivedSemestersPanel /> },
    ],
    []
  );
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const activeContent = sections.find((section) => section.id === activeSection)?.content;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text">Admin Control</h1>
        <p className="text-base text-muted mt-1">
          Manage users, sessions, messaging, and archived semesters.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {quickStats.map((stat) => (
          <div key={stat.label} className="bg-background rounded-xl shadow p-6">
            <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-text">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <AdminNav
          items={sections}
          activeId={activeSection}
          onSelect={setActiveSection}
        />
        <div className="flex-1 flex flex-col gap-8">
          {activeContent}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;

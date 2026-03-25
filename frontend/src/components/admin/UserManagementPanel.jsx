import { useState } from "react";
import AdminSection from "./AdminSection";

const semesters = ["Spring 2026", "Fall 2025", "Summer 2025"];
const users = [
  { id: "u-001", name: "Avery Coleman", email: "avery@virs.edu", role: "Admin" },
  { id: "u-002", name: "Riley Chen", email: "riley@virs.edu", role: "Student" },
  { id: "u-003", name: "Jordan Patel", email: "jordan@virs.edu", role: "Professor" },
];

function UserManagementPanel() {
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);

  return (
    <AdminSection
      title="User Management"
      description="Delete semester data, manage accounts, and promote or demote admins."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted uppercase">
              Semester For Data Deletion
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm"
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
            >
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>
          <button className="px-3 py-2 rounded-lg border border-red-300 text-sm font-semibold text-red-600">
            Delete Semester Data
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-accent/30">
          <table className="min-w-full text-sm">
            <thead className="bg-accent/20 text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/20">
              {users.map((user) => (
                <tr key={user.id} className="bg-background">
                  <td className="px-4 py-3 font-medium text-text">{user.name}</td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-accent/30 text-text">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button className="px-3 py-1.5 rounded-lg border border-accent/40 text-xs font-semibold text-text">
                        {user.role === "Admin" ? "Demote" : "Promote"}
                      </button>
                      <button className="px-3 py-1.5 rounded-lg border border-red-300 text-xs font-semibold text-red-600">
                        Delete Account
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminSection>
  );
}

export default UserManagementPanel;

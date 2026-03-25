import { useState } from "react";
import AdminSection from "./AdminSection";

const users = ["Riley Chen", "Jordan Patel", "Avery Coleman"];
const logs = [
  {
    id: "log-1",
    user: "Riley Chen",
    date: "Mar 16, 2026",
    start: "08:40",
    end: "09:25",
    duration: "00:45",
    semester: "Spring 2026",
  },
  {
    id: "log-2",
    user: "Riley Chen",
    date: "Mar 17, 2026",
    start: "07:55",
    end: "08:35",
    duration: "00:40",
    semester: "Spring 2026",
  },
  {
    id: "log-3",
    user: "Jordan Patel",
    date: "Mar 17, 2026",
    start: "18:10",
    end: "18:55",
    duration: "00:45",
    semester: "Spring 2026",
  },
];

function TimeLogPanel() {
  const [selectedUser, setSelectedUser] = useState(users[0]);

  const filteredLogs = logs.filter((log) => log.user === selectedUser);

  return (
    <AdminSection
      title="Time Log"
      description="View time logs for any user across their sessions."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted uppercase">
              Select User
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-accent/40 px-3 py-2 text-sm"
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
            >
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
          <button className="px-3 py-2 rounded-lg border border-accent/40 text-sm font-semibold text-text">
            Export CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-accent/30">
          <table className="min-w-full text-sm">
            <thead className="bg-accent/20 text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Start</th>
                <th className="px-4 py-3 text-left font-semibold">End</th>
                <th className="px-4 py-3 text-left font-semibold">Duration</th>
                <th className="px-4 py-3 text-left font-semibold">Semester</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/20">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="bg-background">
                  <td className="px-4 py-3 font-medium text-text">{log.date}</td>
                  <td className="px-4 py-3 text-muted">{log.start}</td>
                  <td className="px-4 py-3 text-muted">{log.end}</td>
                  <td className="px-4 py-3 text-muted font-mono">{log.duration}</td>
                  <td className="px-4 py-3 text-muted">{log.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminSection>
  );
}

export default TimeLogPanel;

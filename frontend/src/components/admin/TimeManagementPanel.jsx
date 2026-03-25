import AdminSection from "./AdminSection";

const sessions = [
  {
    id: "s-1",
    user: "Riley Chen",
    date: "Mar 16, 2026",
    start: "08:40",
    end: "09:25",
    duration: "00:45",
  },
  {
    id: "s-2",
    user: "Jordan Patel",
    date: "Mar 17, 2026",
    start: "18:10",
    end: "18:55",
    duration: "00:45",
  },
];

const auditLog = [
  {
    id: "a-1",
    action: "Adjusted session time",
    detail: "Riley Chen 08:40 -> 09:25",
    by: "Admin A",
    time: "Mar 17, 2026 - 10:12 AM",
  },
  {
    id: "a-2",
    action: "Adjusted session time",
    detail: "Jordan Patel 18:10 -> 18:55",
    by: "Admin B",
    time: "Mar 17, 2026 - 6:22 PM",
  },
];

function TimeManagementPanel() {
  return (
    <AdminSection
      title="Time Management"
      description="Edit session start or end times. All edits are logged in the audit log."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-accent/30">
            <table className="min-w-full text-sm">
              <thead className="bg-accent/20 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Start</th>
                  <th className="px-4 py-3 text-left font-semibold">End</th>
                  <th className="px-4 py-3 text-left font-semibold">Duration</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/20">
                {sessions.map((session) => (
                  <tr key={session.id} className="bg-background">
                    <td className="px-4 py-3 font-medium text-text">{session.user}</td>
                    <td className="px-4 py-3 text-muted">{session.date}</td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        defaultValue={session.start}
                        className="rounded-lg border border-accent/40 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        defaultValue={session.end}
                        className="rounded-lg border border-accent/40 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-muted font-mono">{session.duration}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="px-3 py-1.5 rounded-lg border border-accent/40 text-xs font-semibold text-text">
                        Save Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-accent/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-muted uppercase">Audit Log</h3>
          <div className="mt-4 flex flex-col gap-4">
            {auditLog.map((item) => (
              <div key={item.id} className="rounded-lg border border-accent/30 p-3 bg-background">
                <div className="text-sm font-semibold text-text">{item.action}</div>
                <div className="text-xs text-muted mt-1">{item.detail}</div>
                <div className="text-xs text-muted mt-2">
                  {item.by} - {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}

export default TimeManagementPanel;

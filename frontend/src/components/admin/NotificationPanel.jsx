import AdminSection from "./AdminSection";

function NotificationPanel() {
  return (
    <AdminSection
      title="In-App Notifications"
      description="Send targeted notifications that appear in the app notification drawer."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Notification title"
            className="rounded-lg border border-accent/40 px-3 py-2 text-sm"
          />
          <textarea
            rows={3}
            placeholder="Short message for the notification preview."
            className="rounded-lg border border-accent/40 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className="rounded-lg border border-accent/40 px-3 py-2 text-sm">
              <option>All users</option>
              <option>Admins only</option>
              <option>Professors</option>
              <option>Students</option>
            </select>
            <select className="rounded-lg border border-accent/40 px-3 py-2 text-sm">
              <option>Normal priority</option>
              <option>High priority</option>
              <option>Silent</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-accent/30 p-4 bg-accent/10">
          <div>
            <div className="text-xs font-semibold text-muted uppercase">Preview</div>
            <div className="mt-2 rounded-lg border border-primary/30 bg-background p-3">
              <div className="text-sm font-semibold text-text">
                Weekly writing target
              </div>
              <div className="text-xs text-muted mt-1">
                You are 45 minutes away from your goal.
              </div>
            </div>
          </div>
          <button className="px-3 py-2 rounded-lg bg-primary text-background text-sm font-semibold">
            Send Notification
          </button>
        </div>
      </div>
    </AdminSection>
  );
}

export default NotificationPanel;

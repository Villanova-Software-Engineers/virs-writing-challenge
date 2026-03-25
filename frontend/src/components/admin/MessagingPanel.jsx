import AdminSection from "./AdminSection";

const messages = [
  {
    id: "m-1",
    title: "Midterm Week Reminder",
    body: "Writing sessions are due by Friday. Please log at least 3 hours.",
    type: "Global Admin Message",
    date: "Mar 15, 2026",
  },
];

function MessagingPanel() {
  return (
    <AdminSection
      title="Messaging"
      description="Post global admin messages that are visually distinct for all users."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-accent/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-muted uppercase">Compose</h3>
          <div className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Message title"
              className="rounded-lg border border-accent/40 px-3 py-2 text-sm"
            />
            <textarea
              rows={4}
              placeholder="Share updates, deadlines, or announcements."
              className="rounded-lg border border-accent/40 px-3 py-2 text-sm"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-primary">
                  Global
                </span>
                <span>Visible across message board</span>
              </div>
              <button className="px-3 py-2 rounded-lg bg-primary text-background text-sm font-semibold">
                Post Message
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="rounded-xl border border-primary/40 bg-primary/10 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-semibold text-primary">
                    {message.type}
                  </div>
                  <div className="text-lg font-semibold text-text">
                    {message.title}
                  </div>
                </div>
                <span className="text-xs text-muted">{message.date}</span>
              </div>
              <p className="text-sm text-text mt-2">{message.body}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminSection>
  );
}

export default MessagingPanel;

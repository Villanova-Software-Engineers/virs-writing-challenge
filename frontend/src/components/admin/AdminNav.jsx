function AdminNav({ items, activeId, onSelect }) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-background rounded-2xl shadow p-4">
        <div className="text-xs font-semibold text-muted uppercase tracking-wide">
          Admin Sections
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-background"
                    : "text-text hover:bg-accent/20"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export default AdminNav;

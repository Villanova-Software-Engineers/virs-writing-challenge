function AdminSection({ title, description, children, actions }) {
  return (
    <section className="bg-background rounded-2xl shadow p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text">{title}</h2>
          {description && (
            <p className="text-sm text-muted mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default AdminSection;

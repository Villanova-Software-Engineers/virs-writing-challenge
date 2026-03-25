import { useState } from "react";

function Admin() {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text">Admin</h1>
        <p className="text-base text-muted mt-1">Manage application settings</p>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-background rounded-xl shadow p-6">
          <div className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
            Past Semesters
          </div>
          <div className="text-2xl font-bold text-text mb-4">—</div>
          <button
            onClick={() => setActiveModal("semesters")}
            className="w-full px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Semesters
          </button>
        </div>
      </div>

      {/* Semesters Modal */}
      {activeModal === "semesters" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">Semesters</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted hover:text-text transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-base text-muted">
              {/* TODO: List and manage semesters here */}
              No semesters configured yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;

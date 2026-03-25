import { useState } from "react";
import AdminSection from "./AdminSection";

const semesters = ["Spring 2026", "Fall 2025", "Summer 2025"];

function buildAccessCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const chunk = () =>
    Array.from({ length: 4 })
      .map(() =>
        Math.random() > 0.4
          ? letters[Math.floor(Math.random() * letters.length)]
          : numbers[Math.floor(Math.random() * numbers.length)]
      )
      .join("");

  return `${chunk()}-${chunk()}`;
}

function AccessCodePanel() {
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);
  const [accessCode, setAccessCode] = useState("VIRS-2026");
  const [status, setStatus] = useState("Active");

  const handleGenerate = () => {
    setAccessCode(buildAccessCode());
    setStatus("Active (new)");
  };

  const handleRevoke = () => {
    setStatus("Revoked");
  };

  return (
    <AdminSection
      title="Semester Access Codes"
      description="Generate time-bound access codes for professor onboarding and renewals."
      actions={
        <button
          className="px-3 py-2 rounded-lg bg-primary text-background text-sm font-semibold"
          onClick={handleGenerate}
        >
          Generate Code
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted uppercase">
            Semester
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

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-muted uppercase">
            Current Code
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-accent/40 px-4 py-3">
            <div>
              <div className="text-lg font-mono text-text">{accessCode}</div>
              <div className="text-xs text-muted">Status: {status}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-lg border border-accent/40 text-sm font-semibold text-text">
                Copy
              </button>
              <button
                className="px-3 py-2 rounded-lg border border-red-300 text-sm font-semibold text-red-600"
                onClick={handleRevoke}
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminSection>
  );
}

export default AccessCodePanel;

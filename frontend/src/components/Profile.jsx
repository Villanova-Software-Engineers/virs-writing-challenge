import { useState, useEffect } from "react";

function formatMinutes(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

const mockSemesters = [
  {
    id: 1,
    name: "Fall 2024",
    totalMinutes: 1234,
    longestStreak: 7,
    activeDays: 24,
  },
  {
    id: 2,
    name: "Spring 2025",
    totalMinutes: 980,
    longestStreak: 10,
    activeDays: 18,
  },
  {
    id: 3,
    name: "Fall 2025",
    totalMinutes: 1520,
    longestStreak: 14,
    activeDays: 30,
  },
];

function ProfileUI() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    department: "",
  });

  const [semesters, setSemesters] = useState(mockSemesters);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("profile");
      if (stored) setProfile(JSON.parse(stored));
      else
        setProfile({ first_name: "Jane", last_name: "Doe", department: "English" });
    } catch (e) {
      setProfile({ first_name: "Jane", last_name: "Doe", department: "English" });
    }
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  }

  function handleSave() {
    localStorage.setItem("profile", JSON.stringify(profile));
    setEditing(false);
  }

  const current = semesters[semesters.length - 1];

  return (
    <div className="flex flex-col min-h-screen py-8 px-4">
      <section className="max-w-4xl mx-auto w-full">
        <div className="bg-background rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text">Profile</h2>
            <div>
              {!editing ? (
                <button
                  className="px-4 py-2 bg-primary text-background rounded-lg font-semibold"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-primary text-background rounded-lg font-semibold"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  <button
                    className="px-4 py-2 bg-secondary text-text rounded-lg font-semibold"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="col-span-1 md:col-span-1">
              <div className="mb-4">
                <label className="block text-sm text-muted mb-1">First name</label>
                <input
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={`w-full px-3 py-2 rounded-lg border ${editing ? "border-primary" : "border-transparent"} bg-input text-text`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-muted mb-1">Last name</label>
                <input
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={`w-full px-3 py-2 rounded-lg border ${editing ? "border-primary" : "border-transparent"} bg-input text-text`}
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Department</label>
                <input
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  disabled={!editing}
                  className={`w-full px-3 py-2 rounded-lg border ${editing ? "border-primary" : "border-transparent"} bg-input text-text`}
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-text mb-3">Current Semester</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background rounded-xl p-4 shadow-md text-center">
                  <div className="text-sm text-muted">Total Time</div>
                  <div className="text-2xl font-bold text-text mt-2">{formatMinutes(current.totalMinutes)}</div>
                </div>

                <div className="bg-background rounded-xl p-4 shadow-md text-center">
                  <div className="text-sm text-muted">Longest Streak</div>
                  <div className="text-2xl font-bold text-text mt-2">{current.longestStreak}d</div>
                </div>

                <div className="bg-background rounded-xl p-4 shadow-md text-center">
                  <div className="text-sm text-muted">Active Days</div>
                  <div className="text-2xl font-bold text-text mt-2">{current.activeDays}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Historical Semesters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {semesters
                .slice()
                .reverse()
                .map((s) => (
                  <div key={s.id} className="bg-background rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-text">{s.name}</div>
                        <div className="text-sm text-muted">{formatMinutes(s.totalMinutes)} • {s.longestStreak}d streak</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-muted">Active days</div>
                      <div className="text-lg font-bold text-text">{s.activeDays}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfileUI;

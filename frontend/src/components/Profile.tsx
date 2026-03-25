import { useState, useEffect } from "react";
import { User, Clock, Flame, Calendar, Loader2, AlertCircle, Check, X, Shield } from "lucide-react";
import {
  useProfile,
  useUpdateProfile,
  useProfileStats,
  useProfileHistory,
} from "../hooks/useApi";
import { DEPARTMENTS } from "../constants/departments";

function formatMinutes(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function ProfileSkeleton() {
  return (
    <div className="bg-background rounded-xl shadow-lg p-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-slate-200 rounded w-32" />
        <div className="h-10 bg-slate-200 rounded w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="space-y-4">
          <div className="h-16 bg-slate-100 rounded-lg" />
          <div className="h-16 bg-slate-100 rounded-lg" />
          <div className="h-16 bg-slate-100 rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <div className="h-6 bg-slate-200 rounded w-40 mb-3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-24 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    department: "",
  });

  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { data: history, isLoading: historyLoading } = useProfileHistory();
  const updateMutation = useUpdateProfile();

  // Sync form data with profile
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        department: profile.department,
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData, {
      onSuccess: () => setEditing(false),
    });
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        department: profile.department,
      });
    }
    setEditing(false);
  };

  const isLoading = profileLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen py-8 px-4">
        <section className="max-w-4xl mx-auto w-full">
          <ProfileSkeleton />
        </section>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col min-h-screen py-8 px-4">
        <section className="max-w-4xl mx-auto w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <p className="text-red-800 font-medium">Failed to load profile</p>
              <p className="text-red-600 text-sm">{profileError.message}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen py-8 px-4">
      <section className="max-w-4xl mx-auto w-full">
        <div className="bg-background rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="text-primary" size={28} />
              <h2 className="text-2xl font-bold text-text">Profile</h2>
            </div>
            <div>
              {!editing ? (
                <button
                  className="px-4 py-2 bg-primary text-background rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 px-4 py-2 bg-primary text-background rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Save
                  </button>
                  <button
                    className="flex items-center gap-1 px-4 py-2 bg-slate-200 text-text rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Form Fields */}
            <div className="col-span-1">
              <div className="mb-4">
                <label className="block text-sm text-muted mb-1">First name</label>
                <input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    editing ? "border-primary bg-white" : "border-transparent bg-slate-50"
                  } text-text focus:outline-none focus:ring-2 focus:ring-primary transition`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-muted mb-1">Last name</label>
                <input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    editing ? "border-primary bg-white" : "border-transparent bg-slate-50"
                  } text-text focus:outline-none focus:ring-2 focus:ring-primary transition`}
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Department</label>
                {editing ? (
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-primary bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary transition"
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="department"
                    value={formData.department || "Not set"}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-transparent bg-slate-50 text-text"
                  />
                )}
              </div>

              {profile?.email && (
                <div className="mt-4">
                  <label className="block text-sm text-muted mb-1">Email</label>
                  <input
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-transparent bg-slate-50 text-muted"
                  />
                </div>
              )}

              {profile?.is_admin && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                  <Shield size={16} className="text-primary" />
                  <span className="text-sm font-medium text-primary">Administrator</span>
                </div>
              )}
            </div>

            {/* Current Stats */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-text mb-3">Current Semester Stats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted mb-1">
                    <Clock size={14} />
                    Total Time
                  </div>
                  <div className="text-2xl font-bold text-text">
                    {stats ? formatMinutes(stats.total_time) : "0m"}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted mb-1">
                    <Flame size={14} className="text-orange-400" />
                    Longest Streak
                  </div>
                  <div className="text-2xl font-bold text-text">
                    {stats?.longest_streak ?? 0}d
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted mb-1">
                    <Calendar size={14} />
                    Active Days
                  </div>
                  <div className="text-2xl font-bold text-text">
                    {stats?.active_days ?? 0}
                  </div>
                </div>
              </div>

              {/* Current Streak */}
              {stats && stats.current_streak > 0 && (
                <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2">
                    <Flame size={20} className="text-orange-500" fill="currentColor" />
                    <span className="font-semibold text-orange-700">
                      Current Streak: {stats.current_streak} days
                    </span>
                    {stats.current_streak >= 7 && (
                      <span className="text-sm text-orange-500">On fire!</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historical Semesters */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Historical Semesters</h3>
            {historyLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-24 mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-32 mb-3" />
                    <div className="h-4 bg-slate-100 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : history && history.semesters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {history.semesters.map((s) => (
                  <div key={s.semester_id} className="bg-slate-50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-text">{s.semester_name}</div>
                        <div className="text-sm text-muted">
                          {formatMinutes(s.total_time)} • {s.longest_streak}d streak
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Calendar size={12} />
                        <span>{s.active_days} active days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-muted">No historical data yet</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

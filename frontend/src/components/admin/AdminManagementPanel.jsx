import { useState } from "react";
import { Loader2, Shield, ShieldOff } from "lucide-react";
import AdminSection from "./AdminSection";
import { useAdminUsers, useSetUserAdmin } from "../../hooks/useApi";

function AdminManagementPanel() {
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();
  const setAdminMutation = useSetUserAdmin();

  const [processingUserId, setProcessingUserId] = useState(null);

  const handleToggleAdmin = async (user) => {
    const newAdminStatus = !user.is_admin;
    const action = newAdminStatus ? "grant admin access to" : "remove admin access from";

    if (!confirm(`Are you sure you want to ${action} "${user.first_name} ${user.last_name}" (${user.email})?`)) {
      return;
    }

    setProcessingUserId(user.id);
    try {
      await setAdminMutation.mutateAsync({
        userId: user.id,
        isAdmin: newAdminStatus,
      });
    } catch (error) {
      alert(error.message || "Failed to update admin status");
    } finally {
      setProcessingUserId(null);
    }
  };

  if (usersLoading) {
    return (
      <AdminSection title="Admin Management" description="Manage admin privileges for users.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminSection>
    );
  }

  const users = usersData?.users || [];
  const adminUsers = users.filter(u => u.is_admin);
  const nonAdminUsers = users.filter(u => !u.is_admin);

  return (
    <AdminSection
      title="Admin Management"
      description="Manage admin privileges for users."
    >
      <div className="flex flex-col gap-6">
        {/* Admin Count Stats */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-muted uppercase">Total Admins</div>
          <div className="text-2xl font-bold text-text mt-1">{adminUsers.length}</div>
        </div>

        {/* Current Admins */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-3">Current Admins</h3>
          {adminUsers.length === 0 ? (
            <div className="rounded-xl border border-accent/30 p-8 text-center text-muted">
              No admin users found
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-accent/30">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700 text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Joined</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/20 bg-white dark:bg-slate-800">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-4 py-3 font-medium text-text">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted">{user.email}</td>
                      <td className="px-4 py-3 text-muted">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            disabled={processingUserId === user.id}
                            className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <ShieldOff size={14} />
                            {processingUserId === user.id ? "Removing..." : "Remove Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Non-Admin Users */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-3">Grant Admin Access</h3>
          {nonAdminUsers.length === 0 ? (
            <div className="rounded-xl border border-accent/30 p-8 text-center text-muted">
              All users are already admins
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-accent/30">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700 text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Joined</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/20 bg-white dark:bg-slate-800">
                  {nonAdminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-4 py-3 font-medium text-text">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted">{user.email}</td>
                      <td className="px-4 py-3 text-muted">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            disabled={processingUserId === user.id}
                            className="px-3 py-1.5 rounded-lg border border-green-300 dark:border-green-800 text-xs font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Shield size={14} />
                            {processingUserId === user.id ? "Granting..." : "Make Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminSection>
  );
}

export default AdminManagementPanel;

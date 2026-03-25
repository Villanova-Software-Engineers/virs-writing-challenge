import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import AdminSection from "./AdminSection";
import { useAdminUsers, useUpdateUser, useDeleteUser } from "../../hooks/useApi";

function UserManagementPanel() {
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", department: "" });

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.first_name,
      lastName: user.last_name,
      department: user.department,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ firstName: "", lastName: "", department: "" });
  };

  const handleSaveEdit = async (userId) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        department: editForm.department.trim(),
      });
      handleCancelEdit();
    } catch (error) {
      alert(error.message || "Failed to update user");
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.first_name} ${user.last_name}" (${user.email})? This will remove all their data and cannot be undone.`)) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(user.id);
    } catch (error) {
      alert(error.message || "Failed to delete user");
    }
  };

  if (usersLoading) {
    return (
      <AdminSection title="User Management" description="Manage user accounts and admin permissions.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminSection>
    );
  }

  const users = usersData?.users || [];

  return (
    <AdminSection
      title="User Management"
      description="Manage user accounts and admin permissions."
    >
      <div className="flex flex-col gap-5">
        {/* Stats */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-muted uppercase">Total Users</div>
          <div className="text-2xl font-bold text-text mt-1">{usersData?.total || 0}</div>
        </div>

        {/* User Table */}
        <div className="overflow-hidden rounded-xl border border-accent/30">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/20 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  editingUser?.id === user.id ? (
                    // Edit mode row
                    <tr key={user.id} className="bg-blue-50">
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            placeholder="First name"
                            className="flex-1 rounded border border-accent/40 px-2 py-1 text-sm"
                          />
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            placeholder="Last name"
                            className="flex-1 rounded border border-accent/40 px-2 py-1 text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted text-sm">{user.email}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.department}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                          placeholder="Department"
                          className="w-full rounded border border-accent/40 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() => handleSaveEdit(user.id)}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 rounded-lg border border-accent/40 text-xs font-semibold text-text hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Normal view row
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted">{user.email}</td>
                      <td className="px-4 py-3 text-muted text-sm">{user.department || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1.5 rounded-lg border border-accent/40 text-xs font-semibold text-text hover:bg-slate-50 flex items-center gap-1.5"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="px-3 py-1.5 rounded-lg border border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminSection>
  );
}

export default UserManagementPanel;

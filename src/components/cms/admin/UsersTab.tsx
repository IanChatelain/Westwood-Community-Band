'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey, type RolePermissionMap } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { updateProfileRole, listProfiles, createProfile, deleteProfile, updateProfileContactSettings } from '@/app/actions/profiles';
import { listRolePermissions, setRolePermission, fetchCurrentUserPermissions } from '@/app/actions/rbac';
import { X, UserPlus, Shield, Trash2, HelpCircle } from 'lucide-react';

export default function UsersTab() {
  const { state } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.GUEST);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', email: '', role: UserRole.MEMBER as UserRole, password: '' });
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  // Delete user
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Role permissions matrix
  const [rolePerms, setRolePerms] = useState<Record<string, RolePermissionMap> | null>(null);
  const [permsLoading, setPermsLoading] = useState(true);
  const [permsSaving, setPermsSaving] = useState<string | null>(null);

  // Current user's permissions
  const [myPerms, setMyPerms] = useState<RolePermissionMap | null>(null);

  const currentUser = state.currentUser;
  const canManageUsers = myPerms?.manage_users ?? currentUser?.role === UserRole.ADMIN;

  const loadUsers = useCallback(async () => {
    const data = await listProfiles();
    setUsers(data.map((p) => ({
      id: p.id,
      username: p.username,
      role: p.role as UserRole,
      email: p.email,
      isContactRecipient: p.isContactRecipient,
      contactLabel: p.contactLabel ?? undefined,
    })));
    setLoading(false);
  }, []);

  const loadPerms = useCallback(async () => {
    const [allPerms, currentPerms] = await Promise.all([
      listRolePermissions(),
      fetchCurrentUserPermissions(),
    ]);
    setRolePerms(allPerms);
    setMyPerms(currentPerms);
    setPermsLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
    loadPerms();
  }, [loadUsers, loadPerms]);

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    setError(null);
    const { error: err } = await updateProfileRole(editUser.id, newRole);
    setSaving(false);
    if (err) { setError(err); return; }
    setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, role: newRole } : u));
    setEditUser(null);
  };

  const handleAddUser = async () => {
    setAddSaving(true);
    setAddError(null);
    const { error: err, user } = await createProfile(
      addForm.username,
      addForm.email,
      addForm.role,
      addForm.password,
    );
    setAddSaving(false);
    if (err) { setAddError(err); return; }
    if (user) {
      setUsers(prev => [...prev, { id: user.id, username: user.username, role: user.role as UserRole, email: user.email, isContactRecipient: false }]);
    }
    setShowAddUser(false);
    setAddForm({ username: '', email: '', role: UserRole.MEMBER, password: '' });
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: err } = await deleteProfile(deleteTarget.id);
    setDeleting(false);
    if (err) { setError(err); return; }
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleTogglePermission = async (role: string, permission: PermissionKey, current: boolean) => {
    const key = `${role}:${permission}`;
    setPermsSaving(key);
    // Optimistic update
    setRolePerms(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [role]: { ...prev[role], [permission]: !current },
      };
    });
    const { error: err } = await setRolePermission(role, permission, !current);
    if (err) {
      // Revert optimistic update
      setRolePerms(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [role]: { ...prev[role], [permission]: current },
        };
      });
      setError(err);
    }
    setPermsSaving(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-8 text-center text-slate-500">
        Loading users…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── User List ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-slate-900">Team Members</h3>
          {canManageUsers && (
            <button
              type="button"
              onClick={() => { setShowAddUser(true); setAddError(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <UserPlus size={16} /> Add User
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Manage who can receive messages from the website contact form. Enable the toggle and add a label (e.g. President, Treasurer) to show them as an option when visitors send a message.
        </p>
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4" scope="col">User</th>
                <th className="px-6 py-4" scope="col">Role</th>
                <th className="px-6 py-4" scope="col">Email</th>
                <th className="px-6 py-4" scope="col">
                  <span className="inline-flex items-center gap-1">
                    Contact Form
                    <HelpCircle
                      size={14}
                      className="text-slate-400 cursor-help"
                      title="Enable to show this person as a recipient on the website contact form. Add a label (e.g. President) to identify them in the contact dropdown."
                    />
                  </span>
                </th>
                <th className="px-6 py-4" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-100 text-red-600 flex items-center justify-center font-bold" aria-hidden="true">
                        {user.username[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-bold text-slate-900">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${user.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    {canManageUsers && user.email ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            const next = !user.isContactRecipient;
                            const label = next ? (user.contactLabel ?? null) : null;
                            setUsers(prev => prev.map(u => u.id === user.id
                              ? { ...u, isContactRecipient: next, contactLabel: next ? u.contactLabel : undefined }
                              : u
                            ));
                            const { error: err } = await updateProfileContactSettings(user.id, {
                              isContactRecipient: next,
                              contactLabel: label,
                            });
                            if (err) {
                              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isContactRecipient: !next, contactLabel: user.contactLabel } : u));
                              setError(err);
                            }
                          }}
                          className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer ${
                            user.isContactRecipient ? 'bg-red-600' : 'bg-slate-300'
                          }`}
                          title={user.isContactRecipient ? 'Remove from contact form' : 'Show on contact form'}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            user.isContactRecipient ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                        {user.isContactRecipient && (
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                              Label (e.g. President)
                            </label>
                            <input
                              type="text"
                              className="w-36 px-2 py-1 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                              placeholder={user.username}
                              value={user.contactLabel ?? ''}
                              aria-label={`Contact form label for ${user.username}`}
                              title="Label shown in the contact form recipient dropdown, e.g. President or Treasurer"
                              onChange={(e) => {
                                const val = e.target.value;
                                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, contactLabel: val || undefined } : u));
                              }}
                              onBlur={async () => {
                                const { error: err } = await updateProfileContactSettings(user.id, {
                                  isContactRecipient: user.isContactRecipient,
                                  contactLabel: user.contactLabel ?? null,
                                });
                                if (err) setError(err);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">{user.email ? '—' : 'No email'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {canManageUsers && user.id !== currentUser?.id && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditUser(user); setNewRole(user.role); setError(null); }}
                          className="text-red-600 hover:underline text-sm font-bold"
                        >
                          Edit Role
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Role Capabilities Matrix ── */}
      {canManageUsers && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-slate-700" />
            <h3 className="text-lg font-bold text-slate-900">Role Capabilities</h3>
          </div>
          {permsLoading ? (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-8 text-center text-slate-500">
              Loading permissions…
            </div>
          ) : rolePerms && (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4" scope="col">Role</th>
                    {PERMISSION_KEYS.map((key) => (
                      <th key={key} className="px-4 py-4 text-center" scope="col">
                        {PERMISSION_LABELS[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(UserRole).map((role) => {
                    const perms = rolePerms[role];
                    if (!perms) return null;
                    return (
                      <tr key={role} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                            {role}
                          </span>
                        </td>
                        {PERMISSION_KEYS.map((key) => {
                          const enabled = perms[key];
                          const isProtected =
                            role === UserRole.ADMIN && (key === 'access_admin' || key === 'manage_users');
                          const savingThis = permsSaving === `${role}:${key}`;
                          return (
                            <td key={key} className="px-4 py-4 text-center">
                              <button
                                type="button"
                                disabled={isProtected || !!permsSaving}
                                onClick={() => handleTogglePermission(role, key, enabled)}
                                className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                  enabled ? 'bg-red-600' : 'bg-slate-300'
                                } ${isProtected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${savingThis ? 'animate-pulse' : ''}`}
                                title={isProtected ? 'This permission cannot be revoked for ADMIN' : `${enabled ? 'Disable' : 'Enable'} ${PERMISSION_LABELS[key]} for ${role}`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    enabled ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        </div>
      )}

      {/* ── Edit Role Modal ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" aria-modal="true" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit role: {editUser.username}</h3>
              <button type="button" onClick={() => { setEditUser(null); setError(null); }} className="p-2 text-slate-500 hover:text-slate-700 rounded-lg" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value={UserRole.ADMIN}>ADMIN</option>
                  <option value={UserRole.EDITOR}>EDITOR</option>
                  <option value={UserRole.MEMBER}>MEMBER</option>
                  <option value={UserRole.GUEST}>GUEST</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="button" onClick={handleSaveRole} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" aria-modal="true" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
              <button type="button" onClick={() => setShowAddUser(false)} className="p-2 text-slate-500 hover:text-slate-700 rounded-lg" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Username</label>
                <input
                  type="text"
                  value={addForm.username}
                  onChange={(e) => setAddForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Initial Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value={UserRole.ADMIN}>ADMIN</option>
                  <option value={UserRole.EDITOR}>EDITOR</option>
                  <option value={UserRole.MEMBER}>MEMBER</option>
                  <option value={UserRole.GUEST}>GUEST</option>
                </select>
              </div>
              {addError && <p className="text-sm text-red-600" role="alert">{addError}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="button" onClick={handleAddUser} disabled={addSaving} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70">
                  {addSaving ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete User Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" aria-modal="true" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Delete user</h3>
              <button type="button" onClick={() => setDeleteTarget(null)} className="p-2 text-slate-500 hover:text-slate-700 rounded-lg" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to permanently delete <strong>{deleteTarget.username}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="button" onClick={handleDeleteUser} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

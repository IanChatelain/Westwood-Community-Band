'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { updateProfileRole, listProfiles } from '@/app/actions/profiles';
import { X } from 'lucide-react';

export default function UsersTab() {
  const { state } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.GUEST);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = state.currentUser;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    listProfiles().then((data) => {
      setLoading(false);
      setUsers(data.map((p) => ({
        id: p.id,
        username: p.username,
        role: p.role as UserRole,
        email: p.email,
      })));
    });
  }, [editUser]);

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    setError(null);
    const { error: err } = await updateProfileRole(editUser.id, newRole);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, role: newRole } : u));
    setEditUser(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-8 text-center text-slate-500">
        Loading users…
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4" scope="col">User</th>
              <th className="px-6 py-4" scope="col">Role / Permissions</th>
              <th className="px-6 py-4" scope="col">Contact</th>
              <th className="px-6 py-4" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-100 text-red-600 flex items-center justify-center font-bold" aria-hidden="true">
                      {user.username[0].toUpperCase()}
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
                  {isAdmin && user.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => { setEditUser(user); setNewRole(user.role); setError(null); }}
                      className="text-red-600 hover:underline text-sm font-bold"
                    >
                      Edit Rights
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </>
  );
}

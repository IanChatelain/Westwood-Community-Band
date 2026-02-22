'use client';

import React from 'react';
import { User, UserRole } from '@/types';

interface UsersTabProps {
  users: User[];
}

export default function UsersTab({ users }: UsersTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-widest">
          <tr>
            <th className="px-6 py-4" scope="col">
              User
            </th>
            <th className="px-6 py-4" scope="col">
              Role / Permissions
            </th>
            <th className="px-6 py-4" scope="col">
              Contact
            </th>
            <th className="px-6 py-4" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-100 text-red-600 flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-900">{user.username}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    user.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
              <td className="px-6 py-4">
                <button className="text-red-600 hover:underline text-sm font-bold">Edit Rights</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

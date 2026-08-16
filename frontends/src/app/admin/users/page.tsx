'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminUsers, suspendUser, activateUser, updateAdminUser } from '@/lib/services';
import { formatDate } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  content_manager: 'Content Manager',
  finance_manager: 'Finance',
  support_agent: 'Support',
  instructor: 'Instructor',
  student: 'Student',
};

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchTerm, roleFilter, statusFilter],
    queryFn: () => getAdminUsers({
      page,
      limit: 10,
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    }),
  });

  const suspendMutation = useMutation({
    mutationFn: suspendUser,
    onSuccess: () => { toast.success('User suspended'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Failed to suspend user'),
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => { toast.success('User activated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Failed to activate user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => updateAdminUser(id, body),
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
    },
    onError: () => toast.error('Failed to update user'),
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Management</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage users, roles, and access.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col md:flex-row gap-4 justify-between bg-[var(--bg-surface)]/30">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email..."
              className="input-base pl-9 w-full text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            <select className="input-base px-3 py-1.5 text-sm" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input-base px-3 py-1.5 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending</option>
            </select>
          </div>
        </div>

        <div className="table-scroll min-h-[280px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)] border-b border-[var(--border-subtle)] uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-4"><div className="skeleton h-10 w-full rounded" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">No users found</td></tr>
              ) : users.map((user: any) => (
                <tr key={user._id} className="hover:bg-[var(--bg-surface)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--navy-800)] flex items-center justify-center text-white text-sm font-bold">
                        {user.name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{user.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge text-xs px-2 py-0.5 border bg-[var(--bg-surface)] border-[var(--border-subtle)]">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs px-2 py-0.5 ${user.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditUser(user)} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded text-[var(--text-secondary)]" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button onClick={() => suspendMutation.mutate(user._id)} className="p-1.5 hover:bg-red-500/10 rounded text-[var(--text-secondary)] hover:text-red-600" title="Suspend">
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => activateMutation.mutate(user._id)} className="p-1.5 hover:bg-green-500/10 rounded text-[var(--text-secondary)] hover:text-green-600" title="Activate">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)]/30">
          <span className="text-sm text-[var(--text-muted)]">Showing {users.length} of {total} users</span>
          <div className="flex gap-1">
            <button className="btn-outline px-3 py-1.5 text-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="px-3 py-1.5 text-sm text-[var(--text-secondary)]">Page {page} of {totalPages || 1}</span>
            <button className="btn-outline px-3 py-1.5 text-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md border border-[var(--border-subtle)]">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold">Edit User</h3>
              <button onClick={() => setEditUser(null)}><X className="w-5 h-5" /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateMutation.mutate({
                id: editUser._id,
                body: {
                  name: fd.get('name'),
                  role: fd.get('role'),
                  phone: fd.get('phone') || undefined,
                },
              });
            }}>
              <input name="name" defaultValue={editUser.name} placeholder="Name" className="input-base w-full" required />
              <input name="phone" defaultValue={editUser.phone || ''} placeholder="Phone" className="input-base w-full" />
              <select name="role" defaultValue={editUser.role} className="input-base w-full">
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button type="submit" className="btn-brand w-full py-2.5" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

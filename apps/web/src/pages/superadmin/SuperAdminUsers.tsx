import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../../components/layout/DashboardShell';
import apiClient from '../../api/client';
import { t } from '../../theme';
import { Search, Loader2, Inbox, Crown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Role = 'superadmin' | 'admin' | 'owner' | 'staff';
type AssignableRole = 'admin' | 'owner' | 'staff';

interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  company: { name: string; slug: string; status: string } | null;
  createdAt: string;
}

const ROLE_FILTERS: Array<'all' | Role> = ['all', 'superadmin', 'admin', 'owner', 'staff'];
const ASSIGNABLE: AssignableRole[] = ['admin', 'owner', 'staff'];

const roleBadge = (role: Role) => {
  switch (role) {
    case 'superadmin':
      return t.badgeAmber;
    case 'admin':
      return t.badgeGreen;
    case 'owner':
      return t.badgeYellow;
    default:
      return t.badgeNavy;
  }
};

const SuperAdminUsers = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | Role>('all');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['sa-users', search, role],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (role !== 'all') params.role = role;
      return (await apiClient.get('/superadmin/users', { params })).data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AssignableRole }) =>
      apiClient.patch(`/superadmin/users/${id}/role`, { role }),
    // success/error toasts come from the apiClient interceptor (backend message)
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-users'] }); },
  });

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className={t.h2}>Users</h1>
            <p className={t.muted}>
              {users?.length ?? 0} identities across the platform.
            </p>
          </div>
          <div className="w-full md:w-80 bg-card border border-border rounded-2xl px-4 py-2.5 flex items-center gap-3 focus-within:ring-2 ring-primary/20 transition-all shadow-sm">
            <Search size={18} className="text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="bg-transparent border-none outline-none text-xs w-full font-medium"
            />
          </div>
        </header>

        {/* ROLE PILLS */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                role === r
                  ? 'bg-primary text-brand-navy border-primary shadow-yellow'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead className={`${t.tableHead} border-b border-border`}>
                <tr>
                  <th className="px-6 py-5">User</th>
                  <th className="px-6 py-5">Company</th>
                  <th className="px-6 py-5">Role</th>
                  <th className="px-6 py-5 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                          Loading users...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : !users || users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                      <Inbox className="mx-auto text-muted-foreground/30 mb-4" size={56} />
                      <h3 className="text-lg font-black text-muted-foreground">No users found</h3>
                      <p className="text-sm text-foreground/40 mt-1">
                        Adjust your search or role filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {users.map((u) => (
                      <motion.tr
                        key={u._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={t.tableRow}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-muted rounded-2xl flex items-center justify-center text-foreground font-black text-xs border border-border shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-foreground font-black truncate">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-foreground/90 font-bold text-xs">
                            {u.company?.name || '—'}
                          </p>
                          {u.company?.status && (
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                              {u.company.status}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={roleBadge(u.role)}>{u.role}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end">
                            {u.role === 'superadmin' ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-xl text-muted-foreground">
                                <Lock size={13} />
                                <Crown size={13} className="text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                  Platform Owner
                                </span>
                              </div>
                            ) : (
                              <select
                                value={u.role}
                                disabled={roleMutation.isPending}
                                onChange={(e) =>
                                  roleMutation.mutate({
                                    id: u._id,
                                    role: e.target.value as AssignableRole,
                                  })
                                }
                                className="bg-muted border border-border rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest text-foreground outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer disabled:opacity-50"
                              >
                                {ASSIGNABLE.map((r) => (
                                  <option key={r} value={r} className="bg-card text-foreground">
                                    {r}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default SuperAdminUsers;

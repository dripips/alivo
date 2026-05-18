import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';
import Badge from '../../components/ui/Badge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  role: 'WARD' | 'GUARDIAN' | 'ADMIN';
  plan: string;
  lastActive: string | null;
  status: 'active' | 'inactive' | 'suspended';
}

interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const roleBadge: Record<string, { variant: 'info' | 'ok' | 'warning'; label: string }> = {
  ADMIN: { variant: 'warning', label: 'Admin' },
  GUARDIAN: { variant: 'info', label: 'Guardian' },
  WARD: { variant: 'ok', label: 'Ward' },
};

const statusColors: Record<string, string> = {
  active: 'var(--color-success)',
  inactive: 'var(--color-text-tertiary)',
  suspended: 'var(--color-danger)',
};

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  AdminUsers                                                         */
/* ------------------------------------------------------------------ */

const AdminUsers: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      const res = await api.get<PaginatedUsers>(
        `/admin/users?page=${page}&limit=${limit}${q}`
      );
      setUsers(res.users);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Search bar ── */}
      <div className="relative animate-fade-up">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search users..."
          className="w-full h-11 pl-12 pr-4 bg-[var(--color-surface-secondary)] text-[var(--color-text)] rounded-[var(--radius-sm)] border-0 text-[15px] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-shadow"
        />
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-[var(--color-danger)] text-[17px]">
            Failed to load users: {error}
          </p>
        </div>
      )}

      {/* ── User list ── */}
      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-[15px] text-[var(--color-text-tertiary)]">No users found.</p>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden animate-fade-up">
              {users.map((user, idx) => {
                const rb = roleBadge[user.role] || roleBadge.WARD;
                const isExpanded = expandedId === user.id;

                return (
                  <div key={user.id}>
                    {idx > 0 && (
                      <div className="border-t border-[var(--color-separator)] ml-5" />
                    )}

                    {/* Main row */}
                    <button
                      onClick={() => toggleExpand(user.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 min-h-[64px] text-left active:opacity-60 transition-opacity cursor-pointer"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0 text-[15px] font-semibold text-[var(--color-text-tertiary)]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[17px] font-semibold text-[var(--color-text)] truncate">
                            {user.name}
                          </p>
                          <Badge variant={rb.variant} size="sm">
                            {rb.label}
                          </Badge>
                        </div>
                        <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5 truncate">
                          {user.email || '--'}
                        </p>
                      </div>

                      {/* Status dot */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: statusColors[user.status] || statusColors.inactive }}
                        />
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[var(--color-text-quaternary)]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[var(--color-text-quaternary)]" />
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-0 ml-14 animate-fade-in">
                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-[15px]">
                          <div>
                            <dt className="text-[13px] text-[var(--color-text-tertiary)]">Plan</dt>
                            <dd className="text-[var(--color-text)] font-medium capitalize">
                              {user.plan || 'Free'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[13px] text-[var(--color-text-tertiary)]">Last Active</dt>
                            <dd className="text-[var(--color-text)]">
                              {formatDate(user.lastActive)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[13px] text-[var(--color-text-tertiary)]">Status</dt>
                            <dd
                              className="font-medium capitalize"
                              style={{ color: statusColors[user.status] || statusColors.inactive }}
                            >
                              {user.status}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2 animate-fade-up">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] flex items-center justify-center active:opacity-60 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-default"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--color-text)]" />
              </button>

              <span className="text-[15px] text-[var(--color-text-tertiary)]">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] flex items-center justify-center active:opacity-60 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-default"
              >
                <ChevronRight className="w-5 h-5 text-[var(--color-text)]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;

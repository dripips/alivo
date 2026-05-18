import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Shield,
  MessageSquare,
  BrainCircuit,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminStats {
  totalUsers: number;
  totalWards: number;
  totalGuardians: number;
  checkInsMonth: number;
  aiMessagesMonth: number;
  sosAlerts: number;
  subscriptions?: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, delay = 0 }) => (
  <div
    className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div
      className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center mb-4"
      style={{ background: iconBg }}
    >
      {icon}
    </div>
    <p className="text-[34px] font-bold text-[var(--color-text)] leading-none mb-1">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    <p className="text-[15px] text-[var(--color-text-tertiary)]">{label}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  AdminDashboard                                                     */
/* ------------------------------------------------------------------ */

const AdminDashboard: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminStats>('/admin/stats')
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  /* Loading */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* Error */
  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--color-danger)] text-[17px]">
          Failed to load stats: {error ?? 'Unknown error'}
        </p>
      </div>
    );
  }

  const statCards = [
    {
      icon: <Users className="w-5 h-5 text-[var(--color-primary)]" />,
      iconBg: 'color-mix(in srgb, var(--color-primary) 14%, transparent)',
      label: 'Total Users',
      value: stats.totalUsers,
    },
    {
      icon: <UserCheck className="w-5 h-5 text-[var(--color-success)]" />,
      iconBg: 'color-mix(in srgb, var(--color-success) 14%, transparent)',
      label: 'Wards',
      value: stats.totalWards,
    },
    {
      icon: <Shield className="w-5 h-5 text-[var(--color-accent)]" />,
      iconBg: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
      label: 'Guardians',
      value: stats.totalGuardians,
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-[var(--color-warning)]" />,
      iconBg: 'color-mix(in srgb, var(--color-warning) 14%, transparent)',
      label: 'Check-ins (month)',
      value: stats.checkInsMonth,
    },
    {
      icon: <BrainCircuit className="w-5 h-5 text-[var(--color-info)]" />,
      iconBg: 'color-mix(in srgb, var(--color-info) 14%, transparent)',
      label: 'AI Messages (month)',
      value: stats.aiMessagesMonth,
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-[var(--color-danger)]" />,
      iconBg: 'color-mix(in srgb, var(--color-danger) 14%, transparent)',
      label: 'SOS Alerts',
      value: stats.sosAlerts,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 40} />
        ))}
      </div>

      {/* ── Subscription Breakdown ── */}
      {stats.subscriptions && (
        <section className="animate-fade-up" style={{ animationDelay: '280ms' }}>
          <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
            Active Subscriptions
          </h2>

          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
            {Object.entries(stats.subscriptions).map(([tier, count], i) => (
              <div key={tier}>
                {i > 0 && (
                  <div className="border-t border-[var(--color-separator)] ml-5" />
                )}
                <div className="flex items-center justify-between px-5 py-4 min-h-[52px]">
                  <span className="text-[17px] font-medium text-[var(--color-text)] capitalize">
                    {tier}
                  </span>
                  <span className="text-[17px] font-bold text-[var(--color-text-tertiary)]">
                    {count.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;

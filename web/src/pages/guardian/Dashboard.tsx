import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

/* ---------- Types ---------- */

interface Ward {
  id: string;
  name: string;
  lastCheckIn: string | null;
  moodAverage: number | null;
  moodTrend: 'up' | 'down' | 'stable' | null;
  status: 'ok' | 'alert' | 'waiting' | 'escalated' | 'unknown';
}

/* ---------- Helpers ---------- */

const statusToBadgeVariant: Record<Ward['status'], 'ok' | 'alert' | 'warning' | 'muted'> = {
  ok: 'ok',
  alert: 'alert',
  waiting: 'warning',
  escalated: 'alert',
  unknown: 'muted',
};

const trendArrow: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

function relativeTime(
  iso: string | null,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (!iso) return '--';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t('common:today');
  if (minutes < 60) return t('common:minutes_ago', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('common:hours_ago', { count: hours });
  if (hours < 48) return t('common:yesterday');
  return new Date(iso).toLocaleDateString();
}

/* ---------- Component ---------- */

const Dashboard: React.FC = () => {
  const { t } = useTranslation(['guardian', 'common']);
  const navigate = useNavigate();
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Ward[]>('/dashboard/overview')
      .then(setWards)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--color-text-secondary)] text-lg animate-pulse">
          {t('common:loading')}
        </p>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--color-danger)] text-lg">
          {t('common:error')}: {error}
        </p>
      </div>
    );
  }

  /* ---- Empty state ---- */
  if (wards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--color-text-tertiary)]"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)] text-lg max-w-xs">
          {t('guardian:no_wards')}
        </p>
      </div>
    );
  }

  /* ---- Ward grid ---- */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {wards.map((ward, idx) => (
        <Card
          key={ward.id}
          onClick={() => navigate(`/guardian/ward/${ward.id}`)}
          className="animate-fade-up"
          {...({ style: { animationDelay: `${idx * 60}ms` } } as React.HTMLAttributes<HTMLDivElement>)}
        >
          {/* Name + status */}
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-semibold text-[var(--color-text)] truncate pr-2">
              {ward.name}
            </h2>
            <Badge variant={statusToBadgeVariant[ward.status]}>
              {t(`guardian:status_${ward.status}`)}
            </Badge>
          </div>

          {/* Mood average + trend */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[var(--color-text-secondary)] text-sm">
              {t('guardian:mood_trend')}:
            </span>
            {ward.moodAverage != null ? (
              <span className="text-lg font-bold text-[var(--color-text)]">
                {ward.moodAverage.toFixed(1)}
                {ward.moodTrend && (
                  <span
                    className={[
                      'ml-1 text-base',
                      ward.moodTrend === 'up' ? 'text-[var(--color-success)]' : '',
                      ward.moodTrend === 'down' ? 'text-[var(--color-danger)]' : '',
                      ward.moodTrend === 'stable' ? 'text-[var(--color-text-secondary)]' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {trendArrow[ward.moodTrend]}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[var(--color-text-tertiary)]">--</span>
            )}
          </div>

          {/* Last active */}
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {t('guardian:last_active')}: {relativeTime(ward.lastCheckIn, t)}
          </p>
        </Card>
      ))}
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

/* ---------- Types ---------- */

interface SosAlert {
  id: string;
  wardName?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: string;
  resolved: boolean;
}

/* ---------- Helpers ---------- */

const severityVariant: Record<SosAlert['severity'], 'muted' | 'warning' | 'alert'> = {
  low: 'muted',
  medium: 'warning',
  high: 'alert',
  critical: 'alert',
};

const severityLabel: Record<SosAlert['severity'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ---------- Component ---------- */

const Alerts: React.FC = () => {
  const { t } = useTranslation(['guardian', 'common']);
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<SosAlert[]>('/sos/history')
      .then(setAlerts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--color-text-secondary)] text-lg animate-pulse">
          {t('common:loading')}
        </p>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--color-danger)] text-lg">
          {t('common:error')}: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* WebSocket placeholder banner */}
      <Card className="border-dashed border-[var(--color-primary)]/40">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-pulse shrink-0" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Real-time alerts via WebSocket &mdash; connect guardian dashboard socket for live
            updates.
          </p>
        </div>
      </Card>

      {/* Alert feed */}
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-text-secondary)]">{t('common:no_data')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <Card
              key={alert.id}
              className={[
                'animate-fade-up',
                alert.severity === 'critical' ? 'border-[var(--color-danger)]/30' : '',
                alert.severity === 'high' ? 'border-[var(--color-danger)]/20' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              {...({
                style: { animationDelay: `${idx * 40}ms` },
              } as React.HTMLAttributes<HTMLDivElement>)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={severityVariant[alert.severity]}>
                      {severityLabel[alert.severity]}
                    </Badge>
                    {alert.wardName && (
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {alert.wardName}
                      </span>
                    )}
                    {alert.resolved && <Badge variant="ok">Resolved</Badge>}
                  </div>
                  <p className="text-sm text-[var(--color-text)]">{alert.message}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {formatDate(alert.createdAt)}
                  </p>
                </div>

                {/* Severity dot */}
                <div
                  className={[
                    'w-2 h-2 rounded-full shrink-0 mt-2',
                    alert.severity === 'critical'
                      ? 'bg-[var(--color-danger)] animate-pulse'
                      : '',
                    alert.severity === 'high' ? 'bg-[var(--color-danger)]' : '',
                    alert.severity === 'medium' ? 'bg-yellow-500' : '',
                    alert.severity === 'low' ? 'bg-gray-400' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;

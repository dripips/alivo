import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

/* ---------- Types ---------- */

interface MoodEntry {
  id: string;
  score: number;
  note?: string;
  createdAt: string;
}

interface CheckIn {
  id: string;
  type: string;
  summary: string;
  createdAt: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
}

interface MedicalProfile {
  conditions: string[];
  allergies: string[];
  bloodType: string;
  doctorName: string;
  doctorPhone: string;
}

interface FraudAlert {
  id: string;
  triggerText: string;
  patterns: string[];
  createdAt: string;
}

interface WardDetailData {
  ward: {
    name: string;
    locale: string;
    isActive: boolean;
    lastActive: string | null;
  };
  mood: {
    average: number | null;
    trend: string | null;
    data: MoodEntry[];
  };
  checkIns: {
    recent: CheckIn[];
  };
  medical: {
    medications: Medication[];
    adherence: {
      total: number;
      taken: number;
      missed: number;
      adherenceRate: number;
    };
    profile: MedicalProfile;
  };
  fraudAlerts: FraudAlert[];
}

/* ---------- Helpers ---------- */

const moodColor: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
  5: 'bg-blue-500',
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

const WardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['guardian', 'common']);
  const navigate = useNavigate();

  const [data, setData] = useState<WardDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<WardDetailData>(`/dashboard/ward/${id}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-[var(--color-danger)] text-lg">
          {t('common:error')}: {error ?? 'Unknown'}
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          {t('common:back')}
        </Button>
      </div>
    );
  }

  const { ward, mood, checkIns, medical, fraudAlerts } = data;
  const adherencePercent = Math.round(medical.adherence.adherenceRate * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('common:back')}
      </button>

      {/* ---- Header ---- */}
      <Card className="animate-fade-up">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{ward.name}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {t('guardian:last_active')}:{' '}
              {ward.lastActive ? formatDate(ward.lastActive) : '--'}
            </p>
          </div>
          <Badge variant={ward.isActive ? 'ok' : 'muted'}>
            {ward.isActive ? t('guardian:status_ok') : t('guardian:status_unknown')}
          </Badge>
        </div>
      </Card>

      {/* ---- Mood ---- */}
      <Card
        className="animate-fade-up"
        {...({ style: { animationDelay: '60ms' } } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          {t('guardian:mood_trend')}
        </h2>

        <div className="flex items-center gap-4 mb-5">
          <span className="text-3xl font-bold text-[var(--color-text)]">
            {mood.average != null ? mood.average.toFixed(1) : '--'}
          </span>
          {mood.trend && (
            <span className="text-sm text-[var(--color-text-secondary)]">{mood.trend}</span>
          )}
        </div>

        {/* Last 10 mood dots */}
        <div className="flex items-center gap-2 flex-wrap">
          {mood.data.slice(0, 10).map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col items-center gap-1"
              title={entry.note ?? ''}
            >
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                  moodColor[entry.score] ?? 'bg-gray-400',
                ].join(' ')}
              >
                {entry.score}
              </div>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ---- Medication Adherence ---- */}
      <Card
        className="animate-fade-up"
        {...({ style: { animationDelay: '120ms' } } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          {t('guardian:medication_adherence')}
        </h2>

        {/* Percentage bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[var(--color-text-secondary)]">
              {medical.adherence.taken}/{medical.adherence.total}
            </span>
            <span className="font-semibold text-[var(--color-text)]">{adherencePercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--color-surface)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-success)] transition-all duration-500"
              style={{ width: `${adherencePercent}%` }}
            />
          </div>
        </div>

        {/* Medication list */}
        {medical.medications.length > 0 && (
          <ul className="space-y-2">
            {medical.medications.map((med) => (
              <li
                key={med.id}
                className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-b-0"
              >
                <div>
                  <p className="font-medium text-[var(--color-text)]">{med.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{med.dosage}</p>
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)]">{med.schedule}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ---- Medical Profile ---- */}
      <Card
        className="animate-fade-up"
        {...({ style: { animationDelay: '180ms' } } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          {t('common:profile')}
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-[var(--color-text-tertiary)]">Conditions</dt>
            <dd className="text-[var(--color-text)]">
              {medical.profile.conditions.length > 0
                ? medical.profile.conditions.join(', ')
                : '--'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-tertiary)]">Allergies</dt>
            <dd className="text-[var(--color-text)]">
              {medical.profile.allergies.length > 0
                ? medical.profile.allergies.join(', ')
                : '--'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-tertiary)]">Blood Type</dt>
            <dd className="text-[var(--color-text)]">{medical.profile.bloodType || '--'}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-tertiary)]">Doctor</dt>
            <dd className="text-[var(--color-text)]">
              {medical.profile.doctorName || '--'}
              {medical.profile.doctorPhone && (
                <span className="text-[var(--color-text-secondary)] ml-1">
                  ({medical.profile.doctorPhone})
                </span>
              )}
            </dd>
          </div>
        </dl>
      </Card>

      {/* ---- Fraud Alerts ---- */}
      {fraudAlerts.length > 0 && (
        <Card
          className="animate-fade-up border-[var(--color-danger)]/30"
          {...({ style: { animationDelay: '240ms' } } as React.HTMLAttributes<HTMLDivElement>)}
        >
          <h2 className="text-lg font-semibold text-[var(--color-danger)] mb-4">
            {t('guardian:fraud_alerts')}
          </h2>

          <ul className="space-y-3">
            {fraudAlerts.map((alert) => (
              <li
                key={alert.id}
                className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/15"
              >
                <p className="text-sm font-medium text-[var(--color-text)] mb-1">
                  {alert.triggerText}
                </p>
                <div className="flex flex-wrap gap-1 mb-1">
                  {alert.patterns.map((p, i) => (
                    <Badge key={i} variant="alert">
                      {p}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {formatDate(alert.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ---- Recent Check-ins ---- */}
      <Card
        className="animate-fade-up"
        {...({ style: { animationDelay: '300ms' } } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          {t('guardian:recent_checkins')}
        </h2>

        {checkIns.recent.length === 0 ? (
          <p className="text-[var(--color-text-secondary)] text-sm">{t('common:no_data')}</p>
        ) : (
          <ol className="relative border-l-2 border-[var(--color-border)] ml-3 space-y-4">
            {checkIns.recent.map((ci) => (
              <li key={ci.id} className="pl-5 relative">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-bg)]" />
                <p className="text-sm font-medium text-[var(--color-text)]">{ci.summary}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {formatDate(ci.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
};

export default WardDetail;

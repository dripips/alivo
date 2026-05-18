import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Heart,
  Activity,
  Droplets,
  Weight,
  Pill,
  ShieldAlert,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  X,
} from 'lucide-react';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  taken?: boolean;
}

interface MedicalProfile {
  conditions: string[];
  allergies: string[];
  bloodType: string;
  doctorName: string;
  doctorPhone: string;
}

interface WellnessVitals {
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  bloodSugar?: number;
  weight?: number;
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
    status?: string;
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
  wellness?: WellnessVitals;
  fraudAlerts: FraudAlert[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const moodColors: Record<number, string> = {
  1: '#FF3B30',
  2: '#FF9500',
  3: '#FFCC00',
  4: '#34C759',
  5: '#007AFF',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusMap: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
  ok:      { label: 'В порядке',  labelEn: 'OK',      color: 'var(--color-success)', bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)' },
  alert:   { label: 'Тревога',    labelEn: 'Alert',    color: 'var(--color-danger)',  bg: 'color-mix(in srgb, var(--color-danger) 12%, transparent)' },
  waiting: { label: 'Ожидание',   labelEn: 'Waiting',  color: 'var(--color-warning)', bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)' },
  unknown: { label: 'Неизвестно', labelEn: 'Unknown',  color: 'var(--color-text-tertiary)', bg: 'var(--color-surface-secondary)' },
};

/* ------------------------------------------------------------------ */
/*  WardDetail                                                         */
/* ------------------------------------------------------------------ */

const WardDetail: React.FC = () => {
  const { id, lang } = useParams<{ id: string; lang: string }>();
  const { t, i18n } = useTranslation(['guardian', 'common']);
  const navigate = useNavigate();
  const l = lang || 'ru';
  const isRu = i18n.language === 'ru';

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

  /* Loading */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* Error */
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[var(--color-danger)] text-[17px]">
          {t('common:error')}: {error ?? 'Unknown'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-[var(--color-primary)] text-[17px] font-medium active:opacity-60 transition-opacity cursor-pointer"
        >
          {t('common:back')}
        </button>
      </div>
    );
  }

  const { ward, mood, checkIns, medical, fraudAlerts } = data;
  const wellness = (data as any).wellness?.latest || (data as any).wellness || null;
  const adherencePercent = Math.min(100, Math.round(medical.adherence.adherenceRate));
  const status = statusMap[ward.status || (ward.isActive ? 'ok' : 'unknown')] || statusMap.unknown;

  const TrendIcon =
    mood.trend === 'improving' ? TrendingUp :
    mood.trend === 'declining' ? TrendingDown : Minus;

  return (
    <div className="px-5 pt-3 pb-8 space-y-7 max-w-3xl mx-auto">
      {/* ── Back button ── */}
      <button
        onClick={() => navigate(`/${l}/guardian/dashboard`)}
        className="inline-flex items-center gap-1 text-[17px] text-[var(--color-primary)] font-medium active:opacity-60 transition-opacity cursor-pointer -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        {isRu ? 'Дашборд' : 'Dashboard'}
      </button>

      {/* ── Large title + status ── */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[34px] font-bold tracking-tight leading-tight">
            {ward.name}
          </h1>
          <span
            className="text-[13px] font-semibold px-2.5 py-1 rounded-[var(--radius-xs)]"
            style={{ background: status.bg, color: status.color }}
          >
            {isRu ? status.label : status.labelEn}
          </span>
        </div>
        {ward.lastActive && (
          <p className="text-[15px] text-[var(--color-text-tertiary)] mt-1">
            {isRu ? 'Последняя активность' : 'Last active'}: {formatDate(ward.lastActive)}
          </p>
        )}
      </div>

      {/* ── Mood Section ── */}
      <section className="animate-fade-up" style={{ animationDelay: '40ms' }}>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
          {isRu ? 'Настроение' : 'Mood'}
        </h2>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5">
          {/* Average + trend */}
          <div className="flex items-center gap-4 mb-5">
            <span className="text-[40px] font-bold text-[var(--color-text)] leading-none">
              {mood.average != null ? mood.average.toFixed(1) : '--'}
            </span>
            {mood.trend && (
              <div className="flex items-center gap-1.5">
                <TrendIcon
                  className="w-5 h-5"
                  style={{
                    color:
                      mood.trend === 'improving'
                        ? 'var(--color-success)'
                        : mood.trend === 'declining'
                        ? 'var(--color-danger)'
                        : 'var(--color-text-tertiary)',
                  }}
                />
                <span className="text-[15px] text-[var(--color-text-tertiary)] capitalize">
                  {mood.trend}
                </span>
              </div>
            )}
          </div>

          {/* Last 10 check-in mood dots */}
          <div className="flex items-end gap-2 flex-wrap">
            {mood.data.slice(0, 10).map((entry: any, i: number) => {
              const score = entry.mood ?? entry.score ?? 0;
              const date = entry.respondedAt || entry.scheduledAt || entry.createdAt;
              return (
                <div key={entry.id || i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                    style={{ background: moodColors[score] || '#8E8E93' }}
                  >
                    {score || '?'}
                  </div>
                  <span className="text-[11px] text-[var(--color-text-quaternary)]">
                    {date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                </div>
              );
            })}
            {mood.data.length === 0 && (
              <p className="text-[15px] text-[var(--color-text-tertiary)]">
                {isRu ? 'Нет данных' : 'No data'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Medications ── */}
      <section className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
          {isRu ? 'Лекарства' : 'Medications'}
        </h2>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
          {/* Adherence bar */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between text-[15px] mb-2">
              <span className="text-[var(--color-text-tertiary)]">
                {isRu ? 'Приверженность' : 'Adherence'}
              </span>
              <span className="font-bold text-[var(--color-text)]">{adherencePercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${adherencePercent}%`,
                  background:
                    adherencePercent >= 80
                      ? 'var(--color-success)'
                      : adherencePercent >= 50
                      ? 'var(--color-warning)'
                      : 'var(--color-danger)',
                }}
              />
            </div>
            <p className="text-[13px] text-[var(--color-text-quaternary)] mt-1.5">
              {medical.adherence.taken}/{medical.adherence.total} {isRu ? 'принято' : 'taken'}
            </p>
          </div>

          {/* Medication list */}
          {medical.medications.map((med, i) => (
            <div key={med.id}>
              <div className="border-t border-[var(--color-separator)] ml-[60px]" />
              <div className="flex items-center gap-3.5 px-5 py-3.5 min-h-[52px]">
                <div className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)' }}>
                  <Pill className="w-[18px] h-[18px] text-[var(--color-success)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-medium text-[var(--color-text)]">{med.name}</p>
                  <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
                    {med.dosage}
                    {med.schedule && typeof med.schedule === 'object'
                      ? ` · ${(Array.isArray(med.schedule) ? med.schedule : []).map((s: any) => s.time || s).join(', ')}`
                      : med.schedule ? ` · ${med.schedule}` : ''}
                  </p>
                </div>
                {med.taken != null && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: med.taken
                        ? 'color-mix(in srgb, var(--color-success) 14%, transparent)'
                        : 'color-mix(in srgb, var(--color-danger) 14%, transparent)',
                    }}
                  >
                    {med.taken ? (
                      <Check className="w-4 h-4 text-[var(--color-success)]" />
                    ) : (
                      <X className="w-4 h-4 text-[var(--color-danger)]" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {medical.medications.length === 0 && (
            <div className="px-5 py-4 border-t border-[var(--color-separator)]">
              <p className="text-[15px] text-[var(--color-text-tertiary)]">
                {isRu ? 'Нет лекарств' : 'No medications'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Wellness Vitals ── */}
      <section className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
          {isRu ? 'Показатели здоровья' : 'Wellness'}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <Activity className="w-[18px] h-[18px] text-[var(--color-danger)]" />,
              iconBg: 'color-mix(in srgb, var(--color-danger) 14%, transparent)',
              label: isRu ? 'Давление' : 'BP',
              value:
                (wellness?.bloodPressureH ?? wellness?.systolic) != null
                  ? `${wellness.bloodPressureH ?? wellness.systolic}/${wellness.bloodPressureL ?? wellness.diastolic}`
                  : '--',
              unit: 'mmHg',
            },
            {
              icon: <Heart className="w-[18px] h-[18px] text-[var(--color-primary)]" />,
              iconBg: 'color-mix(in srgb, var(--color-primary) 14%, transparent)',
              label: isRu ? 'Пульс' : 'Heart Rate',
              value: wellness?.heartRate != null ? String(wellness.heartRate) : '--',
              unit: isRu ? 'уд/мин' : 'bpm',
            },
            {
              icon: <Droplets className="w-[18px] h-[18px] text-[var(--color-accent)]" />,
              iconBg: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
              label: isRu ? 'Сахар' : 'Sugar',
              value: wellness?.bloodSugar != null ? wellness.bloodSugar.toFixed(1) : '--',
              unit: 'mmol/L',
            },
            {
              icon: <Weight className="w-[18px] h-[18px] text-[var(--color-success)]" />,
              iconBg: 'color-mix(in srgb, var(--color-success) 14%, transparent)',
              label: isRu ? 'Вес' : 'Weight',
              value: wellness?.weight != null ? wellness.weight.toFixed(1) : '--',
              unit: isRu ? 'кг' : 'kg',
            },
          ].map(({ icon, iconBg, label, value, unit }) => (
            <div
              key={label}
              className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-4"
            >
              <div
                className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center mb-2"
                style={{ background: iconBg }}
              >
                {icon}
              </div>
              <span className="text-[13px] text-[var(--color-text-tertiary)]">{label}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[22px] font-bold text-[var(--color-text)] leading-none">
                  {value}
                </span>
                <span className="text-[13px] text-[var(--color-text-quaternary)]">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fraud Alerts ── */}
      {fraudAlerts.length > 0 && (
        <section className="animate-fade-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-[14px] font-semibold text-[var(--color-danger)] uppercase tracking-wide mb-3 px-1">
            {isRu ? 'Подозрительная активность' : 'Fraud Alerts'}
          </h2>

          <div className="space-y-3">
            {fraudAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-4 border-l-4 border-[var(--color-danger)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)' }}
                  >
                    <ShieldAlert className="w-[18px] h-[18px] text-[var(--color-danger)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-[var(--color-text)]">
                      {alert.triggerText}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {alert.patterns.map((p, i) => (
                        <span
                          key={i}
                          className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-[var(--radius-xs)]"
                          style={{
                            background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
                            color: 'var(--color-danger)',
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <p className="text-[13px] text-[var(--color-text-quaternary)] mt-2">
                      {formatDate(alert.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent Check-ins Timeline ── */}
      <section className="animate-fade-up" style={{ animationDelay: '200ms' }}>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
          {isRu ? 'Последние чек-ины' : 'Recent Check-ins'}
        </h2>

        {checkIns.recent.length === 0 ? (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5 text-center">
            <p className="text-[15px] text-[var(--color-text-tertiary)]">
              {isRu ? 'Нет данных' : 'No data'}
            </p>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
            {checkIns.recent.map((ci: any, idx: number) => {
              const date = ci.respondedAt || ci.scheduledAt || ci.createdAt;
              const moodVal = ci.mood;
              const statusLabel = ci.status === 'RESPONDED' ? (isRu ? 'Ответил' : 'Responded')
                : ci.status === 'MISSED' ? (isRu ? 'Пропущен' : 'Missed')
                : ci.status === 'ESCALATED' ? (isRu ? 'Эскалация' : 'Escalated')
                : (isRu ? 'Ожидание' : 'Pending');
              return (
              <div key={ci.id || idx}>
                {idx > 0 && (
                  <div className="border-t border-[var(--color-separator)] ml-[60px]" />
                )}
                <div className="flex items-center gap-3.5 px-5 py-3.5 min-h-[56px]">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-[13px] font-bold"
                    style={{ background: moodVal ? (moodColors[moodVal] || '#8E8E93') : 'var(--color-surface-secondary)' }}
                  >
                    {moodVal || '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-[var(--color-text)]">
                      {statusLabel}{moodVal ? ` · ${isRu ? 'настроение' : 'mood'} ${moodVal}/5` : ''}
                    </p>
                    <p className="text-[13px] text-[var(--color-text-quaternary)] mt-0.5">
                      {date ? formatDate(date) : '—'}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default WardDetail;

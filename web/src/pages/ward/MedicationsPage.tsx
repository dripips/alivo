import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Check, Clock, Pill } from 'lucide-react';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScheduleEntry {
  time: string;
  days: string[];
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: ScheduleEntry[];
  instructions?: string;
  isActive?: boolean;
  status?: 'pending' | 'taken' | 'upcoming';
}

interface TimeGroup {
  time: string;
  label: string;
  medications: Medication[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeOfDayLabel(time: string): string {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'Утро';
  if (hour >= 12 && hour < 17) return 'День';
  if (hour >= 17 && hour < 21) return 'Вечер';
  return 'Ночь';
}

/* ------------------------------------------------------------------ */
/*  MedicationsPage                                                    */
/* ------------------------------------------------------------------ */

const MedicationsPage: React.FC = () => {
  const { t } = useTranslation(['ward', 'common']);
  const { lang } = useParams<{ lang: string }>();
  const isRu = (lang || 'ru') === 'ru';

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* Fetch */
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Medication[]>('/medical/medications');
        setMedications(data);
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Group by schedule time */
  const timeGroups = useMemo<TimeGroup[]>(() => {
    const map = new Map<string, Medication[]>();

    medications.forEach((med) => {
      if (med.schedule && med.schedule.length > 0) {
        med.schedule.forEach((entry) => {
          const existing = map.get(entry.time) || [];
          existing.push(med);
          map.set(entry.time, existing);
        });
      } else {
        const existing = map.get('--:--') || [];
        existing.push(med);
        map.set('--:--', existing);
      }
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, meds]) => ({
        time,
        label:
          time === '--:--'
            ? isRu
              ? 'Без расписания'
              : 'No schedule'
            : `${timeOfDayLabel(time)} · ${time}`,
        medications: meds,
      }));
  }, [medications, isRu]);

  /* Adherence */
  const adherence = useMemo(() => {
    if (medications.length === 0) return 0;
    const taken = medications.filter((m) => m.status === 'taken').length;
    return Math.round((taken / medications.length) * 100);
  }, [medications]);

  /* Take action */
  const handleTake = async (medId: string) => {
    setActionLoading(medId);
    try {
      await api.post(`/medical/medications/${medId}/take`);
      setMedications((prev) =>
        prev.map((m) => (m.id === medId ? { ...m, status: 'taken' as const } : m)),
      );
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(null);
    }
  };

  /* Status dot color */
  const dotColor = (status?: string) => {
    switch (status) {
      case 'taken':
        return 'bg-[var(--color-success)]';
      case 'pending':
        return 'bg-[var(--color-warning)]';
      default:
        return 'bg-[var(--color-text-quaternary)]';
    }
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pb-28 space-y-7">
      {/* ── Title + adherence badge ── */}
      <div className="flex items-center gap-3">
        <h1 className="text-[34px] font-bold text-[var(--color-text)] leading-tight">
          {isRu ? 'Лекарства' : 'Medications'}
        </h1>

        {medications.length > 0 && (
          <span
            className="inline-flex items-center gap-1 px-3 h-7 rounded-full text-[13px] font-semibold"
            style={{
              background: 'color-mix(in srgb, var(--color-success) 14%, transparent)',
              color: 'var(--color-success)',
            }}
          >
            {adherence}% {isRu ? 'приверженность' : 'adherence'}
          </span>
        )}
      </div>

      {/* ── Empty state ── */}
      {medications.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
            >
              <Pill className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <p className="text-[15px] text-[var(--color-text-tertiary)]">
              {t('common:no_data')}
            </p>
          </div>
        </div>
      ) : (
        /* ── Time-of-day sections ── */
        <div className="space-y-7">
          {timeGroups.map((group) => (
            <section key={group.time} className="space-y-2">
              {/* Section header */}
              <h2 className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)] px-1">
                {group.label}
              </h2>

              {/* Grouped list card */}
              <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
                {group.medications.map((med, idx) => {
                  const isTaken = med.status === 'taken';
                  const isPending = med.status === 'pending';
                  const isUpcoming = !med.status || med.status === 'upcoming';

                  return (
                    <div key={`${med.id}-${group.time}`}>
                      {/* Separator */}
                      {idx > 0 && (
                        <div className="border-t border-[var(--color-separator)] ml-[60px]" />
                      )}

                      {/* Row */}
                      <div className="flex items-center gap-3 min-h-[56px] px-4 py-3">
                        {/* Status dot in icon box */}
                        <div className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0">
                          <div className={`w-3 h-3 rounded-full ${dotColor(med.status)}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[17px] font-medium text-[var(--color-text)] leading-snug ${
                              isTaken ? 'line-through opacity-50' : ''
                            }`}
                          >
                            {med.name}
                          </p>
                          <p className="text-[13px] text-[var(--color-text-tertiary)] leading-snug mt-0.5">
                            {med.dosage}
                            {med.instructions ? ` · ${med.instructions}` : ''}
                          </p>
                        </div>

                        {/* Right action */}
                        {isTaken && (
                          <span className="text-[var(--color-success)] text-[20px] font-semibold shrink-0">
                            &#10003;
                          </span>
                        )}

                        {isPending && (
                          <button
                            type="button"
                            disabled={actionLoading === med.id}
                            onClick={() => handleTake(med.id)}
                            className="shrink-0 h-9 px-4 rounded-[var(--radius-sm)] bg-[var(--color-success)] text-white text-[15px] font-semibold active:opacity-60 transition-opacity cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === med.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isRu ? (
                              'Принять'
                            ) : (
                              'Take'
                            )}
                          </button>
                        )}

                        {isUpcoming && (
                          <span className="text-[15px] text-[var(--color-text-tertiary)] shrink-0 flex items-center gap-1">
                            <Clock className="w-[14px] h-[14px]" />
                            {group.time !== '--:--' ? group.time : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicationsPage;

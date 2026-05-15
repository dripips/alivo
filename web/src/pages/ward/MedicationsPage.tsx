import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock, Pill, Plus, X, AlarmClock } from 'lucide-react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

interface ScheduleEntry { time: string; days: string[]; }

interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: ScheduleEntry[];
  instructions?: string;
  status?: 'pending' | 'taken' | 'snoozed' | 'skipped';
}

/** Map a time string like "08:00" to a Russian time-of-day label */
function timeOfDayLabel(time: string): string {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'Утро';
  if (hour >= 12 && hour < 17) return 'День';
  if (hour >= 17 && hour < 21) return 'Вечер';
  return 'Ночь';
}

interface TimeGroup {
  time: string;
  label: string;
  medications: Medication[];
}

const MedicationsPage: React.FC = () => {
  const { t } = useTranslation(['ward', 'common']);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const data = await api.get<Medication[]>('/medical/medications');
        setMedications(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, []);

  /** Group medications by schedule time */
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
        // Medications without schedule go to a "No time" group
        const existing = map.get('--:--') || [];
        existing.push(med);
        map.set('--:--', existing);
      }
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, meds]) => ({
        time,
        label: time === '--:--' ? 'Без расписания' : timeOfDayLabel(time),
        medications: meds,
      }));
  }, [medications]);

  /** Adherence percentage — taken vs total */
  const adherence = useMemo(() => {
    if (medications.length === 0) return 0;
    const taken = medications.filter((m) => m.status === 'taken').length;
    return Math.round((taken / medications.length) * 100);
  }, [medications]);

  const handleAction = async (
    medId: string,
    action: 'take' | 'snooze' | 'skip'
  ) => {
    setActionLoading(`${medId}-${action}`);
    try {
      await api.post(`/medical/medications/${medId}/${action}`);
      setMedications((prev) =>
        prev.map((m) =>
          m.id === medId
            ? {
                ...m,
                status:
                  action === 'take'
                    ? 'taken'
                    : action === 'snooze'
                      ? 'snoozed'
                      : 'skipped',
              }
            : m
        )
      );
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
      setExpandedId(null);
    }
  };

  const statusDotColor = (status?: string) => {
    switch (status) {
      case 'taken': return 'bg-[var(--color-success)]';
      case 'snoozed': return 'bg-[var(--color-warning)]';
      case 'skipped': return 'bg-[var(--color-text-tertiary)]';
      default: return 'bg-[var(--color-warning)]'; // pending
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5 pb-28">
      {/* ── Header with adherence ring ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Лекарства
        </h1>

        {medications.length > 0 && (
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Background circle */}
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${adherence} ${100 - adherence}`}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[var(--color-text)]">
              {adherence}%
            </span>
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {medications.length === 0 ? (
        <Card className="!p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <Pill className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm">
              {t('common:no_data')}
            </p>
          </div>
        </Card>
      ) : (
        /* ── Time-of-day sections ── */
        <div className="space-y-6">
          {timeGroups.map((group) => (
            <section key={group.time} className="space-y-3">
              {/* Section header */}
              <div className="flex items-center gap-3">
                <Badge variant="info" className="!rounded-[var(--radius-sm)] !text-xs !font-semibold">
                  <Clock className="w-3 h-3" />
                  {group.time !== '--:--' ? group.time : ''}
                </Badge>
                <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              {/* Medication cards */}
              <div className="space-y-2">
                {group.medications.map((med) => {
                  const isTaken = med.status === 'taken';
                  const isSnoozed = med.status === 'snoozed';
                  const isSkipped = med.status === 'skipped';
                  const isActioned = isTaken || isSnoozed || isSkipped;
                  const isExpanded = expandedId === `${med.id}-${group.time}`;

                  return (
                    <div
                      key={`${med.id}-${group.time}`}
                      className="animate-fade-up"
                    >
                      <Card className="!p-4">
                        <div className="flex items-center gap-3">
                          {/* Status dot */}
                          <div className={`w-3 h-3 rounded-full shrink-0 ${statusDotColor(med.status)}`} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-[var(--color-text)] text-[15px] leading-tight ${isTaken ? 'line-through opacity-50' : ''}`}>
                              {med.name}
                              <span className="font-normal text-[var(--color-text-secondary)] ml-1.5">
                                {med.dosage}
                              </span>
                            </p>
                            {med.instructions && (
                              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                                {med.instructions}
                              </p>
                            )}
                          </div>

                          {/* Right action */}
                          {isTaken && (
                            <Badge variant="ok">
                              <Check className="w-3.5 h-3.5" />
                              Принято
                            </Badge>
                          )}

                          {isSnoozed && (
                            <Badge variant="warning">
                              <AlarmClock className="w-3.5 h-3.5" />
                              Отложено
                            </Badge>
                          )}

                          {isSkipped && (
                            <Badge variant="muted">
                              <X className="w-3.5 h-3.5" />
                              Пропущено
                            </Badge>
                          )}

                          {!isActioned && (
                            <button
                              type="button"
                              disabled={actionLoading === `${med.id}-take`}
                              onClick={() => handleAction(med.id, 'take')}
                              className={[
                                'w-11 h-11 rounded-full shrink-0',
                                'bg-[var(--color-success)] text-white',
                                'flex items-center justify-center',
                                'shadow-lg shadow-[var(--color-success)]/25',
                                'hover:shadow-xl hover:scale-105',
                                'active:scale-95',
                                'transition-all duration-200',
                                'cursor-pointer',
                                actionLoading === `${med.id}-take` ? 'opacity-50 pointer-events-none' : '',
                              ].join(' ')}
                              aria-label="Принял"
                            >
                              {actionLoading === `${med.id}-take` ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check className="w-5 h-5" strokeWidth={3} />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Secondary actions row (toggle on tap) */}
                        {!isActioned && (
                          <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                            {!isExpanded ? (
                              <button
                                type="button"
                                onClick={() => setExpandedId(`${med.id}-${group.time}`)}
                                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                              >
                                Другие действия...
                              </button>
                            ) : (
                              <div className="flex gap-2 animate-fade-up">
                                <button
                                  type="button"
                                  disabled={actionLoading === `${med.id}-snooze`}
                                  onClick={() => handleAction(med.id, 'snooze')}
                                  className={[
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                                    'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
                                    'hover:bg-[var(--color-warning)]/20 transition-colors cursor-pointer',
                                    actionLoading === `${med.id}-snooze` ? 'opacity-50 pointer-events-none' : '',
                                  ].join(' ')}
                                >
                                  <AlarmClock className="w-3.5 h-3.5" />
                                  Отложить
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading === `${med.id}-skip`}
                                  onClick={() => handleAction(med.id, 'skip')}
                                  className={[
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                                    'bg-[var(--color-text-tertiary)]/10 text-[var(--color-text-secondary)]',
                                    'hover:bg-[var(--color-text-tertiary)]/20 transition-colors cursor-pointer',
                                    actionLoading === `${med.id}-skip` ? 'opacity-50 pointer-events-none' : '',
                                  ].join(' ')}
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Пропустить
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(null)}
                                  className="ml-auto text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                                >
                                  Отмена
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Add medication link ── */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          className={[
            'flex items-center gap-2 px-5 py-3 rounded-full',
            'text-sm font-medium text-[var(--color-primary)]',
            'bg-[var(--color-primary)]/8 hover:bg-[var(--color-primary)]/15',
            'transition-all duration-200 cursor-pointer',
          ].join(' ')}
        >
          <Plus className="w-4 h-4" />
          Добавить лекарство
        </button>
      </div>
    </div>
  );
};

export default MedicationsPage;

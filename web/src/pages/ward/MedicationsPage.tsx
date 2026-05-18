import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Check, Clock, Pill } from 'lucide-react';
import { api } from '../../services/api';

interface TodayItem {
  medication: { id: string; name: string; dosage: string; instructions?: string };
  time: string;
  status: 'taken' | 'pending' | 'upcoming';
  logId?: string;
}

interface TimeGroup {
  time: string;
  label: string;
  items: TodayItem[];
}

function timeOfDayLabel(time: string): string {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'Утро';
  if (hour >= 12 && hour < 17) return 'День';
  if (hour >= 17 && hour < 21) return 'Вечер';
  return 'Ночь';
}

const MedicationsPage: React.FC = () => {
  const { t } = useTranslation(['ward', 'common']);
  const { lang } = useParams<{ lang: string }>();
  const isRu = (lang || 'ru') === 'ru';

  const [items, setItems] = useState<TodayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<TodayItem[]>('/medical/today');
        setItems(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const timeGroups = useMemo<TimeGroup[]>(() => {
    const map = new Map<string, TodayItem[]>();
    items.forEach((item) => {
      const existing = map.get(item.time) || [];
      existing.push(item);
      map.set(item.time, existing);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, groupItems]) => ({
        time,
        label: `${timeOfDayLabel(time)} · ${time}`,
        items: groupItems,
      }));
  }, [items]);

  const adherence = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((items.filter(i => i.status === 'taken').length / items.length) * 100);
  }, [items]);

  // Unique key per slot: medId + time
  const slotKey = (item: TodayItem) => `${item.medication.id}::${item.time}`;

  const handleTake = async (item: TodayItem) => {
    const key = slotKey(item);
    setActionLoading(key);
    // Optimistic update — only THIS time slot
    setItems(prev => prev.map(i => slotKey(i) === key ? { ...i, status: 'taken' as const } : i));
    await api.post(`/medical/medications/${item.medication.id}/take`).catch(() => {});
    setActionLoading(null);
  };

  const dotColor = (status: string) => {
    switch (status) {
      case 'taken': return 'bg-[var(--color-success)]';
      case 'pending': return 'bg-[var(--color-warning)]';
      default: return 'bg-[var(--color-text-quaternary)]';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-5 pt-4 pb-28 space-y-7">
      <div className="flex items-center gap-3">
        <h1 className="text-[34px] font-bold leading-tight">
          {isRu ? 'Лекарства' : 'Medications'}
        </h1>
        {items.length > 0 && (
          <span
            className="inline-flex items-center gap-1 px-3 h-7 rounded-full text-[13px] font-semibold"
            style={{ background: 'color-mix(in srgb, var(--color-success) 14%, transparent)', color: 'var(--color-success)' }}
          >
            {adherence}%
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-8 text-center">
          <Pill className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-3" />
          <p className="text-[15px] text-[var(--color-text-tertiary)]">{t('common:no_data')}</p>
        </div>
      ) : (
        <div className="space-y-7">
          {timeGroups.map((group) => (
            <section key={group.time} className="space-y-2">
              <h2 className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)] px-1">
                {group.label}
              </h2>
              <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
                {group.items.map((item, idx) => {
                  const key = slotKey(item);
                  const isTaken = item.status === 'taken';
                  const isPending = item.status === 'pending';

                  return (
                    <div key={key}>
                      {idx > 0 && <div className="border-t border-[var(--color-separator)] ml-[60px]" />}
                      <div className="flex items-center gap-3 min-h-[56px] px-4 py-3">
                        <div className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0">
                          <div className={`w-3 h-3 rounded-full ${dotColor(item.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[17px] font-medium leading-snug ${isTaken ? 'line-through opacity-50' : ''}`}>
                            {item.medication.name}
                          </p>
                          <p className="text-[13px] text-[var(--color-text-tertiary)] leading-snug mt-0.5">
                            {item.medication.dosage}
                            {item.medication.instructions ? ` · ${item.medication.instructions}` : ''}
                          </p>
                        </div>
                        {isTaken && (
                          <Check className="w-5 h-5 text-[var(--color-success)] shrink-0" />
                        )}
                        {isPending && (
                          <button
                            disabled={actionLoading === key}
                            onClick={() => handleTake(item)}
                            className="shrink-0 h-9 px-4 rounded-[var(--radius-sm)] bg-[var(--color-success)] text-white text-[15px] font-semibold active:opacity-60 transition-opacity cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === key
                              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : isRu ? 'Принять' : 'Take'}
                          </button>
                        )}
                        {item.status === 'upcoming' && (
                          <span className="shrink-0 flex items-center gap-1 text-[13px] text-[var(--color-text-quaternary)]">
                            <Clock className="w-3.5 h-3.5" />
                            {item.time}
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

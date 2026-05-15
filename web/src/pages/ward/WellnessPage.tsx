import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  Activity,
  Heart,
  Droplets,
  Weight,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WellnessEntry {
  id: string;
  createdAt: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  bloodSugar?: number;
  temperature?: number;
  weight?: number;
  notes?: string;
}

interface WellnessStats {
  avgSystolic?: number;
  avgDiastolic?: number;
  avgHeartRate?: number;
  avgBloodSugar?: number;
  avgTemperature?: number;
  avgWeight?: number;
  entries: WellnessEntry[];
}

/* ------------------------------------------------------------------ */
/*  Summary Card                                                       */
/* ------------------------------------------------------------------ */

interface SummaryCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  unit?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, iconBg, label, value, unit }) => (
  <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-4 flex flex-col gap-2">
    <div
      className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center"
      style={{ background: iconBg }}
    >
      {icon}
    </div>
    <span className="text-[13px] text-[var(--color-text-tertiary)]">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-[22px] font-bold text-[var(--color-text)] leading-none">{value}</span>
      {unit && (
        <span className="text-[13px] text-[var(--color-text-quaternary)]">{unit}</span>
      )}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  WellnessPage                                                       */
/* ------------------------------------------------------------------ */

const WellnessPage: React.FC = () => {
  const { i18n } = useTranslation(['ward', 'common']);
  const { lang } = useParams<{ lang: string }>();
  const isRu = i18n.language === 'ru';

  /* Data */
  const [days, setDays] = useState<7 | 30>(7);
  const [stats, setStats] = useState<WellnessStats | null>(null);
  const [history, setHistory] = useState<WellnessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /* Form */
  const [showForm, setShowForm] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* Fetch */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [st, hist] = await Promise.all([
        api.get<WellnessStats>(`/wellness/stats?days=${days}`),
        api.get<WellnessEntry[]>('/wellness?days=30'),
      ]);
      setStats(st);
      setHistory(hist);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: Record<string, unknown> = {};
    if (systolic) payload.systolic = Number(systolic);
    if (diastolic) payload.diastolic = Number(diastolic);
    if (heartRate) payload.heartRate = Number(heartRate);
    if (bloodSugar) payload.bloodSugar = Number(bloodSugar);
    if (temperature) payload.temperature = Number(temperature);
    if (weight) payload.weight = Number(weight);
    if (notes.trim()) payload.notes = notes.trim();

    if (Object.keys(payload).length === 0) {
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/wellness', payload);
      setSystolic('');
      setDiastolic('');
      setHeartRate('');
      setBloodSugar('');
      setTemperature('');
      setWeight('');
      setNotes('');
      setShowForm(false);
      fetchData();
    } catch {
      /* silently fail */
    } finally {
      setSubmitting(false);
    }
  };

  /* Latest + recent */
  const latest = history[0] || null;
  const recentEntries = history.slice(0, 7);

  return (
    <div className="px-5 pb-28 space-y-7">
      {/* ── Title + period toggle ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[34px] font-bold text-[var(--color-text)] leading-tight">
          {isRu ? 'Здоровье' : 'Health'}
        </h1>

        <div className="flex gap-1 bg-[var(--color-surface-secondary)] rounded-full p-1">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`h-8 px-4 rounded-full text-[15px] font-medium transition-all active:opacity-60 cursor-pointer ${
                days === d
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-tertiary)]'
              }`}
            >
              {d} {isRu ? 'дн' : 'd'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* ── Summary Cards (2-col grid) ── */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon={<Activity className="w-[18px] h-[18px] text-[var(--color-danger)]" />}
              iconBg="color-mix(in srgb, var(--color-danger) 14%, transparent)"
              label={isRu ? 'Давление' : 'BP'}
              value={
                latest?.systolic != null && latest?.diastolic != null
                  ? `${latest.systolic}/${latest.diastolic}`
                  : '--'
              }
              unit="mmHg"
            />
            <SummaryCard
              icon={<Heart className="w-[18px] h-[18px] text-[var(--color-primary)]" />}
              iconBg="color-mix(in srgb, var(--color-primary) 14%, transparent)"
              label={isRu ? 'Пульс' : 'Heart Rate'}
              value={latest?.heartRate != null ? String(latest.heartRate) : '--'}
              unit={isRu ? 'уд/мин' : 'bpm'}
            />
            <SummaryCard
              icon={<Droplets className="w-[18px] h-[18px] text-[var(--color-accent)]" />}
              iconBg="color-mix(in srgb, var(--color-accent) 14%, transparent)"
              label={isRu ? 'Сахар' : 'Sugar'}
              value={latest?.bloodSugar != null ? latest.bloodSugar.toFixed(1) : '--'}
              unit="mmol/L"
            />
            <SummaryCard
              icon={<Weight className="w-[18px] h-[18px] text-[var(--color-success)]" />}
              iconBg="color-mix(in srgb, var(--color-success) 14%, transparent)"
              label={isRu ? 'Вес' : 'Weight'}
              value={latest?.weight != null ? latest.weight.toFixed(1) : '--'}
              unit={isRu ? 'кг' : 'kg'}
            />
          </div>

          {/* ── Log button / inline form ── */}
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full h-[50px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[17px] font-semibold active:opacity-60 transition-opacity cursor-pointer"
            >
              {isRu ? 'Записать показатели' : 'Log Reading'}
            </button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5 space-y-4"
            >
              <h2 className="text-[17px] font-bold text-[var(--color-text)]">
                {isRu ? 'Новая запись' : 'New Entry'}
              </h2>

              {/* Blood Pressure */}
              <div className="space-y-1.5">
                <label className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)]">
                  {isRu ? 'Давление' : 'Blood Pressure'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="120"
                    className="flex-1 bg-[var(--color-surface-secondary)] h-11 rounded-[var(--radius-sm)] text-[17px] text-center text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] border-0 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[20px] text-[var(--color-text-tertiary)] font-light">/</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="80"
                    className="flex-1 bg-[var(--color-surface-secondary)] h-11 rounded-[var(--radius-sm)] text-[17px] text-center text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] border-0 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[13px] text-[var(--color-text-tertiary)] w-12 shrink-0">mmHg</span>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="space-y-1.5">
                <label className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)]">
                  {isRu ? 'Пульс' : 'Heart Rate'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="72"
                    className="flex-1 bg-[var(--color-surface-secondary)] h-11 rounded-[var(--radius-sm)] text-[17px] text-center text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] border-0 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[13px] text-[var(--color-text-tertiary)] w-12 shrink-0">bpm</span>
                </div>
              </div>

              {/* Blood Sugar */}
              <div className="space-y-1.5">
                <label className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)]">
                  {isRu ? 'Сахар' : 'Blood Sugar'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="5.5"
                    className="flex-1 bg-[var(--color-surface-secondary)] h-11 rounded-[var(--radius-sm)] text-[17px] text-center text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] border-0 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[13px] text-[var(--color-text-tertiary)] w-12 shrink-0">mmol/L</span>
                </div>
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <label className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)]">
                  {isRu ? 'Температура' : 'Temperature'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="36.6"
                    className="flex-1 bg-[var(--color-surface-secondary)] h-11 rounded-[var(--radius-sm)] text-[17px] text-center text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] border-0 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[13px] text-[var(--color-text-tertiary)] w-12 shrink-0">&deg;C</span>
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-1.5">
                <label className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)]">
                  {isRu ? 'Вес' : 'Weight'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    className="flex-1 bg-[var(--color-surface-secondary)] h-11 rounded-[var(--radius-sm)] text-[17px] text-center text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] border-0 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[13px] text-[var(--color-text-tertiary)] w-12 shrink-0">kg</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)]">
                  {isRu ? 'Заметки' : 'Notes'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={isRu ? 'Как вы себя чувствуете?' : 'How are you feeling?'}
                  className="w-full bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] text-[17px] text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] border-0 outline-none focus:ring-2 focus:ring-[var(--color-primary)] px-4 py-3 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-[50px] rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] text-[17px] font-semibold text-[var(--color-text)] active:opacity-60 transition-opacity cursor-pointer"
                >
                  {isRu ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-[50px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[17px] font-semibold active:opacity-60 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isRu ? (
                    'Сохранить'
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Recent Readings ── */}
          {recentEntries.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[14px] uppercase tracking-wide font-semibold text-[var(--color-text-tertiary)] px-1">
                {isRu ? 'Последние записи' : 'Recent Readings'}
              </h2>

              <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
                {recentEntries.map((entry, idx) => {
                  const date = new Date(entry.createdAt);
                  const dateStr = date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                  });
                  const timeStr = date.toLocaleTimeString(isRu ? 'ru-RU' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={entry.id}>
                      {idx > 0 && (
                        <div className="border-t border-[var(--color-separator)] ml-[60px]" />
                      )}

                      <div className="flex items-center gap-3 min-h-[56px] px-4 py-3">
                        {/* Date icon box */}
                        <div className="w-9 h-9 rounded-[var(--radius-xs)] bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0">
                          <FileText className="w-[18px] h-[18px] text-[var(--color-text-tertiary)]" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] text-[var(--color-text-tertiary)]">
                            {dateStr}, {timeStr}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {entry.systolic != null && entry.diastolic != null && (
                              <span className="text-[13px] font-semibold text-[var(--color-danger)]">
                                {entry.systolic}/{entry.diastolic}
                              </span>
                            )}
                            {entry.heartRate != null && (
                              <span className="text-[13px] font-semibold text-[var(--color-primary)]">
                                {entry.heartRate} bpm
                              </span>
                            )}
                            {entry.bloodSugar != null && (
                              <span className="text-[13px] font-semibold text-[var(--color-accent)]">
                                {entry.bloodSugar} mmol/L
                              </span>
                            )}
                            {entry.temperature != null && (
                              <span className="text-[13px] font-semibold text-[var(--color-warning)]">
                                {entry.temperature}&deg;C
                              </span>
                            )}
                            {entry.weight != null && (
                              <span className="text-[13px] font-semibold text-[var(--color-success)]">
                                {entry.weight} kg
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
              >
                <Heart className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <p className="text-[17px] font-medium text-[var(--color-text)]">
                {isRu ? 'Пока нет записей' : 'No readings yet'}
              </p>
              <p className="text-[15px] text-[var(--color-text-tertiary)] mt-1">
                {isRu
                  ? 'Нажмите кнопку выше, чтобы записать первые показатели'
                  : 'Tap the button above to log your first reading'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WellnessPage;

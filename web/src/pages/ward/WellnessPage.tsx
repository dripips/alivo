import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Weight,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

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
/*  Mini sparkline (pure SVG)                                          */
/* ------------------------------------------------------------------ */

const Sparkline: React.FC<{
  data: number[];
  color: string;
  width?: number;
  height?: number;
}> = ({ data, color, width = 100, height = 32 }) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2);
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last dot */}
      {data.length > 0 && (() => {
        const lastIdx = data.length - 1;
        const cx = pad + (lastIdx / (data.length - 1)) * (width - pad * 2);
        const cy = height - pad - ((data[lastIdx] - min) / range) * (height - pad * 2);
        return <circle cx={cx} cy={cy} r={3} fill={color} />;
      })()}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Summary Card                                                       */
/* ------------------------------------------------------------------ */

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  avg?: string;
  trend?: 'up' | 'down' | null;
  trendGood?: boolean;
  sparkData?: number[];
  sparkColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  label,
  value,
  unit,
  avg,
  trend,
  trendGood,
  sparkData,
  sparkColor = 'var(--color-primary)',
}) => (
  <div className="glass rounded-[var(--radius-md)] p-4 border border-[var(--color-border)] flex flex-col gap-2 min-w-[160px]">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
        {label}
      </span>
    </div>

    <div className="flex items-end gap-1.5">
      <span className="text-2xl font-bold text-[var(--color-text)] leading-none">
        {value}
      </span>
      {unit && (
        <span className="text-xs text-[var(--color-text-tertiary)] mb-0.5">
          {unit}
        </span>
      )}
      {trend && (
        <span className="ml-auto">
          {trend === 'up' ? (
            <TrendingUp
              className="w-4 h-4"
              style={{ color: trendGood ? 'var(--color-success)' : 'var(--color-danger)' }}
            />
          ) : (
            <TrendingDown
              className="w-4 h-4"
              style={{ color: trendGood ? 'var(--color-success)' : 'var(--color-danger)' }}
            />
          )}
        </span>
      )}
    </div>

    {sparkData && sparkData.length >= 2 && (
      <Sparkline data={sparkData} color={sparkColor} />
    )}

    {avg && (
      <p className="text-xs text-[var(--color-text-tertiary)]">{avg}</p>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getTrend(entries: WellnessEntry[], key: keyof WellnessEntry): 'up' | 'down' | null {
  const vals = entries
    .map((e) => e[key])
    .filter((v): v is number => v != null);
  if (vals.length < 2) return null;
  return vals[0] > vals[1] ? 'up' : vals[0] < vals[1] ? 'down' : null;
}

function extractSpark(entries: WellnessEntry[], key: keyof WellnessEntry): number[] {
  return entries
    .map((e) => e[key])
    .filter((v): v is number => v != null)
    .reverse();
}

/* ------------------------------------------------------------------ */
/*  WellnessPage Component                                             */
/* ------------------------------------------------------------------ */

const WellnessPage: React.FC = () => {
  const { t } = useTranslation(['ward', 'common']);
  const { lang } = useParams<{ lang: string }>();
  const isRu = (lang || 'ru') === 'ru';

  /* Data state */
  const [days, setDays] = useState<7 | 30>(7);
  const [stats, setStats] = useState<WellnessStats | null>(null);
  const [history, setHistory] = useState<WellnessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /* Panel state */
  const [panelOpen, setPanelOpen] = useState(false);

  /* Form state */
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    setSubmitSuccess(false);

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
      setSubmitSuccess(true);
      setSystolic('');
      setDiastolic('');
      setHeartRate('');
      setBloodSugar('');
      setTemperature('');
      setWeight('');
      setNotes('');
      fetchData();
      setTimeout(() => {
        setSubmitSuccess(false);
        setPanelOpen(false);
      }, 1200);
    } catch {
      /* silently fail */
    } finally {
      setSubmitting(false);
    }
  };

  /* Recent entries (last 7) */
  const recentEntries = history.slice(0, 7);

  /* Latest value helper */
  const latest = history[0] || null;

  /* Input component for form */
  const FormInput: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    unit: string;
  }> = ({ value, onChange, placeholder, unit }) => (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)]
                   rounded-[var(--radius-sm)] text-[var(--color-text)] text-lg font-semibold
                   placeholder:text-[var(--color-text-tertiary)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                   transition-all duration-200 px-4 py-3 text-center"
      />
      <span className="text-sm text-[var(--color-text-tertiary)] w-14 shrink-0">{unit}</span>
    </div>
  );

  return (
    <div className="pb-24 px-5 pt-6 space-y-6" id="main-content">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">
          {isRu ? 'Здоровье' : 'Health'}
        </h1>

        {/* Period toggle */}
        <div className="flex bg-[var(--color-surface)] rounded-full p-1 border border-[var(--color-border)]">
          <button
            onClick={() => setDays(7)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              days === 7
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            7 {isRu ? 'дн' : 'd'}
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              days === 30
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            30 {isRu ? 'дн' : 'd'}
          </button>
        </div>
      </div>

      {/* ---- Loading ---- */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* ---- Summary Cards (horizontal scroll) ---- */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory scrollbar-none">
            {/* Blood Pressure */}
            <SummaryCard
              icon={<Activity className="w-4 h-4 text-[var(--color-danger)]" />}
              label={isRu ? 'Давление' : 'BP'}
              value={
                latest?.systolic != null && latest?.diastolic != null
                  ? `${latest.systolic}/${latest.diastolic}`
                  : '--'
              }
              unit="mmHg"
              avg={
                stats?.avgSystolic != null && stats?.avgDiastolic != null
                  ? `${isRu ? 'ср.' : 'avg'} ${days}${isRu ? 'д' : 'd'}: ${Math.round(stats.avgSystolic)}/${Math.round(stats.avgDiastolic)}`
                  : undefined
              }
              trend={getTrend(history, 'systolic')}
              trendGood={false}
              sparkData={extractSpark(history, 'systolic')}
              sparkColor="var(--color-danger)"
            />

            {/* Heart Rate */}
            <SummaryCard
              icon={<Heart className="w-4 h-4 text-[var(--color-primary)]" />}
              label={isRu ? 'Пульс' : 'Heart Rate'}
              value={latest?.heartRate != null ? String(latest.heartRate) : '--'}
              unit="bpm"
              avg={
                stats?.avgHeartRate != null
                  ? `${isRu ? 'ср.' : 'avg'} ${days}${isRu ? 'д' : 'd'}: ${Math.round(stats.avgHeartRate)}`
                  : undefined
              }
              trend={getTrend(history, 'heartRate')}
              trendGood={false}
              sparkData={extractSpark(history, 'heartRate')}
              sparkColor="var(--color-primary)"
            />

            {/* Blood Sugar */}
            <SummaryCard
              icon={<Droplets className="w-4 h-4 text-[var(--color-accent)]" />}
              label={isRu ? 'Сахар' : 'Sugar'}
              value={latest?.bloodSugar != null ? latest.bloodSugar.toFixed(1) : '--'}
              unit="mmol/L"
              avg={
                stats?.avgBloodSugar != null
                  ? `${isRu ? 'ср.' : 'avg'} ${days}${isRu ? 'д' : 'd'}: ${stats.avgBloodSugar.toFixed(1)}`
                  : undefined
              }
              trend={getTrend(history, 'bloodSugar')}
              trendGood={false}
              sparkData={extractSpark(history, 'bloodSugar')}
              sparkColor="var(--color-accent)"
            />

            {/* Temperature */}
            <SummaryCard
              icon={<Thermometer className="w-4 h-4 text-[var(--color-warning)]" />}
              label={isRu ? 'Температура' : 'Temp'}
              value={latest?.temperature != null ? latest.temperature.toFixed(1) : '--'}
              unit={isRu ? 'C' : 'C'}
              avg={
                stats?.avgTemperature != null
                  ? `${isRu ? 'ср.' : 'avg'} ${days}${isRu ? 'д' : 'd'}: ${stats.avgTemperature.toFixed(1)}`
                  : undefined
              }
              trend={getTrend(history, 'temperature')}
              trendGood={false}
              sparkData={extractSpark(history, 'temperature')}
              sparkColor="var(--color-warning)"
            />

            {/* Weight */}
            <SummaryCard
              icon={<Weight className="w-4 h-4 text-[var(--color-success)]" />}
              label={isRu ? 'Вес' : 'Weight'}
              value={latest?.weight != null ? latest.weight.toFixed(1) : '--'}
              unit="kg"
              avg={
                stats?.avgWeight != null
                  ? `${isRu ? 'ср.' : 'avg'} ${days}${isRu ? 'д' : 'd'}: ${stats.avgWeight.toFixed(1)}`
                  : undefined
              }
              trend={getTrend(history, 'weight')}
              trendGood={false}
              sparkData={extractSpark(history, 'weight')}
              sparkColor="var(--color-success)"
            />
          </div>

          {/* ---- Log New Reading (collapsible) ---- */}
          {!panelOpen ? (
            <button
              onClick={() => setPanelOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-4
                         rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)]
                         text-[var(--color-primary)] font-semibold text-sm
                         hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5
                         transition-all active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              {isRu ? 'Записать показатели' : 'Log Reading'}
            </button>
          ) : (
            <Card className="animate-in slide-in-from-bottom-4 duration-300">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-lg text-[var(--color-text)]">
                    {isRu ? 'Новая запись' : 'New Entry'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full
                               hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-tertiary)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Blood Pressure */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1.5 block">
                    {isRu ? 'Давление' : 'Blood Pressure'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="120"
                      className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)]
                                 rounded-[var(--radius-sm)] text-[var(--color-text)] text-xl font-bold
                                 placeholder:text-[var(--color-text-tertiary)]
                                 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                                 transition-all duration-200 px-4 py-3 text-center"
                    />
                    <span className="text-2xl font-light text-[var(--color-text-tertiary)]">/</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="80"
                      className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)]
                                 rounded-[var(--radius-sm)] text-[var(--color-text)] text-xl font-bold
                                 placeholder:text-[var(--color-text-tertiary)]
                                 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                                 transition-all duration-200 px-4 py-3 text-center"
                    />
                    <span className="text-sm text-[var(--color-text-tertiary)] w-14 shrink-0">mmHg</span>
                  </div>
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1.5 block">
                    {isRu ? 'Пульс' : 'Heart Rate'}
                  </label>
                  <FormInput value={heartRate} onChange={setHeartRate} placeholder="72" unit="bpm" />
                </div>

                {/* Blood Sugar */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1.5 block">
                    {isRu ? 'Сахар' : 'Blood Sugar'}
                  </label>
                  <FormInput value={bloodSugar} onChange={setBloodSugar} placeholder="5.5" unit="mmol/L" />
                </div>

                {/* Temperature */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1.5 block">
                    {isRu ? 'Температура' : 'Temperature'}
                  </label>
                  <FormInput value={temperature} onChange={setTemperature} placeholder="36.6" unit={isRu ? 'C' : 'C'} />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1.5 block">
                    {isRu ? 'Вес' : 'Weight'}
                  </label>
                  <FormInput value={weight} onChange={setWeight} placeholder="70" unit="kg" />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1.5 block">
                    {isRu ? 'Заметки' : 'Notes'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder={isRu ? 'Как вы себя чувствуете?' : 'How are you feeling?'}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)]
                               rounded-[var(--radius-sm)] text-[var(--color-text)] text-base
                               placeholder:text-[var(--color-text-tertiary)]
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                               transition-all duration-200 px-4 py-3 resize-none"
                  />
                </div>

                {submitSuccess && (
                  <div className="flex items-center gap-2 text-[var(--color-success)] text-sm font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {isRu ? 'Сохранено!' : 'Saved!'}
                  </div>
                )}

                <Button type="submit" loading={submitting} className="w-full">
                  {isRu ? 'Сохранить' : 'Save'}
                </Button>
              </form>
            </Card>
          )}

          {/* ---- Recent Readings (timeline) ---- */}
          {recentEntries.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)] mb-3">
                {isRu ? 'Последние записи' : 'Recent Readings'}
              </h2>

              <div className="space-y-2">
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
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 group"
                    >
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                        {idx < recentEntries.length - 1 && (
                          <div className="w-px flex-1 bg-[var(--color-border)] mt-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 glass rounded-[var(--radius-sm)] p-3 border border-[var(--color-border)]
                                    mb-2 group-hover:border-[var(--color-primary)]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                            {dateStr}, {timeStr}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {entry.systolic != null && entry.diastolic != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-danger)]/10 text-xs font-semibold text-[var(--color-danger)]">
                              <Activity className="w-3 h-3" />
                              {entry.systolic}/{entry.diastolic}
                            </span>
                          )}
                          {entry.heartRate != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">
                              <Heart className="w-3 h-3" />
                              {entry.heartRate} bpm
                            </span>
                          )}
                          {entry.bloodSugar != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-accent)]/10 text-xs font-semibold text-[var(--color-accent)]">
                              <Droplets className="w-3 h-3" />
                              {entry.bloodSugar} mmol/L
                            </span>
                          )}
                          {entry.temperature != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-warning)]/10 text-xs font-semibold text-[var(--color-warning)]">
                              <Thermometer className="w-3 h-3" />
                              {entry.temperature} C
                            </span>
                          )}
                          {entry.weight != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-success)]/10 text-xs font-semibold text-[var(--color-success)]">
                              <Weight className="w-3 h-3" />
                              {entry.weight} kg
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="mt-2 text-xs text-[var(--color-text-secondary)] flex items-start gap-1">
                            <FileText className="w-3 h-3 mt-0.5 shrink-0 text-[var(--color-text-tertiary)]" />
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <p className="text-[var(--color-text-secondary)] font-medium">
                {isRu ? 'Пока нет записей' : 'No readings yet'}
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                {isRu
                  ? 'Нажмите "+", чтобы записать первые показатели'
                  : 'Tap "+" to log your first reading'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WellnessPage;

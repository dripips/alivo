import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
  Heart, MapPin, CalendarDays, Clock, Pill,
  Activity, Droplets, Weight, ChevronRight, Smile,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import Card from '../../components/ui/Card';

interface ScheduleEntry { time: string; days: string[]; }
interface Medication { id: string; name: string; dosage: string; instructions?: string; schedule: ScheduleEntry[]; }
interface Appointment { id: string; title: string; scheduledAt: string; location?: string; doctorName?: string; }
interface Vitals { bloodPressureH?: number; bloodPressureL?: number; heartRate?: number; bloodSugar?: number; weight?: number; }

function timeUntil(timeStr: string, isRu: boolean): string {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diff = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diff < 60) return isRu ? `через ${diff} мин` : `in ${diff}m`;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return isRu ? `через ${hrs} ч ${mins > 0 ? mins + ' мин' : ''}` : `in ${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
}

const HomePage: React.FC = () => {
  const { i18n } = useTranslation(['ward', 'common']);
  const { lang } = useParams<{ lang: string }>();
  const l = lang || 'ru';
  const user = useAuthStore((s) => s.user);
  const isRu = i18n.language === 'ru';

  const [meds, setMeds] = useState<Medication[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [nextTime, setNextTime] = useState<string | null>(null);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [userName, setUserName] = useState(user?.name || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [medsR, apptsR, profileR, vitalsR] = await Promise.all([
          api.get<Medication[]>('/medical/medications'),
          api.get<Appointment[]>('/appointments/upcoming'),
          api.get<any>('/users/me'),
          api.get<Vitals | null>('/wellness/latest').catch(() => null),
        ]);
        setMeds(medsR);
        setAppts(apptsR);
        setVitals(vitalsR);
        if (profileR.name) setUserName(profileR.name);

        if (profileR.checkInSchedule?.times?.length) {
          const mins = new Date().getHours() * 60 + new Date().getMinutes();
          const times = [...profileR.checkInSchedule.times].sort();
          setNextTime(times.find((t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m > mins; }) || times[0]);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? (isRu ? 'Доброй ночи' : 'Good night')
    : hour < 12 ? (isRu ? 'Доброе утро' : 'Good morning')
    : hour < 18 ? (isRu ? 'Добрый день' : 'Good afternoon')
    : (isRu ? 'Добрый вечер' : 'Good evening');

  const firstName = userName.split(' ')[0] || '';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const nextAppt = appts[0] || null;

  return (
    <div className="space-y-5 px-5 pt-6 pb-6" id="main-content">

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {greeting}{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5 first-letter:uppercase">
          {new Date().toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── How are you feeling? (replaces "check-in") ── */}
      {nextTime && (
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <Smile className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[var(--color-text)]">
                {isRu ? 'Как вы себя чувствуете?' : 'How are you feeling?'}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                {isRu ? `Следующий вопрос в ${nextTime}` : `Next check at ${nextTime}`}
                <span className="text-[var(--color-text-tertiary)]"> · {timeUntil(nextTime, isRu)}</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Medications today ── */}
      {meds.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--color-text)]">
              {isRu ? 'Лекарства на сегодня' : 'Today\'s medications'}
            </h2>
            <Link to={`/${l}/ward/medications`} className="text-sm text-[var(--color-primary)] font-medium flex items-center">
              {isRu ? 'Все' : 'All'}<ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {meds.slice(0, 3).map((med) => (
              <Link key={med.id} to={`/${l}/ward/medications`}>
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-[var(--color-success)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)] text-sm">{med.name}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {med.dosage} · {med.schedule.map(s => s.time).join(', ')}
                      {med.instructions ? ` · ${med.instructions}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Vitals snapshot ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[var(--color-text)]">
            {isRu ? 'Показатели здоровья' : 'Health vitals'}
          </h2>
          <Link to={`/${l}/ward/wellness`} className="text-sm text-[var(--color-primary)] font-medium flex items-center">
            {isRu ? 'Подробнее' : 'Details'}<ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Activity, color: 'var(--color-danger)', label: isRu ? 'Давление' : 'BP', value: vitals?.bloodPressureH ? `${vitals.bloodPressureH}/${vitals.bloodPressureL}` : '—', unit: '' },
            { icon: Heart, color: 'var(--color-primary)', label: isRu ? 'Пульс' : 'Heart rate', value: vitals?.heartRate ? `${vitals.heartRate}` : '—', unit: isRu ? 'уд/мин' : 'bpm' },
            { icon: Droplets, color: 'var(--color-accent)', label: isRu ? 'Сахар' : 'Sugar', value: vitals?.bloodSugar ? `${vitals.bloodSugar}` : '—', unit: isRu ? 'ммоль/л' : 'mmol/L' },
            { icon: Weight, color: 'var(--color-success)', label: isRu ? 'Вес' : 'Weight', value: vitals?.weight ? `${vitals.weight}` : '—', unit: isRu ? 'кг' : 'kg' },
          ].map(({ icon: Icon, color, label, value, unit }) => (
            <Link key={label} to={`/${l}/ward/wellness`} className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs text-[var(--color-text-tertiary)] font-medium">{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[var(--color-text)]">{value}</span>
                {unit && <span className="text-xs text-[var(--color-text-tertiary)]">{unit}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/${l}/ward/walk`} className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-success)]/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[var(--color-success)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text)] text-sm">{isRu ? 'Прогулка' : 'Walk'}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{isRu ? 'Безопасный выход' : 'Safe walk'}</p>
          </div>
        </Link>
        <Link to={`/${l}/ward/appointments`} className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text)] text-sm">{isRu ? 'Визиты к врачу' : 'Appointments'}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {nextAppt ? (isRu ? `Ближайший: ${new Date(nextAppt.scheduledAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}` : `Next: ${new Date(nextAppt.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`) : (isRu ? 'Нет записей' : 'None scheduled')}
            </p>
          </div>
        </Link>
      </div>

      {/* ── Upcoming appointment detail ── */}
      {nextAppt && (
        <Link to={`/${l}/ward/appointments`}>
          <Card className="hover:border-[var(--color-accent)]/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <CalendarDays className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-text)] truncate">{nextAppt.title}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {new Date(nextAppt.scheduledAt).toLocaleString(isRu ? 'ru-RU' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                {nextAppt.doctorName && <p className="text-xs text-[var(--color-text-tertiary)]">{nextAppt.doctorName}</p>}
                {nextAppt.location && <p className="text-xs text-[var(--color-text-tertiary)]">{nextAppt.location}</p>}
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--color-text-tertiary)] shrink-0" />
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
};

export default HomePage;

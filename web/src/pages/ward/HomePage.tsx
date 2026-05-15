import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
  Smile, Pill, Activity, Heart, Droplets, Weight,
  MapPin, CalendarDays, ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

interface ScheduleEntry { time: string; days: string[]; }
interface Medication { id: string; name: string; dosage: string; schedule: ScheduleEntry[]; instructions?: string; }
interface Appointment { id: string; title: string; scheduledAt: string; location?: string; doctorName?: string; }
interface Vitals { bloodPressureH?: number; bloodPressureL?: number; heartRate?: number; bloodSugar?: number; weight?: number; }

function timeUntil(timeStr: string, isRu: boolean): string {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(); target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diff = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diff < 60) return isRu ? `через ${diff} мин` : `in ${diff}m`;
  const hrs = Math.floor(diff / 60), mins = diff % 60;
  return isRu ? `через ${hrs} ч${mins > 0 ? ` ${mins} мин` : ''}` : `in ${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
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
        setMeds(medsR); setAppts(apptsR); setVitals(vitalsR);
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
  const nextAppt = appts[0] || null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-5 pt-3 pb-5 space-y-7">
      {/* Greeting */}
      <div className="pt-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">{greeting}{firstName ? `, ${firstName}` : ''}!</h1>
        <p className="text-[15px] text-[var(--color-text-tertiary)] mt-1 first-letter:uppercase">
          {new Date().toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Check-in card */}
      {nextTime && (
        <Link to={`/${l}/ward/chat`} className="block">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-4 flex items-center gap-4 active:opacity-70 transition-opacity duration-150">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <Smile className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-semibold">{isRu ? 'Как вы себя чувствуете?' : 'How are you feeling?'}</p>
              <p className="text-[14px] text-[var(--color-text-tertiary)] mt-0.5">
                {isRu ? `Следующий вопрос в ${nextTime}` : `Next check at ${nextTime}`}
                {' · '}{timeUntil(nextTime, isRu)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--color-text-quaternary)] shrink-0" />
          </div>
        </Link>
      )}

      {/* Medications */}
      {meds.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
              {isRu ? 'Лекарства' : 'Medications'}
            </h2>
            <Link to={`/${l}/ward/medications`} className="text-[15px] text-[var(--color-primary)] font-medium">
              {isRu ? 'Все' : 'All'}
            </Link>
          </div>
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
            {meds.slice(0, 3).map((med, i) => (
              <Link key={med.id} to={`/${l}/ward/medications`}>
                <div className={`flex items-center gap-3.5 px-4 py-3.5 min-h-[56px] active:opacity-60 transition-opacity ${i > 0 ? 'border-t border-[var(--color-separator)]' : ''}`}>
                  <div className="w-9 h-9 rounded-[var(--radius-xs)] bg-[var(--color-success)]/10 flex items-center justify-center shrink-0">
                    <Pill className="w-[18px] h-[18px] text-[var(--color-success)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-medium">{med.name}</p>
                    <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
                      {med.dosage} · {med.schedule.map(s => s.time).join(', ')}
                      {med.instructions ? ` · ${med.instructions}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-text-quaternary)] shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Vitals */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
            {isRu ? 'Показатели' : 'Vitals'}
          </h2>
          <Link to={`/${l}/ward/wellness`} className="text-[15px] text-[var(--color-primary)] font-medium">
            {isRu ? 'Подробнее' : 'Details'}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Activity, color: 'var(--color-danger)', label: isRu ? 'Давление' : 'BP', value: vitals?.bloodPressureH ? `${vitals.bloodPressureH}/${vitals.bloodPressureL}` : '—' },
            { icon: Heart, color: 'var(--color-primary)', label: isRu ? 'Пульс' : 'Heart rate', value: vitals?.heartRate ? `${vitals.heartRate}` : '—', unit: isRu ? 'уд/мин' : 'bpm' },
            { icon: Droplets, color: 'var(--color-accent)', label: isRu ? 'Сахар' : 'Sugar', value: vitals?.bloodSugar ? `${vitals.bloodSugar}` : '—', unit: isRu ? 'ммоль/л' : 'mmol/L' },
            { icon: Weight, color: 'var(--color-success)', label: isRu ? 'Вес' : 'Weight', value: vitals?.weight ? `${vitals.weight}` : '—', unit: isRu ? 'кг' : 'kg' },
          ].map(({ icon: Icon, color, label, value, unit }) => (
            <Link key={label} to={`/${l}/ward/wellness`} className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-4 active:opacity-60 transition-opacity duration-150">
              <div className="flex items-center gap-2 mb-2.5">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-[13px] text-[var(--color-text-tertiary)] font-medium">{label}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-bold tracking-tight leading-none">{value}</span>
                {unit && <span className="text-[13px] text-[var(--color-text-tertiary)]">{unit}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
          <Link to={`/${l}/ward/walk`} className="flex items-center gap-3.5 px-4 py-3.5 min-h-[56px] active:opacity-60 transition-opacity">
            <div className="w-9 h-9 rounded-[var(--radius-xs)] bg-[var(--color-success)]/10 flex items-center justify-center">
              <MapPin className="w-[18px] h-[18px] text-[var(--color-success)]" />
            </div>
            <div className="flex-1">
              <p className="text-[17px] font-medium">{isRu ? 'Прогулка' : 'Walk'}</p>
              <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">{isRu ? 'Безопасный выход из дома' : 'Safe walk tracking'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--color-text-quaternary)]" />
          </Link>

          <div className="border-t border-[var(--color-separator)] ml-[60px]" />

          <Link to={`/${l}/ward/appointments`} className="flex items-center gap-3.5 px-4 py-3.5 min-h-[56px] active:opacity-60 transition-opacity">
            <div className="w-9 h-9 rounded-[var(--radius-xs)] bg-[var(--color-accent)]/10 flex items-center justify-center">
              <CalendarDays className="w-[18px] h-[18px] text-[var(--color-accent)]" />
            </div>
            <div className="flex-1">
              <p className="text-[17px] font-medium">{isRu ? 'Визиты к врачу' : 'Appointments'}</p>
              <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
                {nextAppt
                  ? `${nextAppt.title} · ${new Date(nextAppt.scheduledAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}`
                  : (isRu ? 'Нет записей' : 'None scheduled')}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--color-text-quaternary)]" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { MapPin, Home, Footprints } from 'lucide-react';
import { api } from '../../services/api';

interface Walk {
  id: string;
  startedAt: string;
  expectedBack: string;
  endedAt?: string;
}

const WalkPage: React.FC = () => {
  const { i18n } = useTranslation(['ward']);
  const { lang } = useParams<{ lang: string }>();
  const isRu = (lang || 'ru') === 'ru';

  const [walk, setWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [duration, setDuration] = useState(30);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const w = await api.get<Walk | null>('/walks/active');
        if (w && !w.endedAt) setWalk(w);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const updateElapsed = useCallback(() => {
    if (!walk) return;
    setElapsed(Math.floor((Date.now() - new Date(walk.startedAt).getTime()) / 1000));
  }, [walk]);

  useEffect(() => {
    if (walk) { updateElapsed(); timerRef.current = setInterval(updateElapsed, 1000); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [walk, updateElapsed]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleStart = async () => {
    setStarting(true);
    try {
      let lat: number | undefined, lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })).catch(() => null);
        if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude; }
      } catch {}
      const w = await api.post<Walk>('/walks/start', { expectedMinutes: duration, latitude: lat, longitude: lng });
      setWalk(w);
    } catch {}
    setStarting(false);
  };

  const handleEnd = async () => {
    if (!walk) return;
    setEnding(true);
    try { await api.patch(`/walks/${walk.id}/end`); setWalk(null); setElapsed(0); } catch {}
    setEnding(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (walk) {
    const totalSec = Math.max(1, Math.floor((new Date(walk.expectedBack).getTime() - new Date(walk.startedAt).getTime()) / 1000));
    const remaining = Math.max(0, totalSec - elapsed);
    const overdue = elapsed > totalSec;
    const progress = Math.min(100, (elapsed / totalSec) * 100);

    return (
      <div className="px-5 pt-4 pb-8 flex flex-col items-center min-h-[calc(100vh-130px)] justify-center gap-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: overdue ? 'color-mix(in srgb, var(--color-danger) 12%, transparent)' : 'color-mix(in srgb, var(--color-success) 12%, transparent)' }}>
          <Footprints className={`w-8 h-8 ${overdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`} />
        </div>

        <h1 className="text-[22px] font-bold">{isRu ? 'Прогулка' : 'Walk'}</h1>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-6 w-full max-w-sm text-center space-y-5">
          <div>
            <p className="text-[13px] text-[var(--color-text-tertiary)] mb-1">{isRu ? 'Прошло' : 'Elapsed'}</p>
            <p className="text-[40px] font-bold tracking-tight font-mono">{fmt(elapsed)}</p>
          </div>

          <div className="border-t border-[var(--color-separator)]" />

          <div>
            <p className="text-[13px] text-[var(--color-text-tertiary)] mb-1">
              {overdue ? (isRu ? 'Задержка' : 'Overdue') : (isRu ? 'Осталось' : 'Remaining')}
            </p>
            <p className={`text-[34px] font-bold tracking-tight font-mono ${overdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
              {overdue ? `+${fmt(elapsed - totalSec)}` : fmt(remaining)}
            </p>
          </div>

          <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${overdue ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-success)]'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button
          onClick={handleEnd} disabled={ending}
          className="w-full max-w-sm h-[50px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-70 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          {ending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Home className="w-5 h-5" /> {isRu ? 'Я дома' : "I'm home"}</>}
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-8 flex flex-col items-center min-h-[calc(100vh-130px)] justify-center gap-8">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)' }}>
        <MapPin className="w-8 h-8 text-[var(--color-success)]" />
      </div>

      <h1 className="text-[22px] font-bold">{isRu ? 'Прогулка' : 'Walk'}</h1>
      <p className="text-[15px] text-[var(--color-text-tertiary)] text-center max-w-[260px]">
        {isRu ? 'Мы оповестим родных, если вы не вернётесь вовремя' : "We'll alert your family if you don't return on time"}
      </p>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5 w-full max-w-sm space-y-4">
        <p className="text-[15px] font-medium">{isRu ? 'Планирую на' : 'Planning for'}</p>
        <div className="flex items-center gap-4">
          <input type="range" min={15} max={120} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="flex-1 accent-[var(--color-primary)]" />
          <span className="text-[20px] font-bold min-w-[70px] text-right">{duration} {isRu ? 'мин' : 'min'}</span>
        </div>
      </div>

      <button
        onClick={handleStart} disabled={starting}
        className="w-full max-w-sm h-[50px] rounded-[var(--radius-md)] bg-[var(--color-success)] text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-70 transition-opacity disabled:opacity-40 cursor-pointer"
      >
        {starting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Footprints className="w-5 h-5" /> {isRu ? 'Я выхожу' : "I'm going out"}</>}
      </button>
    </div>
  );
};

export default WalkPage;

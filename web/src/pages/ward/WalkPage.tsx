import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface Walk {
  id: string;
  startedAt: string;
  expectedMinutes: number;
  latitude?: number;
  longitude?: number;
  endedAt?: string;
}

const WalkPage: React.FC = () => {
  const { t } = useTranslation(['ward', 'common']);

  const [activeWalk, setActiveWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [duration, setDuration] = useState(30);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch active walk on mount
  useEffect(() => {
    const fetchActive = async () => {
      try {
        const walk = await api.get<Walk | null>('/walks/active');
        if (walk && !walk.endedAt) {
          setActiveWalk(walk);
        }
      } catch {
        // no active walk
      } finally {
        setLoading(false);
      }
    };

    fetchActive();
  }, []);

  // Timer for active walk
  const updateElapsed = useCallback(() => {
    if (!activeWalk) return;
    const startMs = new Date(activeWalk.startedAt).getTime();
    const nowMs = Date.now();
    setElapsed(Math.floor((nowMs - startMs) / 1000));
  }, [activeWalk]);

  useEffect(() => {
    if (activeWalk) {
      updateElapsed();
      timerRef.current = setInterval(updateElapsed, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWalk, updateElapsed]);

  const handleStart = async () => {
    setStarting(true);

    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
          })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // start walk without location
      }

      const walk = await api.post<Walk>('/walks/start', {
        expectedMinutes: duration,
        latitude,
        longitude,
      });
      setActiveWalk(walk);
    } catch {
      // silently fail
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = async () => {
    if (!activeWalk) return;
    setEnding(true);

    try {
      await api.patch(`/walks/${activeWalk.id}/end`);
      setActiveWalk(null);
      setElapsed(0);
    } catch {
      // silently fail
    } finally {
      setEnding(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--color-text)]/60">{t('common:loading')}</p>
      </div>
    );
  }

  // Active walk state
  if (activeWalk) {
    const expectedSeconds = activeWalk.expectedMinutes * 60;
    const remaining = Math.max(0, expectedSeconds - elapsed);
    const overdue = elapsed > expectedSeconds;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {t('ward:walk')}
        </h1>

        {/* Timer display */}
        <Card className="w-full max-w-sm text-center">
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text)]/60">
              Elapsed
            </p>
            <p className="text-4xl font-mono font-bold text-[var(--color-text)]">
              {formatTime(elapsed)}
            </p>

            <div className="h-px bg-[var(--color-border)]" />

            <p className="text-sm text-[var(--color-text)]/60">
              {overdue ? 'Overdue by' : 'Time remaining'}
            </p>
            <p
              className={[
                'text-3xl font-mono font-bold',
                overdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]',
              ].join(' ')}
            >
              {overdue
                ? `+${formatTime(elapsed - expectedSeconds)}`
                : formatTime(remaining)}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-[var(--color-border)] rounded-full h-2 overflow-hidden">
              <div
                className={[
                  'h-full rounded-full transition-all duration-1000',
                  overdue
                    ? 'bg-[var(--color-danger)]'
                    : 'bg-[var(--color-success)]',
                ].join(' ')}
                style={{
                  width: `${Math.min(100, (elapsed / expectedSeconds) * 100)}%`,
                }}
              />
            </div>
          </div>
        </Card>

        <Button
          size="lg"
          variant="primary"
          loading={ending}
          onClick={handleEnd}
          className="w-full max-w-sm"
        >
          {t('ward:end_walk')}
        </Button>
      </div>
    );
  }

  // No active walk state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('ward:walk')}
      </h1>

      <Card className="w-full max-w-sm">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="font-medium text-[var(--color-text)]">
              {t('ward:walk_duration')}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 accent-[var(--color-primary)]"
              />
              <span className="text-xl font-bold text-[var(--color-text)] min-w-[60px] text-right">
                {duration} {t('ward:walk_minutes')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[var(--color-text)]/40">
              <span>15</span>
              <span>120</span>
            </div>
          </div>
        </div>
      </Card>

      <Button
        size="lg"
        loading={starting}
        onClick={handleStart}
        className="w-full max-w-sm"
      >
        {t('ward:start_walk')}
      </Button>
    </div>
  );
};

export default WalkPage;

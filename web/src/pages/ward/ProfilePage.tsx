import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface EmergencyCard {
  id: string;
  link: string;
  qrCodeUrl?: string;
}

interface CheckInSchedule {
  times: string[];
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation(['ward', 'common']);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [emergencyCard, setEmergencyCard] = useState<EmergencyCard | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Check-in schedule
  const [schedule, setSchedule] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Fetch emergency card info
  useEffect(() => {
    const fetchCard = async () => {
      try {
        const data = await api.get<EmergencyCard>('/emergency-card/my/info');
        setEmergencyCard(data);
      } catch {
        // no card yet
      } finally {
        setCardLoading(false);
      }
    };

    fetchCard();
  }, []);

  // Fetch check-in schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await api.get<CheckInSchedule>('/checkins/schedule');
        setSchedule(data.times || []);
      } catch {
        // no schedule
      }
    };

    fetchSchedule();
  }, []);

  const handleGenerateCard = async () => {
    setGenerating(true);
    try {
      const data = await api.post<EmergencyCard>('/emergency-card/generate');
      setEmergencyCard(data);
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  const handleAddTime = () => {
    if (!newTime) return;
    if (schedule.includes(newTime)) return;
    setSchedule((prev) => [...prev, newTime].sort());
    setNewTime('');
  };

  const handleRemoveTime = (time: string) => {
    setSchedule((prev) => prev.filter((t) => t !== time));
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await api.put('/checkins/schedule', { times: schedule });
    } catch {
      // silently fail
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('common:profile')}
      </h1>

      {/* User info */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                {user?.name}
              </h2>
              <p className="text-sm text-[var(--color-text)]/60">
                {user?.email}
              </p>
              <p className="text-xs text-[var(--color-text)]/40 mt-0.5">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Emergency card */}
      <Card>
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-[var(--color-text)]">
            {t('ward:emergency_card')}
          </h2>

          {cardLoading ? (
            <p className="text-[var(--color-text)]/60">{t('common:loading')}</p>
          ) : emergencyCard ? (
            <div className="space-y-3">
              {emergencyCard.qrCodeUrl && (
                <div className="flex justify-center">
                  <img
                    src={emergencyCard.qrCodeUrl}
                    alt="Emergency QR Code"
                    className="w-48 h-48 rounded-lg"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 p-3 glass rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                <span className="text-sm text-[var(--color-text)] break-all flex-1">
                  {emergencyCard.link}
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(emergencyCard.link)}
                  className="text-[var(--color-primary)] text-sm font-semibold flex-shrink-0"
                >
                  Copy
                </button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateCard}
                loading={generating}
                className="w-full"
              >
                Regenerate
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerateCard}
              loading={generating}
              className="w-full"
            >
              Generate QR Card
            </Button>
          )}
        </div>
      </Card>

      {/* Check-in schedule editor */}
      <Card>
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-[var(--color-text)]">
            {t('ward:next_checkin')} schedule
          </h2>

          {/* Existing times */}
          {schedule.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {schedule.map((time) => (
                <span
                  key={time}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-[var(--color-border)] text-sm text-[var(--color-text)]"
                >
                  {time}
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(time)}
                    className="text-[var(--color-danger)] hover:text-[var(--color-danger)] font-bold text-xs leading-none"
                  >
                    &#10005;
                  </button>
                </span>
              ))}
            </div>
          )}

          {schedule.length === 0 && (
            <p className="text-sm text-[var(--color-text)]/60">
              {t('common:no_data')}
            </p>
          )}

          {/* Add time */}
          <div className="flex gap-3 items-end">
            <Input
              label="Add time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" variant="outline" onClick={handleAddTime}>
              +
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleSaveSchedule}
            loading={savingSchedule}
            className="w-full"
          >
            {t('common:save')}
          </Button>
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        size="lg"
        onClick={logout}
        className="w-full"
      >
        {t('common:logout')}
      </Button>
    </div>
  );
};

export default ProfilePage;

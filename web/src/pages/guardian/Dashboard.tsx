import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { api } from '../../services/api';

interface Ward {
  id: string;
  name: string;
  lastCheckIn: any;
  moodAverage: number | null;
  moodTrend: string;
  status: string;
}

const statusMap: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
  ok:        { label: 'В порядке',  labelEn: 'OK',        color: 'var(--color-success)', bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)' },
  alert:     { label: 'Тревога',    labelEn: 'Alert',     color: 'var(--color-danger)',  bg: 'color-mix(in srgb, var(--color-danger) 12%, transparent)' },
  escalated: { label: 'Эскалация',  labelEn: 'Escalated', color: 'var(--color-danger)',  bg: 'color-mix(in srgb, var(--color-danger) 12%, transparent)' },
  waiting:   { label: 'Ожидание',   labelEn: 'Waiting',   color: 'var(--color-warning)', bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)' },
  unknown:   { label: 'Неизвестно', labelEn: 'Unknown',   color: 'var(--color-text-tertiary)', bg: 'var(--color-surface-secondary)' },
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation(['guardian', 'common']);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const l = lang || 'ru';
  const isRu = l === 'ru';

  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Ward[]>('/dashboard/overview');
        setWards(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-5 pt-3 pb-5 space-y-7">
      <h1 className="text-[34px] font-bold tracking-tight">{isRu ? 'Дашборд' : 'Dashboard'}</h1>

      {wards.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-8 text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}>
            <Users className="w-7 h-7 text-[var(--color-primary)]" />
          </div>
          <p className="text-[15px] text-[var(--color-text-tertiary)]">{t('guardian:no_wards')}</p>
        </div>
      ) : (
        <section>
          <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 px-1">
            {isRu ? 'Подопечные' : 'Wards'}
          </h2>
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
            {wards.map((ward, i) => {
              const s = statusMap[ward.status] || statusMap.unknown;
              const lastActive = ward.lastCheckIn?.respondedAt || ward.lastCheckIn?.scheduledAt;
              const timeAgo = lastActive ? new Date(lastActive).toLocaleString(isRu ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

              return (
                <div key={ward.id}>
                  {i > 0 && <div className="border-t border-[var(--color-separator)] ml-5" />}
                  <button
                    onClick={() => navigate(`/${l}/guardian/ward/${ward.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-4 min-h-[72px] text-left active:opacity-60 transition-opacity cursor-pointer"
                  >
                    {/* Avatar placeholder */}
                    <div className="w-11 h-11 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0 text-[17px] font-semibold text-[var(--color-text-tertiary)]">
                      {ward.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[17px] font-semibold truncate">{ward.name}</p>
                        <span className="shrink-0 text-[12px] font-medium px-2 py-0.5 rounded-[var(--radius-xs)]" style={{ background: s.bg, color: s.color }}>
                          {isRu ? s.label : s.labelEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {ward.moodAverage != null && (
                          <span className="text-[14px] text-[var(--color-text-tertiary)]">
                            {isRu ? 'Настроение' : 'Mood'}: <span className="font-semibold text-[var(--color-text-secondary)]">{ward.moodAverage}</span> {ward.moodTrend === 'improving' ? '↑' : ward.moodTrend === 'declining' ? '↓' : '→'}
                          </span>
                        )}
                        <span className="text-[13px] text-[var(--color-text-quaternary)]">{timeAgo}</span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[var(--color-text-quaternary)] shrink-0" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;

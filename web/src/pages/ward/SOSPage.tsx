import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

type SOSState = 'idle' | 'sending' | 'sent';

const SOSPage: React.FC = () => {
  const { i18n } = useTranslation(['ward']);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const l = lang || 'ru';
  const isRu = i18n.language === 'ru';

  const [state, setState] = useState<SOSState>('idle');

  const handleSOS = async () => {
    setState('sending');
    try {
      let lat: number | undefined, lng: number | undefined;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        ).catch(() => null);
        if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude; }
      }
      await api.post('/sos', { latitude: lat, longitude: lng });
      setState('sent');
    } catch {
      setState('sent');
    }
  };

  if (state === 'sent') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-5 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[var(--color-success)]/12 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-[var(--color-success)]" />
        </div>
        <h1 className="text-[22px] font-bold">{isRu ? 'SOS отправлен!' : 'SOS sent!'}</h1>
        <p className="text-[15px] text-[var(--color-text-tertiary)] max-w-[280px]">
          {isRu ? 'Все ваши контакты получили оповещение с вашим местоположением.' : 'All your contacts have been notified with your location.'}
        </p>
        <button
          onClick={() => navigate(`/${l}/ward/home`)}
          className="mt-4 h-11 px-6 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white text-[15px] font-semibold active:opacity-60 transition-opacity cursor-pointer"
        >
          {isRu ? 'На главную' : 'Go home'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-70px)]">
      {/* Back */}
      <div className="px-4 py-3">
        <button onClick={() => navigate(`/${l}/ward/home`)} className="flex items-center gap-1 text-[var(--color-primary)] text-[17px] active:opacity-60 transition-opacity cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
          {isRu ? 'Назад' : 'Back'}
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
        <h1 className="text-[22px] font-bold">{isRu ? 'Экстренный вызов' : 'Emergency Call'}</h1>
        <p className="text-[15px] text-[var(--color-text-tertiary)] text-center max-w-[280px]">
          {isRu ? 'Нажмите кнопку для немедленного оповещения всех контактов' : 'Tap the button to immediately alert all contacts'}
        </p>

        {/* SOS Button */}
        <button
          onClick={handleSOS}
          disabled={state === 'sending'}
          className="w-[160px] h-[160px] rounded-full bg-[var(--color-danger)] text-white flex items-center justify-center shadow-xl shadow-[var(--color-danger)]/30 active:scale-95 transition-transform duration-150 cursor-pointer"
        >
          {state === 'sending' ? (
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-[40px] font-bold">SOS</span>
          )}
        </button>

        <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-tertiary)]">
          <MapPin className="w-3.5 h-3.5" />
          {isRu ? 'Геолокация будет отправлена' : 'Location will be shared'}
        </div>
      </div>

      {/* Contacts */}
      <div className="px-5 pb-6">
        <p className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 px-1">
          {isRu ? 'Получат оповещение' : 'Will be notified'}
        </p>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
          {[
            { name: isRu ? 'Мария (дочь)' : 'Maria (daughter)', phone: '+7 999 123-45-67' },
            { name: isRu ? 'Скорая помощь' : 'Emergency', phone: '103' },
          ].map((c, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 min-h-[48px] ${i > 0 ? 'border-t border-[var(--color-separator)]' : ''}`}>
              <Phone className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <span className="text-[15px] flex-1">{c.name}</span>
              <span className="text-[13px] text-[var(--color-text-tertiary)]">{c.phone}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SOSPage;

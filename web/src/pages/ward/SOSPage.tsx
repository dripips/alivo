import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';

type SOSState = 'idle' | 'sending' | 'sent' | 'error';

const SOSPage: React.FC = () => {
  const { t } = useTranslation(['ward', 'common']);
  const [state, setState] = useState<SOSState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSOS = async () => {
    setState('sending');
    setErrorMsg('');

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
        // send SOS even without location
      }

      await api.post('/sos', { latitude, longitude });
      setState('sent');
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : t('common:error'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('ward:sos_title')}
      </h1>

      <p className="text-center text-[var(--color-text)]/60 max-w-xs">
        {t('ward:sos_subtitle')}
      </p>

      {/* SOS Button */}
      <button
        type="button"
        onClick={handleSOS}
        disabled={state === 'sending' || state === 'sent'}
        className={[
          'w-[200px] h-[200px] rounded-full',
          'flex items-center justify-center',
          'text-white font-bold text-4xl',
          'shadow-2xl transition-all duration-300',
          'focus:outline-none focus:ring-4 focus:ring-[var(--color-danger)]/40',
          state === 'sent'
            ? 'bg-[var(--color-success)] scale-95'
            : 'bg-[var(--color-danger)] hover:scale-105 active:scale-95',
          state === 'sending' ? 'opacity-70' : '',
          state === 'idle' ? 'animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          boxShadow:
            state !== 'sent'
              ? '0 0 60px rgba(239, 68, 68, 0.5), 0 0 120px rgba(239, 68, 68, 0.2)'
              : undefined,
        }}
      >
        {state === 'sending' ? (
          <svg
            className="animate-spin h-12 w-12 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : state === 'sent' ? (
          <span className="text-5xl">&#10003;</span>
        ) : (
          'SOS'
        )}
      </button>

      {/* Confirmation message */}
      {state === 'sent' && (
        <p className="text-[var(--color-success)] font-semibold text-center max-w-xs">
          {t('ward:sos_sent')}
        </p>
      )}

      {/* Error message */}
      {state === 'error' && (
        <div className="text-center space-y-2">
          <p className="text-[var(--color-danger)] font-semibold">{errorMsg}</p>
          <button
            type="button"
            onClick={() => setState('idle')}
            className="text-[var(--color-primary)] underline text-sm"
          >
            {t('common:back')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SOSPage;

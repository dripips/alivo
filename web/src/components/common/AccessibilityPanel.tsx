import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Type, Zap, Moon, Bell, BellOff, Check } from 'lucide-react';
import { useA11yStore } from '../../store/accessibility.store';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative w-[51px] h-[31px] rounded-full transition-colors cursor-pointer shrink-0 ${
      on ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-secondary)]'
    }`}
  >
    <span className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
  </button>
);

const AccessibilityPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, i18n } = useTranslation('common');
  const isRu = i18n.language === 'ru';
  const { fontSize, contrast, reducedMotion, setFontSize, setContrast, setReducedMotion } = useA11yStore();
  const push = usePushNotifications();
  const [pushLoading, setPushLoading] = useState(false);

  const handlePushToggle = async () => {
    setPushLoading(true);
    if (push.state === 'subscribed') {
      await push.unsubscribe();
    } else {
      await push.subscribe();
    }
    setPushLoading(false);
  };

  const fontOptions = [
    { value: 'normal' as const, label: isRu ? 'Обычный' : 'Normal', sample: 'Aa' },
    { value: 'large' as const, label: isRu ? 'Крупный' : 'Large', sample: 'Aa' },
    { value: 'xlarge' as const, label: isRu ? 'Очень крупный' : 'X-Large', sample: 'Aa' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-surface)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] p-5 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold">{t('settings')}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] cursor-pointer">
            <span className="text-[15px]">✕</span>
          </button>
        </div>

        {/* Push Notifications */}
        {push.state !== 'unsupported' && (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] overflow-hidden">
            <p className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2">{t('notifications')}</p>
            <div className="bg-[var(--color-bg)] rounded-[var(--radius-sm)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {push.state === 'subscribed'
                    ? <Bell className="w-5 h-5 text-[var(--color-primary)]" />
                    : <BellOff className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                  }
                  <div>
                    <p className="text-[15px] font-medium">
                      {push.state === 'subscribed' ? t('push_enabled') : t('push_enable')}
                    </p>
                    {push.state === 'denied'
                      ? <p className="text-[12px] text-[var(--color-danger)]">{t('push_denied')}</p>
                      : <p className="text-[12px] text-[var(--color-text-tertiary)]">{t('push_description')}</p>
                    }
                  </div>
                </div>
                {push.state !== 'denied' && (
                  pushLoading
                    ? <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    : <Toggle on={push.state === 'subscribed'} onToggle={handlePushToggle} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Font Size */}
        <div>
          <p className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 flex items-center gap-2">
            <Type className="w-4 h-4" />
            {isRu ? 'Размер текста' : 'Font Size'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={`p-3 rounded-[var(--radius-sm)] text-center transition-all cursor-pointer ${
                  fontSize === opt.value
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-tertiary)]'
                }`}
              >
                <span className={`block font-bold ${opt.value === 'normal' ? 'text-[16px]' : opt.value === 'large' ? 'text-[20px]' : 'text-[24px]'}`}>{opt.sample}</span>
                <span className="text-[11px] mt-1 block">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-[var(--color-bg)] rounded-[var(--radius-sm)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
            <span className="text-[15px] flex items-center gap-2">
              <Moon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              {isRu ? 'Тёмная тема' : 'Dark Mode'}
            </span>
            <Toggle
              on={document.documentElement.classList.contains('dark')}
              onToggle={() => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('alivo_theme', isDark ? 'dark' : 'light');
              }}
            />
          </div>

          <div className="border-t border-[var(--color-separator)] ml-[44px]" />

          <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
            <span className="text-[15px] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              {isRu ? 'Высокая контрастность' : 'High Contrast'}
            </span>
            <Toggle on={contrast === 'high'} onToggle={() => setContrast(contrast === 'high' ? 'normal' : 'high')} />
          </div>

          <div className="border-t border-[var(--color-separator)] ml-[44px]" />

          <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
            <span className="text-[15px] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              {isRu ? 'Без анимаций' : 'Reduce Motion'}
            </span>
            <Toggle on={reducedMotion} onToggle={() => setReducedMotion(!reducedMotion)} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccessibilityPanel;

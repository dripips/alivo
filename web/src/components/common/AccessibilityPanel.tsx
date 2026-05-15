import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Type, Zap, Sun, Moon } from 'lucide-react';
import { useA11yStore } from '../../store/accessibility.store';

const AccessibilityPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, i18n } = useTranslation('common');
  const { fontSize, contrast, reducedMotion, setFontSize, setContrast, setReducedMotion } = useA11yStore();
  const isRu = i18n.language === 'ru';

  const fontOptions = [
    { value: 'normal' as const, label: isRu ? 'Обычный' : 'Normal', sample: 'Aa' },
    { value: 'large' as const, label: isRu ? 'Крупный' : 'Large', sample: 'Aa' },
    { value: 'xlarge' as const, label: isRu ? 'Очень крупный' : 'Extra Large', sample: 'Aa' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Eye className="w-5 h-5 text-[var(--color-primary)]" />
            {isRu ? 'Доступность' : 'Accessibility'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
            <Type className="w-4 h-4" />
            {isRu ? 'Размер текста' : 'Font Size'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={`p-3 rounded-[var(--radius-sm)] border text-center transition-all cursor-pointer ${
                  fontSize === opt.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
                }`}
              >
                <span className={`block font-bold ${opt.value === 'normal' ? 'text-base' : opt.value === 'large' ? 'text-xl' : 'text-2xl'}`}>
                  {opt.sample}
                </span>
                <span className="text-xs mt-1 block">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
            <Sun className="w-4 h-4" />
            {isRu ? 'Контрастность' : 'Contrast'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['normal', 'high'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setContrast(c)}
                className={`p-3 rounded-[var(--radius-sm)] border text-center transition-all cursor-pointer ${
                  contrast === c
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
                }`}
              >
                {c === 'normal' ? (isRu ? 'Обычная' : 'Normal') : (isRu ? 'Высокая' : 'High')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--color-text-secondary)]" />
            {isRu ? 'Уменьшить анимации' : 'Reduce Motion'}
          </label>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${
              reducedMotion ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                reducedMotion ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-2">
            <Moon className="w-4 h-4 text-[var(--color-text-secondary)]" />
            {isRu ? 'Тёмная тема' : 'Dark Mode'}
          </label>
          <button
            onClick={() => {
              const isDark = document.documentElement.classList.toggle('dark');
              localStorage.setItem('alivo_theme', isDark ? 'dark' : 'light');
            }}
            className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${
              document.documentElement.classList.contains('dark') ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                document.documentElement.classList.contains('dark') ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;

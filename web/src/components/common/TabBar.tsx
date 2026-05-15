import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, MessageCircle, Pill, Heart, ShieldAlert } from "lucide-react";

const TabBar: React.FC = () => {
  const location = useLocation();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation('ward');
  const l = lang || 'ru';

  const tabs = [
    { path: `/${l}/ward/home`, label: t('home'), icon: Home },
    { path: `/${l}/ward/chat`, label: t('chat'), icon: MessageCircle },
    { path: `/${l}/ward/medications`, label: t('medications'), icon: Pill },
    { path: `/${l}/ward/wellness`, label: t('wellness'), icon: Heart },
    { path: `/${l}/ward/sos`, label: 'SOS', icon: ShieldAlert, danger: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-thick border-t border-[var(--color-separator)] pb-[env(safe-area-inset-bottom)]" role="tablist">
      <div className="max-w-2xl mx-auto grid grid-cols-5 h-[50px]">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          const Icon = tab.icon;
          const color = tab.danger
            ? 'var(--color-danger)'
            : isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)';

          return (
            <Link
              key={tab.path}
              to={tab.path}
              role="tab"
              aria-selected={isActive}
              className="flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
              style={{ color }}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.2 : 1.5} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;

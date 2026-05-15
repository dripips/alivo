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
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-[var(--color-border)]"
      role="tablist"
      aria-label="Navigation"
    >
      <div className="max-w-lg mx-auto flex items-stretch justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={[
                "flex flex-col items-center justify-center gap-0.5",
                "min-w-16 min-h-14 py-2 px-2",
                "transition-colors text-xs font-medium",
                tab.danger
                  ? isActive ? "text-[var(--color-danger)]" : "text-[var(--color-danger)]/60"
                  : isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]",
              ].join(" ")}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} strokeWidth={isActive ? 2.5 : 2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;

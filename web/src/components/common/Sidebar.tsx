import React, { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Bell, Settings, LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import LanguageSwitcher from "./LanguageSwitcher";

const Sidebar: React.FC = () => {
  const { i18n } = useTranslation('guardian');
  const { lang } = useParams<{ lang: string }>();
  const l = lang || 'ru';
  const isRu = i18n.language === 'ru';
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const navItems = [
    { path: `/${l}/guardian/dashboard`, label: isRu ? 'Дашборд' : 'Dashboard', icon: LayoutDashboard },
    { path: `/${l}/guardian/alerts`, label: isRu ? 'Уведомления' : 'Alerts', icon: Bell },
    { path: `/${l}/guardian/settings`, label: isRu ? 'Настройки' : 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = `/${l}/login`;
  };

  const isActive = (path: string) =>
    location.pathname === path || (path.includes('dashboard') && location.pathname.includes('/guardian/ward/'));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] cursor-pointer"
      >
        <Menu className="w-5 h-5 text-[var(--color-text-tertiary)]" />
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-[var(--color-surface)] border-r border-[var(--color-separator)] flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--color-separator)]">
          <Link to={`/${l}/guardian/dashboard`} className="text-[20px] font-bold text-[var(--color-primary)]">Alivo</Link>
          <button onClick={() => setOpen(false)} className="md:hidden w-8 h-8 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5 text-[var(--color-text-tertiary)]" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[15px] font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--color-separator)] space-y-3">
          <LanguageSwitcher />
          <p className="text-[13px] text-[var(--color-text-tertiary)] px-1 truncate">{user?.name || 'Guardian'}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-[14px] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {isRu ? 'Выйти' : 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

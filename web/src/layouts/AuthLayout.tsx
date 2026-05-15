import React from "react";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

interface AuthLayoutProps { children: React.ReactNode; }

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-5 py-10">
    {/* Top controls */}
    <div className="fixed top-4 right-5 z-50 flex items-center gap-2">
      <LanguageSwitcher />
      <button
        onClick={() => {
          const isDark = document.documentElement.classList.toggle('dark');
          localStorage.setItem('alivo_theme', isDark ? 'dark' : 'light');
        }}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] cursor-pointer active:opacity-60 transition-opacity"
      >
        <svg className="w-[18px] h-[18px] dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg className="w-[18px] h-[18px] hidden dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>

    {/* Logo */}
    <div className="mb-8 text-center">
      <h1 className="text-[40px] font-bold text-[var(--color-primary)]">Alivo</h1>
      <p className="text-[15px] text-[var(--color-text-tertiary)] mt-1">Care connected</p>
    </div>

    {/* Card */}
    <div className="w-full max-w-[400px] bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-6">
      {children}
    </div>
  </div>
);

export default AuthLayout;

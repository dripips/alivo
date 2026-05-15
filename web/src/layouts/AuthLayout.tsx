import React from "react";
import Card from "../components/ui/Card";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute top-[-30%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-[var(--color-primary)]/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-[var(--color-accent)]/15 blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[var(--color-success)]/10 blur-[80px]" />
      </div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <button
          onClick={() => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('alivo_theme', isDark ? 'dark' : 'light');
          }}
          className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <svg className="w-[18px] h-[18px] dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg className="w-[18px] h-[18px] hidden dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
            Alivo
          </span>
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Care connected
        </p>
      </div>

      <Card className="w-full max-w-md">
        {children}
      </Card>
    </div>
  );
};

export default AuthLayout;

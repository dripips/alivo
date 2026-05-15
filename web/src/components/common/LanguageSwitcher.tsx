import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

interface LangOption {
  code: string;
  label: string;
  flag: React.ReactNode;
}

const RuFlag = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="4.67" fill="#fff" />
    <rect y="4.67" width="20" height="4.67" fill="#0039A6" />
    <rect y="9.33" width="20" height="4.67" fill="#D52B1E" />
    <rect width="20" height="14" rx="2" stroke="#000" strokeOpacity="0.08" strokeWidth="0.5" fill="none" />
  </svg>
);

const EnFlag = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="14" rx="2" fill="#012169" />
    <path d="M0 0L20 14M20 0L0 14" stroke="#fff" strokeWidth="2.5" />
    <path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.5" />
    <path d="M10 0V14M0 7H20" stroke="#fff" strokeWidth="4" />
    <path d="M10 0V14M0 7H20" stroke="#C8102E" strokeWidth="2.5" />
    <rect width="20" height="14" rx="2" stroke="#000" strokeOpacity="0.08" strokeWidth="0.5" fill="none" />
  </svg>
);

const languages: LangOption[] = [
  { code: "ru", label: "RU", flag: <RuFlag /> },
  { code: "en", label: "EN", flag: <EnFlag /> },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const resolved = (i18n.resolvedLanguage || i18n.language || 'ru').slice(0, 2);
  const currentLang =
    languages.find((l) => l.code === resolved) || languages[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const switchTo = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('alivo_lang', code);
    setOpen(false);
    const path = location.pathname.replace(/^\/(ru|en)/, `/${code}`);
    navigate(path, { replace: true });
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5",
          "rounded-[var(--radius-sm)] border border-[var(--color-border)]",
          "bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text)]",
          "hover:border-[var(--color-primary)] transition-colors",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentLang.flag}
        <span>{currentLang.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className={[
            "absolute top-full right-0 mt-1 z-50",
            "glass border border-[var(--color-border)] rounded-[var(--radius-sm)]",
            "py-1 min-w-[80px] shadow-lg",
          ].join(" ")}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === currentLang.code}
              onClick={() => switchTo(lang.code)}
              className={[
                "flex items-center gap-2 w-full px-3 py-2 text-sm",
                "hover:bg-[var(--color-primary)]/10 transition-colors",
                lang.code === currentLang.code
                  ? "text-[var(--color-primary)] font-semibold"
                  : "text-[var(--color-text)]",
              ].join(" ")}
            >
              {lang.flag}
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

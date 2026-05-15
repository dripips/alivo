import React, { useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { ShieldAlert, Eye } from "lucide-react";
import TabBar from "../components/common/TabBar";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import AccessibilityPanel from "../components/common/AccessibilityPanel";

const WardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const l = lang || 'ru';
  const isSosPage = location.pathname.includes("/ward/sos");
  const isChatPage = location.pathname.includes("/ward/chat");
  const [showA11y, setShowA11y] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <a href="#main-content" className="skip-link">Skip to content</a>

      {!isChatPage && (
        <header className="sticky top-0 z-40 glass border-b border-[var(--color-border)]">
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
            <span className="font-bold text-lg">
              <span className="text-[var(--color-primary)]">Ali</span>vo
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowA11y(true)}
                className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                aria-label="Accessibility settings"
              >
                <Eye className="w-4 h-4" />
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </header>
      )}

      <main className={`max-w-lg mx-auto ${isChatPage ? 'h-screen' : 'pb-24'}`} id="main-content">
        <Outlet />
      </main>

      {!isChatPage && <TabBar />}

      {!isSosPage && !isChatPage && (
        <button
          onClick={() => navigate(`/${l}/ward/sos`)}
          aria-label="SOS Emergency"
          className="fixed bottom-22 right-4 z-40 w-14 h-14 rounded-full bg-[var(--color-danger)] text-white shadow-lg shadow-[var(--color-danger)]/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-300 cursor-pointer"
        >
          <ShieldAlert className="w-6 h-6" />
        </button>
      )}

      {showA11y && <AccessibilityPanel onClose={() => setShowA11y(false)} />}
    </div>
  );
};

export default WardLayout;

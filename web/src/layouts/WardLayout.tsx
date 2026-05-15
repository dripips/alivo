import React, { useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { ShieldAlert, Settings } from "lucide-react";
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
    <div className="min-h-screen bg-[var(--color-bg)]">
      {!isChatPage && (
        <header className="sticky top-0 z-40 glass-thick border-b border-[var(--color-separator)]">
          <div className="max-w-2xl mx-auto flex items-center justify-between px-5 h-12">
            <span className="text-[20px] font-bold text-[var(--color-primary)]">Alivo</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowA11y(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
              >
                <Settings className="w-5 h-5" />
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </header>
      )}

      <main className={`max-w-2xl mx-auto ${isChatPage ? 'h-screen' : 'pb-[70px]'}`}>
        <Outlet />
      </main>

      {!isChatPage && <TabBar />}

      {!isSosPage && !isChatPage && (
        <button
          onClick={() => navigate(`/${l}/ward/sos`)}
          aria-label="SOS"
          className="fixed bottom-[70px] right-5 z-40 w-[52px] h-[52px] rounded-full bg-[var(--color-danger)] text-white shadow-lg shadow-[var(--color-danger)]/25 flex items-center justify-center active:scale-95 transition-transform duration-150 cursor-pointer"
        >
          <ShieldAlert className="w-[22px] h-[22px]" />
        </button>
      )}

      {showA11y && <AccessibilityPanel onClose={() => setShowA11y(false)} />}
    </div>
  );
};

export default WardLayout;

import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const pageTitles: Record<string, string> = {
  "/guardian/dashboard": "Dashboard",
  "/guardian/wards": "My Wards",
  "/guardian/alerts": "Alerts",
  "/guardian/settings": "Settings",
};

const GuardianLayout: React.FC = () => {
  const location = useLocation();

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/guardian/ward/") ? "Ward Details" : "Dashboard");

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            {title}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default GuardianLayout;

import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const GuardianLayout: React.FC = () => (
  <div className="min-h-screen bg-[var(--color-bg)]">
    <Sidebar />
    <main className="md:ml-[260px] min-h-screen">
      <div className="max-w-4xl mx-auto p-5 md:p-8">
        <Outlet />
      </div>
    </main>
  </div>
);

export default GuardianLayout;

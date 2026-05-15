import React, { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";

import AuthLayout from "../layouts/AuthLayout";
import WardLayout from "../layouts/WardLayout";
import GuardianLayout from "../layouts/GuardianLayout";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));

const WardHome = lazy(() => import("../pages/ward/HomePage"));
const WardChat = lazy(() => import("../pages/ward/ChatPage"));
const WardMedications = lazy(() => import("../pages/ward/MedicationsPage"));
const WardWellness = lazy(() => import("../pages/ward/WellnessPage"));
const WardSos = lazy(() => import("../pages/ward/SOSPage"));
const WardAppointments = lazy(() => import("../pages/ward/AppointmentsPage"));
const WardWalk = lazy(() => import("../pages/ward/WalkPage"));
const WardProfile = lazy(() => import("../pages/ward/ProfilePage"));

const GuardianDashboard = lazy(() => import("../pages/guardian/Dashboard"));
const GuardianWardDetail = lazy(() => import("../pages/guardian/WardDetail"));
const GuardianAlerts = lazy(() => import("../pages/guardian/Alerts"));
const GuardianSettings = lazy(() => import("../pages/guardian/Settings"));

const LANGS = ["ru", "en"];

function getLang(): string {
  const saved = localStorage.getItem("alivo_lang");
  return saved && LANGS.includes(saved) ? saved : "ru";
}

const Loader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
  </div>
);

const LangGuard: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lang && LANGS.includes(lang)) {
      if (i18n.language !== lang) i18n.changeLanguage(lang);
      localStorage.setItem("alivo_lang", lang);
    }
  }, [lang, i18n]);

  if (!lang || !LANGS.includes(lang)) {
    return <Navigate to={`/${getLang()}/login`} replace />;
  }

  return <Outlet />;
};

const AuthGuard: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const token = localStorage.getItem("alivo_token");
  if (!token) return <Navigate to={`/${lang || getLang()}/login`} replace />;
  return <Outlet />;
};

const RootRedirect = () => {
  const l = getLang();
  const token = localStorage.getItem("alivo_token");
  if (!token) return <Navigate to={`/${l}/login`} replace />;

  try {
    const u = JSON.parse(localStorage.getItem("alivo_user") || "{}");
    if (u.role === "GUARDIAN") return <Navigate to={`/${l}/guardian/dashboard`} replace />;
  } catch {}
  return <Navigate to={`/${l}/ward/home`} replace />;
};

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Navigate to={`/${getLang()}/login`} replace />} />
        <Route path="/register" element={<Navigate to={`/${getLang()}/register`} replace />} />

        <Route path="/:lang" element={<LangGuard />}>
          <Route path="login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="register" element={<AuthLayout><RegisterPage /></AuthLayout>} />

          <Route element={<AuthGuard />}>
            <Route path="ward" element={<WardLayout />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<WardHome />} />
              <Route path="chat" element={<WardChat />} />
              <Route path="medications" element={<WardMedications />} />
              <Route path="wellness" element={<WardWellness />} />
              <Route path="sos" element={<WardSos />} />
              <Route path="appointments" element={<WardAppointments />} />
              <Route path="walk" element={<WardWalk />} />
              <Route path="profile" element={<WardProfile />} />
            </Route>

            <Route path="guardian" element={<GuardianLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<GuardianDashboard />} />
              <Route path="ward/:id" element={<GuardianWardDetail />} />
              <Route path="alerts" element={<GuardianAlerts />} />
              <Route path="settings" element={<GuardianSettings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;

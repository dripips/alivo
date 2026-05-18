import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  CreditCard,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

/* ------------------------------------------------------------------ */
/*  Nav items                                                          */
/* ------------------------------------------------------------------ */

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: 'dashboard',
  },
  {
    key: 'users',
    label: 'Users',
    icon: <Users className="w-5 h-5" />,
    path: 'users',
  },
  {
    key: 'ai',
    label: 'AI Settings',
    icon: <BrainCircuit className="w-5 h-5" />,
    path: 'ai',
  },
  {
    key: 'billing',
    label: 'Billing',
    icon: <CreditCard className="w-5 h-5" />,
    path: 'billing',
  },
];

/* ------------------------------------------------------------------ */
/*  Page title mapping                                                 */
/* ------------------------------------------------------------------ */

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  ai: 'AI Settings',
  billing: 'Billing',
};

/* ------------------------------------------------------------------ */
/*  AdminLayout                                                        */
/* ------------------------------------------------------------------ */

const AdminLayout: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const l = lang || 'ru';

  /* Determine active segment */
  const segments = location.pathname.split('/');
  const activeSegment =
    segments[segments.indexOf('admin') + 1] || 'dashboard';
  const title = pageTitles[activeSegment] || 'Admin';

  /* Current user */
  const user = useAuthStore((s) => s.user);
  const userName = user?.name || user?.email || 'Admin';

  const handleLogout = () => {
    logout();
    navigate(`/${l}/login`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex">
      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-[var(--radius-sm)] glass border border-[var(--color-border)] cursor-pointer"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          'fixed top-0 left-0 z-50 h-full w-64',
          'glass border-r border-[var(--color-border)]',
          'flex flex-col',
          'transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[var(--color-border)]">
          <Link
            to={`/${l}/admin/dashboard`}
            className="text-[22px] font-extrabold tracking-tight"
          >
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              Alivo Admin
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeSegment === item.path;
            return (
              <Link
                key={item.key}
                to={`/${l}/admin/${item.path}`}
                onClick={() => setSidebarOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)]',
                  'transition-colors duration-200 font-medium',
                  isActive
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--color-text)]/70 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-[var(--color-border)] space-y-2">
          <div className="text-sm font-medium text-[var(--color-text)] truncate px-2">
            {userName}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--color-text)] md:ml-0 ml-12">
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

export default AdminLayout;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

interface LoginResponse {
  user: { id: string; name: string; email: string | null; role: 'WARD' | 'GUARDIAN' | 'ADMIN'; };
  token: string;
}

const LoginPage: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const l = lang || 'ru';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      setAuth(res.user, res.token);
      navigate(res.user.role === 'WARD' ? `/${l}/ward/home` : `/${l}/guardian/dashboard`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[22px] font-bold text-center">{t('login')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1 mb-1 block">{t('email')}</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
            placeholder="you@example.com"
            className="w-full h-12 px-4 text-[17px] bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] border-0 text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1 mb-1 block">{t('password')}</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
            placeholder="••••••••"
            className="w-full h-12 px-4 text-[17px] bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] border-0 text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          />
        </div>

        {error && <p className="text-[var(--color-danger)] text-[14px] text-center">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full h-[50px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[17px] font-semibold active:opacity-70 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : t('login')}
        </button>
      </form>

      <p className="text-center text-[15px] text-[var(--color-text-tertiary)]">
        {t('no_account')}{' '}
        <Link to={`/${l}/register`} className="text-[var(--color-primary)] font-semibold">{t('register')}</Link>
      </p>
    </div>
  );
};

export default LoginPage;

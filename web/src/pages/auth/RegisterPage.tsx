import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

type Role = 'WARD' | 'GUARDIAN';
interface RegisterResponse {
  user: { id: string; name: string; email: string | null; role: 'WARD' | 'GUARDIAN' | 'ADMIN'; };
  token: string;
}

const RegisterPage: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const l = lang || 'ru';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) { setError(t('select_role')); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post<RegisterResponse>('/auth/register', { name, email, password, role });
      setAuth(res.user, res.token);
      navigate(res.user.role === 'WARD' ? `/${l}/ward/home` : `/${l}/guardian/dashboard`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally { setLoading(false); }
  };

  const inputCls = "w-full h-12 px-4 text-[17px] bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] border-0 text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40";

  return (
    <div className="space-y-5">
      <h2 className="text-[22px] font-bold text-center">{t('register')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1 mb-1 block">{t('name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Иван Петрович" className={inputCls} />
        </div>
        <div>
          <label className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1 mb-1 block">{t('email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" className={inputCls} />
        </div>
        <div>
          <label className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1 mb-1 block">{t('password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="new-password" className={inputCls} />
        </div>

        <div>
          <p className="text-[15px] font-medium mb-3">{t('who_are_you')}</p>
          <div className="grid grid-cols-2 gap-3">
            {(['WARD', 'GUARDIAN'] as Role[]).map((r) => (
              <button
                key={r} type="button" onClick={() => setRole(r)}
                className={`h-[60px] rounded-[var(--radius-md)] text-[15px] font-medium transition-all cursor-pointer ${
                  role === r
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                {r === 'WARD' ? t('role_ward') : t('role_guardian')}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-[var(--color-danger)] text-[14px] text-center">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full h-[50px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[17px] font-semibold active:opacity-70 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : t('register')}
        </button>
      </form>

      <p className="text-center text-[15px] text-[var(--color-text-tertiary)]">
        {t('has_account')}{' '}
        <Link to={`/${l}/login`} className="text-[var(--color-primary)] font-semibold">{t('login')}</Link>
      </p>
    </div>
  );
};

export default RegisterPage;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: 'WARD' | 'GUARDIAN' | 'ADMIN';
  };
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
    setError('');
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      setAuth(res.user, res.token);

      if (res.user.role === 'WARD') {
        navigate(`/${l}/ward/home`, { replace: true });
      } else {
        navigate(`/${l}/guardian/dashboard`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            {t('app_name')}
          </h1>
          <p className="mt-2 text-[var(--color-text)]/60">{t('login')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('email')}
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            large
          />

          <Input
            label={t('password')}
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            large
          />

          {error && (
            <p className="text-[var(--color-danger)] text-sm text-center">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full"
          >
            {t('login')}
          </Button>
        </form>

        <p className="text-center text-[var(--color-text-secondary)]">
          {t('no_account')}{' '}
          <Link
            to={`/${l}/register`}
            className="text-[var(--color-primary)] font-semibold hover:underline"
          >
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

type Role = 'WARD' | 'GUARDIAN';

interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: 'WARD' | 'GUARDIAN' | 'ADMIN';
  };
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
    if (!role) {
      setError(t('select_role'));
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.post<RegisterResponse>('/auth/register', {
        name,
        email,
        password,
        role,
      });
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
          <p className="mt-2 text-[var(--color-text)]/60">{t('register')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('name')}
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            large
          />

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
            autoComplete="new-password"
            large
          />

          {/* Role selector */}
          <div className="space-y-3">
            <p className="font-medium text-lg text-[var(--color-text)]">
              {t('who_are_you')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={[
                  'flex flex-col items-center gap-3 text-center',
                  role === 'WARD'
                    ? 'border-2 border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30'
                    : 'border border-[var(--color-border)]',
                ].join(' ')}
                onClick={() => setRole('WARD')}
              >
                <span className="text-4xl" role="img" aria-label="elderly">
                  &#129491;
                </span>
                <span className="font-semibold text-[var(--color-text)]">
                  {t('role_ward')}
                </span>
              </Card>

              <Card
                className={[
                  'flex flex-col items-center gap-3 text-center',
                  role === 'GUARDIAN'
                    ? 'border-2 border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30'
                    : 'border border-[var(--color-border)]',
                ].join(' ')}
                onClick={() => setRole('GUARDIAN')}
              >
                <span className="text-4xl" role="img" aria-label="family">
                  &#128106;
                </span>
                <span className="font-semibold text-[var(--color-text)]">
                  {t('role_guardian')}
                </span>
              </Card>
            </div>
          </div>

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
            {t('register')}
          </Button>
        </form>

        <p className="text-center text-[var(--color-text-secondary)]">
          {t('has_account')}{' '}
          <Link
            to={`/${l}/login`}
            className="text-[var(--color-primary)] font-semibold hover:underline"
          >
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

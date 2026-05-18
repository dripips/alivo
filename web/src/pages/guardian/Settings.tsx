import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { UserPlus, Trash2, CreditCard, Globe, LogOut, Phone } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const Settings: React.FC = () => {
  const { i18n } = useTranslation(['guardian', 'common']);
  const { lang } = useParams<{ lang: string }>();
  const logout = useAuthStore((s) => s.logout);
  const l = lang || 'ru';
  const isRu = i18n.language === 'ru';

  const [contacts, setContacts] = useState<any[]>([]);
  const [subscription, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<any[]>('/contacts').catch(() => []),
      api.get<any>('/billing/subscription').catch(() => null),
      api.get<any>('/billing/usage').catch(() => null),
    ]).then(([c, s, u]) => {
      setContacts(c); setSub(s); setUsage(u); setLoading(false);
    });
  }, []);

  const addContact = async () => {
    if (!newName.trim()) return;
    try {
      const c = await api.post<any>('/contacts', { name: newName.trim(), phone: newPhone.trim() });
      setContacts(prev => [...prev, c]);
      setNewName(''); setNewPhone(''); setShowAdd(false);
    } catch {}
  };

  const deleteContact = async (id: string) => {
    await api.delete(`/contacts/${id}`).catch(() => {});
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleLogout = () => { logout(); window.location.href = `/${l}/login`; };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const planName = subscription?.plan?.nameRu && isRu ? subscription.plan.nameRu : subscription?.plan?.name || subscription?.plan || '—';
  const planStatus = subscription?.status || '—';

  return (
    <div className="space-y-7">
      <h1 className="text-[34px] font-bold tracking-tight">{isRu ? 'Настройки' : 'Settings'}</h1>

      {/* Contacts */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
            {isRu ? 'Экстренные контакты' : 'Emergency Contacts'}
          </h2>
          <button onClick={() => setShowAdd(!showAdd)} className="text-[15px] text-[var(--color-primary)] font-medium cursor-pointer">
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
          {showAdd && (
            <div className="p-4 border-b border-[var(--color-separator)] space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={isRu ? 'Имя' : 'Name'} className="w-full h-11 px-3.5 text-[15px] bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] border-0 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" />
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder={isRu ? 'Телефон' : 'Phone'} className="w-full h-11 px-3.5 text-[15px] bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] border-0 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" />
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 h-10 rounded-[var(--radius-sm)] bg-[var(--color-surface-secondary)] text-[15px] font-medium cursor-pointer">{isRu ? 'Отмена' : 'Cancel'}</button>
                <button onClick={addContact} className="flex-1 h-10 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white text-[15px] font-medium cursor-pointer">{isRu ? 'Добавить' : 'Add'}</button>
              </div>
            </div>
          )}
          {contacts.length === 0 && !showAdd && (
            <div className="p-5 text-center text-[15px] text-[var(--color-text-tertiary)]">{isRu ? 'Нет контактов' : 'No contacts'}</div>
          )}
          {contacts.map((c, i) => (
            <div key={c.id || i}>
              {i > 0 && <div className="border-t border-[var(--color-separator)] ml-[52px]" />}
              <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                <Phone className="w-5 h-5 text-[var(--color-text-tertiary)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-medium">{c.name}</p>
                  {c.phone && <p className="text-[13px] text-[var(--color-text-tertiary)]">{c.phone}</p>}
                </div>
                <button onClick={() => deleteContact(c.id)} className="text-[var(--color-danger)] active:opacity-60 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription */}
      <section>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 px-1">
          {isRu ? 'Подписка' : 'Subscription'}
        </h2>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
            <CreditCard className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <div className="flex-1">
              <p className="text-[17px] font-medium">{typeof planName === 'string' ? planName : 'Free'}</p>
              <p className="text-[13px] text-[var(--color-text-tertiary)]">{planStatus}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Usage */}
      {usage && (
        <section>
          <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 px-1">
            {isRu ? 'Использование' : 'Usage'}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Check-ins', value: usage.checkIns ?? 0 },
              { label: 'SOS', value: usage.sosAlerts ?? 0 },
              { label: 'AI', value: typeof usage.aiMessages === 'object' ? usage.aiMessages.used : (usage.aiMessages ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-4 text-center">
                <p className="text-[22px] font-bold">{value}</p>
                <p className="text-[13px] text-[var(--color-text-tertiary)] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Language */}
      <section>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 px-1">
          {isRu ? 'Язык' : 'Language'}
        </h2>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] px-4 py-3 flex items-center gap-3 min-h-[52px]">
          <Globe className="w-5 h-5 text-[var(--color-text-tertiary)]" />
          <div className="flex-1">
            <p className="text-[17px] font-medium">{isRu ? 'Язык интерфейса' : 'Interface language'}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </section>

      {/* Logout */}
      <button onClick={handleLogout} className="w-full h-[50px] rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-60 transition-opacity cursor-pointer">
        <LogOut className="w-5 h-5" />
        {isRu ? 'Выйти' : 'Sign Out'}
      </button>
    </div>
  );
};

export default Settings;

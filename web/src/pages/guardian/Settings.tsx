import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  UserPlus,
  Trash2,
  CreditCard,
  BarChart3,
  Globe,
  LogOut,
  Phone,
  User,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: string;
}

interface Usage {
  checkIns: number;
  sosAlerts: number;
  aiMinutes: number;
}

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation(['guardian', 'common']);
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const l = lang || 'ru';
  const isRu = i18n.language === 'ru';

  /* ==== Emergency Contacts ==== */
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  const loadContacts = useCallback(() => {
    setContactsLoading(true);
    api
      .get<EmergencyContact[]>('/contacts')
      .then(setContacts)
      .catch(() => {})
      .finally(() => setContactsLoading(false));
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleAddContact = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setAddingContact(true);
    try {
      const created = await api.post<EmergencyContact>('/contacts', {
        name: newName.trim(),
        phone: newPhone.trim(),
        relation: newRelation.trim(),
      });
      setContacts((prev) => [...prev, created]);
      setNewName('');
      setNewPhone('');
      setNewRelation('');
      setShowAddForm(false);
    } catch {
      /* silently fail */
    } finally {
      setAddingContact(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await api.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      /* silently fail */
    }
  };

  /* ==== Billing ==== */
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    api.get<Subscription>('/billing/subscription').then(setSubscription).catch(() => {});
    api.get<Usage>('/billing/usage').then(setUsage).catch(() => {});
  }, []);

  /* ==== Logout ==== */
  const handleLogout = () => {
    logout();
    navigate(`/${l}/login`);
  };

  return (
    <div className="px-5 pt-3 pb-8 space-y-7 max-w-2xl mx-auto">
      {/* ── Title ── */}
      <h1 className="text-[34px] font-bold tracking-tight animate-fade-up">
        {isRu ? 'Настройки' : 'Settings'}
      </h1>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  EMERGENCY CONTACTS                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="animate-fade-up" style={{ animationDelay: '40ms' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
            {isRu ? 'Экстренные контакты' : 'Emergency Contacts'}
          </h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-[15px] text-[var(--color-primary)] font-medium active:opacity-60 transition-opacity cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isRu ? 'Добавить' : 'Add'}
            </button>
          )}
        </div>

        {contactsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
            {contacts.length === 0 && !showAddForm && (
              <div className="px-5 py-5 text-center">
                <p className="text-[15px] text-[var(--color-text-tertiary)]">
                  {isRu ? 'Нет контактов' : 'No contacts yet'}
                </p>
              </div>
            )}

            {contacts.map((contact, idx) => (
              <div key={contact.id}>
                {idx > 0 && (
                  <div className="border-t border-[var(--color-separator)] ml-[60px]" />
                )}
                <div className="flex items-center gap-3.5 px-5 py-3.5 min-h-[56px]">
                  <div
                    className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
                  >
                    <User className="w-[18px] h-[18px] text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-medium text-[var(--color-text)]">
                      {contact.name}
                    </p>
                    <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
                      {contact.phone}
                      {contact.relation && ` · ${contact.relation}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0 active:opacity-60 transition-opacity cursor-pointer"
                    style={{ background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)' }}
                  >
                    <Trash2 className="w-[16px] h-[16px] text-[var(--color-danger)]" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add form */}
            {showAddForm && (
              <>
                {contacts.length > 0 && (
                  <div className="border-t border-[var(--color-separator)] ml-5" />
                )}
                <div className="px-5 py-4 space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={isRu ? 'Имя' : 'Name'}
                    className="w-full h-11 px-3.5 bg-[var(--color-surface-secondary)] text-[var(--color-text)] rounded-[var(--radius-sm)] border-0 text-[15px] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                  />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={isRu ? 'Телефон' : 'Phone'}
                    className="w-full h-11 px-3.5 bg-[var(--color-surface-secondary)] text-[var(--color-text)] rounded-[var(--radius-sm)] border-0 text-[15px] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                  />
                  <input
                    type="text"
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    placeholder={isRu ? 'Отношение (необязательно)' : 'Relation (optional)'}
                    className="w-full h-11 px-3.5 bg-[var(--color-surface-secondary)] text-[var(--color-text)] rounded-[var(--radius-sm)] border-0 text-[15px] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                  />
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewName('');
                        setNewPhone('');
                        setNewRelation('');
                      }}
                      className="flex-1 h-11 rounded-[var(--radius-sm)] bg-[var(--color-surface-secondary)] text-[15px] font-semibold text-[var(--color-text)] active:opacity-60 transition-opacity cursor-pointer"
                    >
                      {isRu ? 'Отмена' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddContact}
                      disabled={addingContact || !newName.trim() || !newPhone.trim()}
                      className="flex-1 h-11 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white text-[15px] font-semibold active:opacity-60 transition-opacity cursor-pointer disabled:opacity-40"
                    >
                      {addingContact ? (
                        <div className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isRu ? (
                        'Сохранить'
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  SUBSCRIPTION                                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
          {isRu ? 'Подписка' : 'Subscription'}
        </h2>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
          {subscription ? (
            <>
              {/* Plan row */}
              <div className="flex items-center gap-3.5 px-5 py-4 min-h-[52px]">
                <div
                  className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}
                >
                  <CreditCard className="w-[18px] h-[18px] text-[var(--color-accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-medium text-[var(--color-text)] capitalize">
                    {subscription.plan}
                  </p>
                  <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5 capitalize">
                    {subscription.status}
                  </p>
                </div>
                <span className="text-[15px] text-[var(--color-text-tertiary)] shrink-0">
                  {isRu ? 'до' : 'until'}{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    isRu ? 'ru-RU' : 'en-US',
                    { day: 'numeric', month: 'short' }
                  )}
                </span>
              </div>
            </>
          ) : (
            <div className="px-5 py-5 text-center">
              <p className="text-[15px] text-[var(--color-text-tertiary)]">
                {isRu ? 'Нет данных о подписке' : 'No subscription data'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  USAGE STATS                                                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {usage && (
        <section className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
            {isRu ? 'Использование' : 'Usage'}
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: isRu ? 'Чек-ины' : 'Check-ins',
                value: usage.checkIns,
                color: 'var(--color-primary)',
                icon: <BarChart3 className="w-[18px] h-[18px] text-[var(--color-primary)]" />,
              },
              {
                label: isRu ? 'SOS' : 'SOS Alerts',
                value: usage.sosAlerts,
                color: 'var(--color-danger)',
                icon: <Phone className="w-[18px] h-[18px] text-[var(--color-danger)]" />,
              },
              {
                label: isRu ? 'AI мин.' : 'AI Minutes',
                value: usage.aiMinutes,
                color: 'var(--color-accent)',
                icon: (
                  <BarChart3 className="w-[18px] h-[18px] text-[var(--color-accent)]" />
                ),
              },
            ].map(({ label, value, color, icon }) => (
              <div
                key={label}
                className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-4 text-center"
              >
                <div
                  className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center mx-auto mb-2"
                  style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}
                >
                  {icon}
                </div>
                <p className="text-[22px] font-bold leading-none" style={{ color }}>
                  {value}
                </p>
                <p className="text-[13px] text-[var(--color-text-tertiary)] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  LANGUAGE                                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="animate-fade-up" style={{ animationDelay: '160ms' }}>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
          {isRu ? 'Язык' : 'Language'}
        </h2>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-3.5 px-5 py-4 min-h-[52px]">
            <div
              className="w-9 h-9 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
            >
              <Globe className="w-[18px] h-[18px] text-[var(--color-primary)]" />
            </div>
            <span className="flex-1 text-[17px] font-medium text-[var(--color-text)]">
              {isRu ? 'Язык интерфейса' : 'App Language'}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  LOGOUT                                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="animate-fade-up pt-2" style={{ animationDelay: '200ms' }}>
        <button
          onClick={handleLogout}
          className="w-full h-[50px] rounded-[var(--radius-md)] bg-[var(--color-danger)] text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-60 transition-opacity cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          {isRu ? 'Выйти' : 'Log Out'}
        </button>
      </div>
    </div>
  );
};

export default Settings;

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

/* ---------- Types ---------- */

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

/* ---------- Component ---------- */

const Settings: React.FC = () => {
  const { t } = useTranslation(['guardian', 'common']);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  /* ==== Emergency Contacts ==== */
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
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
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    setAddingContact(true);
    try {
      const created = await api.post<EmergencyContact>('/contacts', newContact);
      setContacts((prev) => [...prev, created]);
      setNewContact({ name: '', phone: '', relation: '' });
    } catch {
      /* silently fail for now */
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
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ======== Emergency Contacts ======== */}
      <Card className="animate-fade-up">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Emergency Contacts
        </h2>

        {contactsLoading ? (
          <p className="text-sm text-[var(--color-text-secondary)] animate-pulse">
            {t('common:loading')}
          </p>
        ) : (
          <>
            {contacts.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                {t('common:no_data')}
              </p>
            )}

            <ul className="space-y-2 mb-4">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-2 px-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)]"
                >
                  <div>
                    <p className="font-medium text-sm text-[var(--color-text)]">{c.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {c.phone}
                      {c.relation && ` · ${c.relation}`}
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteContact(c.id)}>
                    {t('common:delete')}
                  </Button>
                </li>
              ))}
            </ul>

            {/* Add contact form */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder={t('common:name')}
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <Input
                  placeholder={t('common:phone')}
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
                <Input
                  placeholder="Relation"
                  value={newContact.relation}
                  onChange={(e) =>
                    setNewContact((prev) => ({ ...prev, relation: e.target.value }))
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={addingContact}
                onClick={handleAddContact}
              >
                + Add Contact
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* ======== Billing ======== */}
      <Card
        className="animate-fade-up"
        {...({ style: { animationDelay: '60ms' } } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          {t('guardian:billing')}
        </h2>

        {subscription ? (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">Plan</span>
              <span className="font-semibold text-[var(--color-text)] capitalize">
                {subscription.plan}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">Status</span>
              <span className="font-semibold text-[var(--color-success)] capitalize">
                {subscription.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">Renews</span>
              <span className="text-[var(--color-text)]">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">{t('common:no_data')}</p>
        )}

        {usage && (
          <>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-4 mb-2">
              {t('guardian:usage')}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[var(--color-primary)]">{usage.checkIns}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Check-ins</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-danger)]">{usage.sosAlerts}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">SOS Alerts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-accent)]">{usage.aiMinutes}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">AI Minutes</p>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ======== Language ======== */}
      <Card
        className="animate-fade-up"
        {...({ style: { animationDelay: '120ms' } } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-[var(--color-text)]">Language</span>
          <LanguageSwitcher />
        </div>
      </Card>

      {/* ======== Logout ======== */}
      <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
        <Button variant="danger" size="lg" className="w-full" onClick={handleLogout}>
          {t('common:logout')}
        </Button>
      </div>
    </div>
  );
};

export default Settings;

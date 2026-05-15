import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface Appointment {
  id: string;
  title: string;
  dateTime: string;
  location?: string;
  doctor?: string;
  notes?: string;
  remindBefore?: number;
  completed?: boolean;
}

const AppointmentsPage: React.FC = () => {
  const { t } = useTranslation(['ward', 'common']);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // New appointment form state
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [remindBefore, setRemindBefore] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      const data = await api.get<Appointment[]>('/appointments/upcoming');
      setAppointments(Array.isArray(data) ? data : data ? [data] : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newAppt = await api.post<Appointment>('/appointments', {
        title,
        dateTime,
        location: location || undefined,
        doctor: doctor || undefined,
        notes: notes || undefined,
        remindBefore: Number(remindBefore),
      });

      setAppointments((prev) => [...prev, newAppt]);
      setShowForm(false);
      // Reset form
      setTitle('');
      setDateTime('');
      setLocation('');
      setDoctor('');
      setNotes('');
      setRemindBefore('30');
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.patch(`/appointments/${id}/complete`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, completed: true } : a))
      );
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--color-text)]/60">{t('common:loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {t('ward:appointments')}
        </h1>
        <Button
          size="sm"
          variant={showForm ? 'ghost' : 'primary'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? t('common:cancel') : t('ward:add_appointment')}
        </Button>
      </div>

      {/* Add appointment form */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Doctor visit"
            />

            <Input
              label="Date & Time"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />

            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Clinic name or address"
            />

            <Input
              label="Doctor"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              placeholder="Dr. Smith"
            />

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-sm text-[var(--color-text)]">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={[
                  'w-full bg-[var(--color-surface)] border border-[var(--color-border)]',
                  'rounded-[var(--radius-sm)] text-[var(--color-text)]',
                  'placeholder:text-[var(--color-text)]/40',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
                  'transition-all duration-200 px-4 py-3 text-base resize-none',
                ].join(' ')}
                placeholder="Bring test results..."
              />
            </div>

            <Input
              label="Remind before (minutes)"
              type="number"
              value={remindBefore}
              onChange={(e) => setRemindBefore(e.target.value)}
              placeholder="30"
            />

            <Button type="submit" loading={submitting} className="w-full">
              {t('common:save')}
            </Button>
          </form>
        </Card>
      )}

      {/* Appointments list */}
      {appointments.length === 0 ? (
        <Card>
          <p className="text-center text-[var(--color-text)]/60">
            {t('common:no_data')}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <Card key={appt.id}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3
                    className={[
                      'font-semibold text-lg',
                      appt.completed
                        ? 'line-through text-[var(--color-text)]/40'
                        : 'text-[var(--color-text)]',
                    ].join(' ')}
                  >
                    {appt.title}
                  </h3>
                  {!appt.completed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleComplete(appt.id)}
                    >
                      &#10003;
                    </Button>
                  )}
                </div>

                <p className="text-sm text-[var(--color-text)]/60">
                  {new Date(appt.dateTime).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>

                {appt.location && (
                  <p className="text-sm text-[var(--color-text)]/60">
                    &#128205; {appt.location}
                  </p>
                )}

                {appt.doctor && (
                  <p className="text-sm text-[var(--color-text)]/60">
                    &#129658; {appt.doctor}
                  </p>
                )}

                {appt.notes && (
                  <p className="text-sm text-[var(--color-text)]/60">
                    {appt.notes}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BrainCircuit,
  Save,
  Eye,
  EyeOff,
  MessageSquare,
  DollarSign,
} from 'lucide-react';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AiSettings {
  model: string;
  apiBaseUrl: string;
  apiKey: string;
}

interface AiCosts {
  totalMessages: number;
  estimatedCost: number;
  currency: string;
}

/* ------------------------------------------------------------------ */
/*  AdminAiSettings                                                    */
/* ------------------------------------------------------------------ */

const AdminAiSettings: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();

  /* Settings form */
  const [model, setModel] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Cost data */
  const [costs, setCosts] = useState<AiCosts | null>(null);
  const [loadingCosts, setLoadingCosts] = useState(true);

  useEffect(() => {
    api
      .get<AiSettings>('/admin/ai/settings')
      .then((data) => {
        setModel(data.model);
        setApiBaseUrl(data.apiBaseUrl);
        setApiKey(data.apiKey);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSettings(false));

    api
      .get<AiCosts>('/admin/ai/costs?days=30')
      .then(setCosts)
      .catch(() => {})
      .finally(() => setLoadingCosts(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      await api.put('/admin/ai/settings', { model, apiBaseUrl, apiKey });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* Masked key display */
  const maskedKey =
    apiKey.length > 8
      ? apiKey.slice(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.slice(-4)
      : apiKey;

  /* Loading */
  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* ── Settings Form ── */}
      <section className="animate-fade-up">
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
          AI Configuration
        </h2>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5 space-y-5">
          {/* Model */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1">
              AI Model
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o"
              className="w-full h-11 px-3.5 bg-[var(--color-surface-secondary)] text-[var(--color-text)] rounded-[var(--radius-sm)] border-0 text-[15px] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-shadow"
            />
          </div>

          {/* API Base URL */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1">
              API Base URL
            </label>
            <input
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full h-11 px-3.5 bg-[var(--color-surface-secondary)] text-[var(--color-text)] rounded-[var(--radius-sm)] border-0 text-[15px] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-shadow"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--color-text-tertiary)] ml-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full h-11 px-3.5 pr-12 bg-[var(--color-surface-secondary)] text-[var(--color-text)] rounded-[var(--radius-sm)] border-0 text-[15px] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-shadow font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              >
                {showKey ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-[var(--color-danger)]">{error}</p>
          )}

          {/* Success */}
          {saveSuccess && (
            <p className="text-[13px] text-[var(--color-success)] font-medium">
              Settings saved successfully.
            </p>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[50px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-60 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </section>

      {/* ── Cost Summary ── */}
      <section className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <h2 className="text-[14px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 px-1">
          Cost Summary (30 days)
        </h2>

        {loadingCosts ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : costs ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5">
              <div
                className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center mb-3"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 14%, transparent)' }}
              >
                <MessageSquare className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <p className="text-[28px] font-bold text-[var(--color-text)] leading-none mb-1">
                {costs.totalMessages.toLocaleString()}
              </p>
              <p className="text-[15px] text-[var(--color-text-tertiary)]">AI Messages</p>
            </div>

            <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5">
              <div
                className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center mb-3"
                style={{ background: 'color-mix(in srgb, var(--color-success) 14%, transparent)' }}
              >
                <DollarSign className="w-5 h-5 text-[var(--color-success)]" />
              </div>
              <p className="text-[28px] font-bold text-[var(--color-text)] leading-none mb-1">
                {costs.currency || '$'}{costs.estimatedCost.toFixed(2)}
              </p>
              <p className="text-[15px] text-[var(--color-text-tertiary)]">Estimated Cost</p>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] p-5 text-center">
            <p className="text-[15px] text-[var(--color-text-tertiary)]">
              No cost data available.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAiSettings;

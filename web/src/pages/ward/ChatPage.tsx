import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ChevronLeft, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useChatSocket } from '../../hooks/useChatSocket';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  buttons?: Array<{ label: string; callbackData: string }>;
}

/* ------------------------------------------------------------------ */
/*  Typing Indicator                                                   */
/* ------------------------------------------------------------------ */

const TypingDots: React.FC = () => (
  <div className="flex gap-[5px] items-center h-5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-[7px] h-[7px] rounded-full bg-[var(--color-text-tertiary)]"
        style={{
          animation: 'chat-bounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes chat-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }
    `}</style>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

const AlivoAvatar: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <div
    className="rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shrink-0"
    style={{ width: size, height: size }}
  >
    <span className="text-white font-bold" style={{ fontSize: size * 0.38 }}>
      A
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  ChatPage                                                           */
/* ------------------------------------------------------------------ */

const ChatPage: React.FC = () => {
  const { i18n } = useTranslation(['ward']);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const l = lang || 'ru';
  const isRu = i18n.language === 'ru';
  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const { connected, incoming, sendMessage, sendCallback } = useChatSocket(user?.id || null, true);

  /* Incoming messages */
  useEffect(() => {
    if (incoming) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: incoming.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          buttons: incoming.buttons,
        },
      ]);
    }
  }, [incoming]);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /* Send */
  const handleSend = (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
    setTyping(true);

    if (connected) {
      sendMessage(content);
    } else {
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: isRu
              ? 'Спасибо за сообщение! Чат-сервер сейчас не подключён. Когда будет настроен AI-ключ, я смогу полноценно общаться.'
              : "Thanks for your message! Chat server is not connected right now. Once the AI key is configured, I'll be fully available.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 1200);
    }
  };

  /* Callback buttons */
  const handleCallback = (callbackData: string, label: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: label,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setTyping(true);
    if (connected) sendCallback(callbackData);
  };

  const suggestions = isRu
    ? ['Как дела?', 'Расскажи историю', 'Мне грустно']
    : ['How are you?', 'Tell me a story', "I'm feeling sad"];

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)]">
      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-3 border-t-0 border-b border-[var(--color-separator)] bg-[var(--color-bg)]">
        <div className="flex items-center gap-3">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate(`/${l}/ward/home`)}
            className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-60 transition-opacity cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-[var(--color-primary)]" />
          </button>

          {/* Avatar */}
          <AlivoAvatar size={36} />

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-semibold text-[var(--color-text)] leading-tight">
              Alivo
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-quaternary)]'
                }`}
              />
              <span className="text-[13px] text-[var(--color-text-tertiary)]">
                {connected
                  ? isRu
                    ? 'онлайн'
                    : 'online'
                  : isRu
                    ? 'офлайн'
                    : 'offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty && !typing ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
            >
              <MessageCircle className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--color-text)]">
                {isRu ? 'Привет! Я Alivo' : "Hi! I'm Alivo"}
              </h2>
              <p className="text-[15px] text-[var(--color-text-tertiary)] mt-1 max-w-[260px]">
                {isRu
                  ? 'Ваш компаньон. Спросите меня о чём угодно или просто поговорим.'
                  : 'Your companion. Ask me anything or just chat.'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="px-4 py-2 rounded-full text-[15px] border border-[var(--color-separator)] text-[var(--color-primary)] active:opacity-60 transition-opacity cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}
              >
                {/* AI avatar */}
                {msg.role === 'assistant' && (
                  <div className="mt-1">
                    <AlivoAvatar size={28} />
                  </div>
                )}

                <div className="max-w-[78%]">
                  {/* Bubble */}
                  <div
                    className={`px-4 py-2.5 text-[17px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-primary)] text-white rounded-[18px] rounded-br-[6px]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text)] rounded-[18px] rounded-bl-[6px] shadow-[var(--shadow-card)]'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Callback buttons */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.buttons.map((btn) => (
                        <button
                          key={btn.callbackData}
                          type="button"
                          onClick={() => handleCallback(btn.callbackData, btn.label)}
                          className="px-3 py-1.5 rounded-full text-[13px] border border-[var(--color-separator)] text-[var(--color-primary)] active:opacity-60 transition-opacity cursor-pointer"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Time */}
                  <p
                    className={`text-[11px] mt-1 px-1 text-[var(--color-text-quaternary)] ${
                      msg.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex gap-2">
                <div className="mt-1">
                  <AlivoAvatar size={28} />
                </div>
                <div className="bg-[var(--color-surface)] rounded-[18px] rounded-bl-[6px] shadow-[var(--shadow-card)] px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 px-4 py-3 border-t border-[var(--color-separator)] bg-[var(--color-bg)]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isRu ? 'Напишите сообщение...' : 'Type a message...'}
            className="flex-1 bg-[var(--color-surface-secondary)] h-11 rounded-full text-[17px] text-[var(--color-text)] placeholder:text-[var(--color-text-quaternary)] border-0 outline-none focus:ring-2 focus:ring-[var(--color-primary)] px-5"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center active:opacity-60 transition-opacity cursor-pointer ${
              input.trim()
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-quaternary)]'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

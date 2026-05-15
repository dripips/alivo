import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, MessageCircle, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useChatSocket } from '../../hooks/useChatSocket';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  buttons?: Array<{ label: string; callbackData: string }>;
}

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

  const { connected, incoming, sendMessage, sendCallback } = useChatSocket(user?.id || null);

  useEffect(() => {
    if (incoming) {
      setTyping(false);
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: incoming.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        buttons: incoming.buttons,
      }]);
    }
  }, [incoming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;

    setMessages((prev) => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput('');
    setTyping(true);

    if (connected) {
      sendMessage(content);
    } else {
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: isRu
            ? 'Спасибо за сообщение! Чат-сервер сейчас не подключён. Когда будет настроен AI-ключ, я смогу полноценно общаться.'
            : 'Thanks for your message! Chat server is not connected right now. Once the AI key is configured, I\'ll be fully available.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      }, 1200);
    }
  };

  const handleCallback = (callbackData: string, label: string) => {
    setMessages((prev) => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: label,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setTyping(true);
    if (connected) sendCallback(callbackData);
  };

  const suggestions = isRu
    ? ['Как дела?', 'Расскажи историю', 'Мне грустно']
    : ['How are you?', 'Tell me a story', 'I\'m feeling sad'];

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/${l}/ward/home`)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-border)] transition-colors cursor-pointer shrink-0">
            <ChevronLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--color-text)]">Alivo</h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-tertiary)]'}`} />
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                {connected ? (isRu ? 'онлайн' : 'online') : (isRu ? 'офлайн' : 'offline')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty && !typing ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {isRu ? 'Привет! Я Alivo' : 'Hi! I\'m Alivo'}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-[260px]">
                {isRu ? 'Ваш компаньон. Спросите меня о чём угодно или просто поговорим.' : 'Your companion. Ask me anything or just chat.'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSend(s)} className="px-4 py-2 rounded-full text-sm border border-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors cursor-pointer">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shrink-0 mt-1">
                    <span className="text-white text-[10px] font-bold">A</span>
                  </div>
                )}
                <div className="max-w-[78%]">
                  <div className={`px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white rounded-2xl rounded-br-md'
                      : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl rounded-bl-md'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.buttons.map((btn) => (
                        <button key={btn.callbackData} onClick={() => handleCallback(btn.callbackData, btn.label)} className="px-3 py-1.5 rounded-full text-xs border border-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors cursor-pointer">
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className={`text-[11px] mt-1 px-1 text-[var(--color-text-tertiary)] ${msg.role === 'user' ? 'text-right' : ''}`}>{msg.time}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shrink-0 mt-1">
                  <span className="text-white text-[10px] font-bold">A</span>
                </div>
                <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRu ? 'Напишите сообщение...' : 'Type a message...'}
            className="flex-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-full text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 px-4 py-2.5 text-[15px]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer ${
              input.trim() ? 'bg-[var(--color-primary)] text-white shadow-md' : 'bg-[var(--color-surface)] text-[var(--color-text-tertiary)]'
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

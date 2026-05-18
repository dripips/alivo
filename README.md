<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/i18n-RU%20%7C%20EN-blue" alt="i18n" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
</p>

<h1 align="center">Alivo</h1>
<h3 align="center">AI-powered safety companion for elderly care</h3>

<p align="center">
  <a href="#-english">English</a> · <a href="#-русский">Русский</a>
</p>

---

## 🇬🇧 English

### What is Alivo?

**Alivo** is an open-source AI companion that keeps elderly and vulnerable people safe. Not a medical device or a panic button — a warm digital friend that checks in every day, reminds about medications, detects phone scams, and calls for help when needed.

For families — peace of mind. A real-time dashboard shows how your loved one is doing: mood, medication adherence, activity. Alerts only when it matters.

### Key Features

- **Daily Check-ins** — scheduled "How are you?" messages with 4-level escalation (reminder → all channels → alert family → SOS)
- **AI Companion** — conversational AI that remembers past talks, adapts tone, detects crisis language
- **Medication Reminders** — schedule-based with take/skip/snooze confirmation and adherence tracking
- **Fraud Detection** — 16 scam patterns (RU/EN), instant warning + immediate family alert
- **SOS Button** — one tap sends geolocation to all emergency contacts
- **Emergency QR Card** — scannable card with medical info, no login required (for first responders)
- **Wellness Log** — blood pressure, heart rate, sugar, weight tracking with statistics
- **Safe Walks** — "I'm going out" timer, alert if not back on time
- **Doctor Appointments** — reminders with location, doctor name, notes
- **Guardian Dashboard** — real-time ward monitoring for family members
- **Multi-channel** — Telegram, VK MAX, Web Chat (adapter pattern — add any messenger)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, Node.js 24, Prisma 6, PostgreSQL 17, Redis 7, BullMQ |
| Frontend | React 19, Vite, TailwindCSS 4, TypeScript, Zustand |
| AI | OpenAI SDK (any compatible API — Anthropic, Ollama, etc.) |
| Messengers | Telegraf (Telegram), @maxhub/max-bot-api (VK MAX), Socket.io (Web) |
| Deploy | Docker Compose, Nginx, Let's Encrypt |

### Quick Start

```bash
git clone https://github.com/dripips/alivo.git
cd alivo

# Start backend + database
cp .env.example .env          # edit: set AI_API_KEY, TELEGRAM_BOT_TOKEN
docker compose up -d
docker compose exec app npx ts-node prisma/seed.ts

# Start frontend
cd web && npm install && npm run dev
```

**Backend:** http://localhost:3100 · **Swagger:** http://localhost:3100/api/docs · **PWA:** http://localhost:5173

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@alivo.cc | demo123 |
| Guardian | maria@demo.com | demo123 |
| Ward (RU) | ivan@demo.com | demo123 |
| Ward (EN) | elena@demo.com | demo123 |

### Business Model

Open Source (MIT) + hosted SaaS at alivo.cc:

| Plan | Price | Includes |
|------|-------|----------|
| Free | $0 | 1 ward, 2 contacts, 50 AI messages/mo |
| Family | $9.99/mo | 3 wards, unlimited contacts, 500 AI/mo |
| Care | $29.99/mo | Unlimited, API access, priority support |

### License

[MIT](LICENSE)

---

## 🇷🇺 Русский

### Что такое Alivo?

**Alivo** — это AI-компаньон с открытым исходным кодом для пожилых и уязвимых людей. Не медицинский прибор и не тревожная кнопка — тёплый цифровой друг, который каждый день на связи: спрашивает как дела, напоминает про лекарства, распознаёт мошенников и зовёт на помощь если что-то случилось.

Для семьи — спокойствие. Дашборд в реальном времени показывает состояние близкого: настроение, приём лекарств, активность. Оповещение приходит только когда нужно.

### Ключевые функции

- **Ежедневные check-in** — "Как вы себя чувствуете?" с 4-уровневой эскалацией (напоминание → все каналы → алерт семье → SOS)
- **AI-компаньон** — собеседник, который помнит разговоры, адаптирует тон, замечает кризис
- **Напоминания о лекарствах** — по расписанию с подтверждением (принял/пропустил/позже) и статистикой
- **Анти-мошенничество** — 16 паттернов (RU/EN), мгновенное предупреждение + алерт ВСЕМ родным
- **SOS-кнопка** — одно нажатие отправляет геолокацию всем экстренным контактам
- **Карточка для скорой** — QR-код с медицинской информацией, без авторизации
- **Дневник здоровья** — давление, пульс, сахар, вес со статистикой
- **Безопасные прогулки** — таймер "Я выхожу", алерт если не вернулся вовремя
- **Визиты к врачу** — напоминания с адресом, врачом, заметками
- **Дашборд для родных** — мониторинг состояния подопечных в реальном времени
- **Мультиканальность** — Telegram, VK MAX, веб-чат (адаптерная архитектура)

### Стек технологий

| Слой | Технология |
|------|-----------|
| Бэкенд | NestJS 11, Node.js 24, Prisma 6, PostgreSQL 17, Redis 7, BullMQ |
| Фронтенд | React 19, Vite, TailwindCSS 4, TypeScript, Zustand |
| AI | OpenAI SDK (любой совместимый API — Anthropic, Ollama и др.) |
| Мессенджеры | Telegraf (Telegram), @maxhub/max-bot-api (VK MAX), Socket.io (веб) |
| Деплой | Docker Compose, Nginx, Let's Encrypt |

### Быстрый старт

```bash
git clone https://github.com/dripips/alivo.git
cd alivo

# Запуск бэкенда + базы данных
cp .env.example .env          # отредактируйте: AI_API_KEY, TELEGRAM_BOT_TOKEN
docker compose up -d
docker compose exec app npx ts-node prisma/seed.ts

# Запуск фронтенда
cd web && npm install && npm run dev
```

**Бэкенд:** http://localhost:3100 · **Swagger:** http://localhost:3100/api/docs · **PWA:** http://localhost:5173

### Демо-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | admin@alivo.cc | demo123 |
| Опекун | maria@demo.com | demo123 |
| Подопечный (RU) | ivan@demo.com | demo123 |
| Подопечный (EN) | elena@demo.com | demo123 |

### Бизнес-модель

Open Source (MIT) + хостинг SaaS на alivo.cc:

| План | Цена | Включено |
|------|------|----------|
| Free | 0 ₽ | 1 подопечный, 2 контакта, 50 AI-сообщений/мес |
| Family | 799 ₽/мес | 3 подопечных, безлимит контактов, 500 AI/мес |
| Care | 2 499 ₽/мес | Безлимит, API, приоритетная поддержка |

### Лицензия

[MIT](LICENSE)

---

<p align="center">
  <a href="https://bobkov.cc">bobkov.cc</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/i18n-RU%20%7C%20EN-blue" alt="i18n" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
</p>

<h1 align="center">Alivo</h1>
<h3 align="center">AI-powered safety companion for vulnerable people</h3>
<p align="center"><em>Рядом, даже когда далеко / Close, even when far away</em></p>

---

## What is this?

**Alivo** is a self-hosted AI companion that keeps vulnerable people safe — elderly living alone, people with chronic conditions, anyone who might need a helping hand.

It's not just a panic button. It's a **warm, caring friend** that:
- Checks in every day and remembers your conversations
- Reminds you to take medications on time
- Detects phone scams and **instantly alerts your family**
- Notices when you're feeling down and gently offers support
- Alerts your emergency contacts if something's wrong

Works through **Telegram**, **VK MAX**, and **Web Chat** — no app install needed.

## Key Features

### Check-in System
Scheduled check-ins with intelligent escalation:
```
08:00 — "Good morning! How are you feeling?" → [I'm fine] [So-so] [Want to talk] [Need help]
         ↓ no response
08:30 — Gentle reminder
09:00 — Reminder via ALL connected channels
10:00 — 🟡 Alert emergency contacts
12:00 — 🔴 SOS to everyone
```

### AI Companion
- Remembers past conversations, interests, family names
- Adapts tone based on who they're talking to
- Detects crisis language → supports, doesn't lecture → alerts contacts
- Knows about medical conditions, gently asks about wellbeing

### Medication Reminders
```
08:00 — "Time to take: 💊 Metformin (500mg), 💊 Aspirin (75mg). Both after food."
         [✅ Taken] [⏰ In 30 min] [⏭️ Skip]
         ↓ no response after 90 min → alert contacts
```

### Fraud Detection
When a user mentions scam patterns ("bank called", "SMS code", "safe account"):
1. AI warns the user with specific anti-fraud advice
2. **Immediately** alerts all emergency contacts
3. Logs the incident for review

### Multi-Channel Architecture
Pluggable adapter pattern — ship with Telegram + VK MAX + Web, community can add any messenger:
```
Telegram ←→ ChannelAdapter ←→ Core Engine ←→ Escalation
VK MAX   ←→ ChannelAdapter ↗
Web Chat ←→ ChannelAdapter ↗
```

### Guardian Dashboard
Real-time dashboard for family members:
- Ward status at a glance
- Mood trends (7/30 days)
- Medication adherence
- Check-in history
- Fraud alerts

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | NestJS 11 |
| Runtime | Node.js 24 |
| Database | PostgreSQL 17 |
| Queue | Redis 7 + BullMQ |
| ORM | Prisma 6 |
| Telegram | Telegraf |
| VK MAX | @maxhub/max-bot-api |
| Real-time | Socket.io |
| AI | OpenAI SDK (any compatible API) |
| i18n | nestjs-i18n (RU/EN) |
| Auth | JWT + Passport |
| Docs | Swagger / OpenAPI |
| Deploy | Docker Compose |

## Quick Start

### With Docker (recommended)

```bash
# Clone
git clone https://github.com/bobkov-cc/alivo.git
cd alivo

# Configure
cp .env.example .env
# Edit .env — set TELEGRAM_BOT_TOKEN, AI_API_KEY, etc.

# Launch
docker compose up -d

# Run migrations
docker compose exec app npx prisma migrate deploy

# Open
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

### Local Development

```bash
# Prerequisites: Node.js 22+, PostgreSQL, Redis

npm install
cp .env.example .env
# Edit .env

npx prisma generate
npx prisma migrate dev

npm run start:dev
```

## API Overview

| Endpoint | Description |
|----------|------------|
| `POST /api/auth/register` | Register (ward or guardian) |
| `POST /api/auth/login` | Login |
| `GET /api/users/me` | Current user profile |
| `POST /api/contacts` | Add emergency contact |
| `POST /api/check-ins/schedule` | Set check-in schedule |
| `GET /api/check-ins/mood` | Mood statistics |
| `PUT /api/medical/profile` | Medical profile |
| `POST /api/medical/medications` | Add medication |
| `GET /api/medical/adherence` | Medication adherence |
| `GET /api/dashboard/overview` | Guardian overview |
| `GET /api/dashboard/ward/:id` | Ward detail |

Full interactive docs at `/api/docs` (Swagger).

## Architecture

```
src/
├── modules/
│   ├── auth/                # JWT authentication
│   ├── users/               # User profiles
│   ├── contacts/            # Emergency contacts
│   ├── channels/            # Multi-messenger adapter pattern
│   │   ├── channel.interface.ts    # Universal adapter contract
│   │   ├── telegram/        # Telegram via Telegraf
│   │   ├── vk-max/          # VK MAX via official SDK
│   │   └── web/             # WebSocket chat
│   ├── check-in/            # Scheduled check-ins + escalation
│   ├── companion/           # AI conversation engine
│   │   ├── companion.service.ts    # Chat with context + medical awareness
│   │   ├── memory.service.ts       # Conversation memory
│   │   └── safety.analyzer.ts      # Crisis/concern detection
│   ├── medical/             # Health profiles + medication reminders
│   ├── fraud-detection/     # Scam pattern detection + instant alerts
│   ├── escalation/          # Multi-level notification chains
│   └── dashboard/           # Guardian real-time dashboard
├── common/
│   └── prisma/              # Database service
├── i18n/
│   ├── ru/                  # Russian translations
│   └── en/                  # English translations
└── main.ts
```

## Environment Variables

See [.env.example](.env.example) for all configuration options.

Key variables:
- `TELEGRAM_BOT_TOKEN` — Get from [@BotFather](https://t.me/BotFather)
- `MAX_BOT_TOKEN` — Get from [MAX Developer Portal](https://dev.max.ru)
- `AI_API_KEY` — OpenAI, Anthropic, or any compatible provider
- `AI_BASE_URL` — Override for custom AI endpoints (Ollama, Together.ai, etc.)

## Adding a New Channel

Implement the `ChannelAdapter` interface:

```typescript
import { ChannelAdapter, IncomingMessage, OutgoingMessage } from '../channel.interface';

export class WhatsAppAdapter implements ChannelAdapter {
  readonly type = 'WHATSAPP';
  
  async sendMessage(msg: OutgoingMessage): Promise<void> { /* ... */ }
  async sendAlert(externalUserId: string, text: string): Promise<void> { /* ... */ }
  onMessage(handler: (msg: IncomingMessage) => Promise<void>): void { /* ... */ }
  onCallback(handler: (msg: IncomingMessage) => Promise<void>): void { /* ... */ }
  async start(): Promise<void> { /* ... */ }
  async stop(): Promise<void> { /* ... */ }
}
```

Register it in `ChannelsModule` and `ChannelRouter` — done.

## License

MIT

## Contributing

PRs welcome. Please open an issue first to discuss major changes.

---

<p align="center">Built with care for those who need it most. 💙</p>

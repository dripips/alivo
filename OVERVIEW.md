# Alivo — Полное описание проекта

## Идея

**Alivo** — это AI-компаньон для пожилых и уязвимых людей. Не медицинский прибор, не тревожная кнопка, а тёплый цифровой друг, который каждый день на связи: спрашивает как дела, напоминает про лекарства, замечает когда плохо, защищает от мошенников и мгновенно зовёт на помощь если что-то случилось.

Для семьи — это спокойствие. Дашборд показывает состояние близкого человека в реальном времени: настроение, приём лекарств, активность. Оповещение приходит только когда нужно.

**Домен:** alivo.cc (от "alive" — живой)
**Автор:** [bobkov.cc](https://bobkov.cc)
**Лицензия:** MIT
**Стек:** Node.js (NestJS) + React (Vite) + PostgreSQL + Redis

---

## Проблема

Миллионы пожилых людей живут одни. Существующие решения:
- **Слишком клинические** — медицинские браслеты, которые никто не хочет носить
- **Слишком безличные** — автоматические звонки без человеческого тепла
- **Слишком дорогие** — ежемесячные подписки за базовый мониторинг
- **Слишком ограниченные** — один канал, одностороннее общение

Тем временем семьи переживают, но не имеют удобного способа следить за близкими без навязчивости.

---

## Решение

Alivo объединяет:

1. **Тепло** — AI-собеседник, который ведёт себя как заботливый друг
2. **Безопасность** — многоуровневая эскалация ловит проблемы до того, как они станут экстренными
3. **Здоровье** — напоминания о лекарствах + дневник показателей для семьи и врача
4. **Защита** — обнаружение мошенничества в реальном времени с мгновенным оповещением родных
5. **Приватность** — self-hosted, все данные на вашем сервере

---

## Две роли пользователей

### Подопечный (Ward) — пожилой человек
Простой интерфейс с крупным текстом:
- Ежедневные вопросы "Как вы себя чувствуете?"
- Напоминания о лекарствах с кнопкой "Принять"
- Дневник здоровья: давление, сахар, пульс, вес
- AI-чат: можно просто поговорить
- Безопасные прогулки с таймером
- SOS-кнопка с геолокацией
- Карточка для скорой (QR-код без авторизации)

### Опекун (Guardian) — родственник
Информационный дашборд:
- Обзор всех подопечных со статусами
- Графики настроения и приверженности лечению
- Оповещения о пропущенных check-in'ах, мошенничестве, SOS
- Управление контактами и подпиской

---

## Ключевые функции

### Check-in система
```
Расписание → "Как дела?" → Ответ → Записать настроение
                          ↓ нет ответа
                    30 мин → Мягкое напоминание
                    60 мин → Напоминание через ВСЕ каналы
                    2 часа → Оповещение родственников
                    4 часа → SOS всем контактам
```

### AI-компаньон
- Помнит предыдущие разговоры, имена внуков, любимые темы
- Адаптирует тон: с бабушкой говорит одним языком, с подростком другим
- Знает о заболеваниях, мягко спрашивает о самочувствии
- Детектирует кризисные паттерны → поддерживает → алертит контакты
- Safety layer: "не хочу жить" → поддержка + горячая линия + тихий алерт семье

### Анти-мошенничество
16 паттернов на русском и английском:
- "Звонят из банка" → мгновенное предупреждение + алерт ВСЕМ родственникам
- "Безопасный счёт", "код из СМС", "служба безопасности", "не говорите никому"
- AI объясняет почему это мошенничество и что делать

### Лекарства
- Напоминания по расписанию: "Время принять Метформин 500mg. После еды."
- Подтверждение: Принял / Через 30 мин / Пропускаю
- Если не подтвердил 90 мин → алерт семье
- Статистика приверженности лечению

### Дневник здоровья (Wellness)
- Давление (систолическое/диастолическое)
- Пульс, сахар, температура, вес
- Заметки ("Голова болит с утра")
- Статистика за 7/30 дней

### SOS
- Одно нажатие → геолокация + алерт ВСЕМ контактам
- Google Maps ссылка с координатами
- Логирование для анализа

### Безопасные прогулки
- "Я выхожу на 30 минут" → таймер
- Не вернулся вовремя → алерт с последней геолокацией
- GPS-пинг во время прогулки

### Карточка для скорой (Emergency Card)
- QR-код → открывается БЕЗ авторизации
- Имя, дата рождения, группа крови
- Заболевания, аллергии
- Текущие лекарства
- Контакты родственников
- Заметки ("Инсулин в холодильнике, 2-й ящик")

### Визиты к врачу
- Напоминания: "Завтра в 10:00 приём у Смирновой А.В., каб. 305"
- Заметки: "Взять полис, результаты анализов"

---

## Каналы связи

Адаптерная архитектура — подключается любой мессенджер:

| Канал | Статус | Библиотека |
|-------|--------|------------|
| **Telegram** | Готов | Telegraf |
| **VK MAX** | Готов | @maxhub/max-bot-api |
| **Web Chat** | Готов | Socket.io |
| WhatsApp | Планируется | — |
| Viber | Планируется | — |

Эскалация использует все каналы: если не отвечает в Telegram → пишем в MAX → если молчит → алертим контакты.

---

## Бизнес-модель: Open Source + SaaS

**Open Source (MIT)** — self-hosted, бесплатно, полный функционал. Для DevOps, организаций, клиник.

**SaaS (alivo.cc)** — хостинг для семей, которые не хотят ставить Docker:

| План | Цена | Что включено |
|------|------|-------------|
| **Free** | 0 | 1 подопечный, 2 контакта, 50 AI-сообщений/мес |
| **Family** | $9.99/мес (799 ₽) | 3 подопечных, безлимит контактов, 500 AI/мес, все функции |
| **Care** | $29.99/мес (2499 ₽) | Безлимит, API, приоритетная поддержка, свой брендинг |

Монетизация на хостинге + AI-трафике (каждый разговор с компаньоном стоит денег через OpenAI API).

Stripe интеграция: checkout, webhooks, auto-renew. Usage tracking + квоты.

---

## Технический стек

### Backend (NestJS)
```
src/
├── modules/
│   ├── auth/              JWT + Passport
│   ├── users/             Профили
│   ├── contacts/          Экстренные контакты
│   ├── channels/          Адаптеры: Telegram, VK MAX, Web
│   ├── check-in/          Расписание + BullMQ + эскалация
│   ├── companion/         AI-чат + память + safety analyzer
│   ├── medical/           Профиль, лекарства, логи приёма
│   ├── fraud-detection/   16 паттернов + мгновенный алерт
│   ├── escalation/        Цепочка оповещений
│   ├── sos/               Экстренная кнопка + геолокация
│   ├── emergency-card/    QR-карточка без авторизации
│   ├── appointments/      Визиты к врачу
│   ├── wellness/          Дневник здоровья
│   ├── walk-safety/       Безопасные прогулки
│   ├── billing/           Stripe + планы + квоты
│   ├── dashboard/         API для родственников
│   └── landing/           Лендинг /ru + /en
├── common/
│   ├── prisma/            Database service
│   └── guards/            Quota guard
└── i18n/                  RU + EN (18 JSON файлов)
```

| Компонент | Технология |
|-----------|-----------|
| Framework | NestJS 11 |
| Runtime | Node.js 24 |
| Database | PostgreSQL 17 |
| Queue | Redis 7 + BullMQ |
| ORM | Prisma 6 (19 моделей) |
| AI | OpenAI SDK (любой совместимый API) |
| Telegram | Telegraf |
| VK MAX | @maxhub/max-bot-api |
| Real-time | Socket.io |
| Auth | JWT + Passport |
| Docs | Swagger / OpenAPI |
| Deploy | Docker Compose |

### Frontend (React PWA)
```
web/
├── src/
│   ├── pages/
│   │   ├── ward/          Home, Chat, Medications, Wellness, SOS, Walk, Appointments, Profile
│   │   ├── guardian/      Dashboard, WardDetail, Alerts, Settings
│   │   └── auth/          Login, Register
│   ├── components/
│   │   ├── ui/            Card, Button, Input, Badge, Modal
│   │   └── common/        TabBar, Sidebar, LanguageSwitcher, AccessibilityPanel
│   ├── hooks/             useChatSocket, useAuth
│   ├── store/             Zustand (auth, accessibility)
│   ├── services/          API client с JWT
│   ├── i18n/              RU + EN
│   └── styles/            Apple HIG design tokens
```

| Компонент | Технология |
|-----------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Стили | TailwindCSS 4 |
| State | Zustand |
| Icons | Lucide React |
| Real-time | Socket.io Client |
| i18n | react-i18next |
| PWA | Service Worker + manifest |

### Дизайн-система
- Apple HIG iOS палитра: #007AFF (primary), #34C759 (success), #FF3B30 (danger)
- Системные шрифты: SF Pro / Inter
- Типографика: 34px titles, 17px body, 13px captions
- Grouped lists с separators (iOS Settings стиль)
- Dark/Light mode
- Accessibility: размер текста, контрастность, уменьшение анимаций

### Инфраструктура
```
deploy/
├── docker-compose.prod.yml   App + PostgreSQL + Redis + Nginx + Certbot
├── nginx.conf                Reverse proxy + SSL + WebSocket
└── setup.sh                  One-command production deploy
```

---

## База данных (19 моделей Prisma)

**Пользователи:** User, UserChannel, GuardianWard, EmergencyContact
**Check-in:** CheckInSchedule, CheckIn
**Общение:** Conversation, Message
**Медицина:** MedicalProfile, Medication, MedicationLog
**Безопасность:** FraudAlert, SosAlert, WalkSession
**Здоровье:** WellnessLog, Appointment
**Биллинг:** Plan, Subscription, UsageLog

---

## API (40+ эндпоинтов)

Полная документация: `/api/docs` (Swagger)

Ключевые группы:
- `POST /api/auth/register` | `POST /api/auth/login`
- `GET /api/users/me` | `GET /api/users/me/wards`
- `POST /api/check-ins/schedule` | `GET /api/check-ins/mood`
- `POST /api/medical/medications/:id/take` | `GET /api/medical/adherence`
- `POST /api/sos` | `GET /api/emergency-card/:token`
- `POST /api/wellness` | `GET /api/wellness/stats`
- `POST /api/walks/start` | `PATCH /api/walks/:id/end`
- `GET /api/dashboard/overview` | `GET /api/dashboard/ward/:id`
- `GET /api/billing/plans` | `POST /api/billing/subscribe`

WebSocket:
- `/chat` — AI-чат (auth, message, callback)
- `/dashboard` — real-time обновления для родственников

---

## Интернационализация

Полная поддержка RU + EN:
- Отдельные URL: `/ru/login`, `/en/ward/home`
- SEO: `hreflang`, canonical, JSON-LD schema
- Лендинг: отдельные HTML-страницы
- PWA: react-i18next с персистенцией
- Backend: nestjs-i18n (18 JSON файлов)
- Валюта: ₽ для RU, $ для EN

---

## Деплой

### Docker (разработка)
```bash
docker compose up -d
# App: localhost:3100, Swagger: localhost:3100/api/docs
```

### Production
```bash
cd deploy
DOMAIN=alivo.cc DB_PASSWORD=secret JWT_SECRET=secret AI_API_KEY=sk-... bash setup.sh
```

Автоматически: SSL (Let's Encrypt), nginx reverse proxy, PostgreSQL, Redis, seed данных.

---

## Demo-аккаунты

| Роль | Email | Пароль | Что внутри |
|------|-------|--------|-----------|
| ADMIN | admin@alivo.cc | demo123 | Управление платформой |
| GUARDIAN | maria@demo.com | demo123 | 2 подопечных, Family план |
| WARD (RU) | ivan@demo.com | demo123 | Полный профиль, 3 лекарства, 7 дней check-in'ов |
| WARD (EN) | elena@demo.com | demo123 | Пустой профиль |

Emergency card: `/api/emergency-card/ivan2024demo`

---

## Roadmap

### v1.0 ✅ Backend
- 19 моделей, 40+ API, 17 модулей
- Telegram + VK MAX + WebSocket
- AI Companion + Safety + Fraud Detection
- Docker deploy

### v1.1 ✅ PWA
- React + Vite + TailwindCSS
- Ward + Guardian интерфейсы
- WebSocket чат
- PWA: installable, offline

### v1.2 ✅ Design System
- Apple HIG дизайн-система
- Все страницы переверстаны
- Accessibility (размер, контраст, motion)

### v2.0 (планируется)
- Figma макет → pixel-perfect вёрстка
- Telegram-бот подключение
- React Native мобильное приложение
- AI mood trend analysis
- Push notifications
- Multi-tenant для организаций

---

## Философия

1. **Тепло важнее эффективности** — AI должен чувствоваться как друг, а не система
2. **Невидим когда всё хорошо** — не перегружать, быть рядом когда нужно
3. **Эскалация, а не паника** — постепенные, взвешенные ответы
4. **Приватность по умолчанию** — self-hosted, данные не покидают сервер
5. **Универсальный доступ** — работает через Telegram (без установки), мультиязычность

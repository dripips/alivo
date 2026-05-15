# Alivo — Product Vision

## Problem

Millions of vulnerable people — elderly living alone, those with chronic conditions, people in isolation — lack a reliable safety net. Existing solutions are either:
- **Too clinical** (medical alert devices nobody wants to wear)
- **Too impersonal** (automated calls with no human warmth)
- **Too expensive** (monthly subscriptions for basic monitoring)
- **Too limited** (single-channel, one-way communication)

Meanwhile, their families worry constantly but have no easy way to stay informed without being intrusive.

## Solution

**Alivo** is a self-hosted AI companion that combines:

1. **Warmth** — A conversational AI that feels like a caring friend, not a medical device
2. **Safety** — Multi-level escalation that catches problems before they become emergencies
3. **Health** — Medication reminders with adherence tracking for families
4. **Protection** — Real-time fraud detection that shields vulnerable people from scams
5. **Privacy** — Self-hosted, all data stays on your server, zero vendor lock-in

## Target Users

### Primary: Ward (подопечный)
- Elderly living alone
- People with chronic conditions requiring medication
- Anyone who might be vulnerable to scams or health emergencies
- People recovering from surgery or illness

### Secondary: Guardian (опекун)
- Adult children monitoring elderly parents
- Caregivers managing multiple patients
- Family members who live far away

## Core Flows

### Daily Check-in
```
Schedule → Send greeting → Wait for response → Escalate if no answer
```

### AI Companion
```
User writes → Fraud check → Safety check → AI responds with context → Log mood
```

### Medication Cycle
```
Schedule → Remind → Confirm/Snooze/Skip → Alert contacts if missed
```

### Fraud Detection
```
User mentions scam patterns → Warn user → IMMEDIATELY alert all contacts
```

## Competitive Landscape

| Feature | Alivo | Medical Alert | Smart Speaker | Phone Calls |
|---------|---------|---------------|---------------|-------------|
| AI Conversation | ✅ | ❌ | Limited | ❌ |
| Fraud Detection | ✅ | ❌ | ❌ | ❌ |
| Medication Reminders | ✅ | ❌ | ❌ | ❌ |
| Multi-channel | ✅ | ❌ | ❌ | ❌ |
| Self-hosted | ✅ | ❌ | ❌ | N/A |
| Free & Open Source | ✅ | ❌ | ❌ | N/A |
| Family Dashboard | ✅ | Basic | ❌ | ❌ |
| Privacy-first | ✅ | ❌ | ❌ | ✅ |

## Roadmap

### v1.0 — Foundation (current)
- [x] Check-in system with escalation
- [x] AI companion with safety analysis
- [x] Medication reminders
- [x] Fraud detection with instant alerts
- [x] Telegram + VK MAX + Web adapters
- [x] Guardian dashboard API
- [x] i18n (RU/EN)
- [x] Docker deployment

### v1.1 — Polish
- [ ] Guardian web dashboard UI (React/Vue)
- [ ] Voice message support (STT/TTS)
- [ ] Weather-aware health tips
- [ ] Onboarding wizard for Telegram bot

### v1.2 — Integrations
- [ ] WhatsApp adapter
- [ ] Viber adapter
- [ ] SMS fallback (Twilio)
- [ ] Push notifications (PWA)

### v2.0 — Intelligence
- [ ] AI mood trend analysis with alerts
- [ ] Conversation summarization for guardians
- [ ] Predictive health insights
- [ ] Multi-tenant mode for care organizations
- [ ] Mobile app (React Native)

## Metrics That Matter

- **Response rate** — % of check-ins answered
- **Medication adherence** — % of meds confirmed taken
- **Fraud alerts** — scam attempts detected & blocked
- **Time to response** — average time from check-in to response
- **Escalation rate** — % of check-ins that reach contact alert level
- **Mood trend** — 7-day rolling average mood score

## Philosophy

1. **Warmth over efficiency** — The AI should feel like a friend, not a system
2. **Invisible when everything's fine** — Don't overwhelm, be there when needed
3. **Escalate, don't panic** — Gradual, measured responses to missed check-ins
4. **Privacy by design** — Self-hosted, no data leaves your server
5. **Universal access** — Works via Telegram (no app install), multi-language

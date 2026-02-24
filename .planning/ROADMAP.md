# ROADMAP

### Phase 1: telegram-bot-foundation

**Goal:** Поднять рабочий backend-скелет Telegram-бота на NestJS с long polling, SQLite/Prisma persistence, интеграцией OpenAI `gpt-4.1-mini`, памятью последних 20 сообщений и системным `GET /health`.

**Requirements:** [P1-REQ-01, P1-REQ-02, P1-REQ-03, P1-REQ-04, P1-REQ-05]

**Plans:** 3 plans

Plans:
- [x] 01-telegram-bot-foundation-01-PLAN.md — Базовая инициализация NestJS + Prisma SQLite + health-check
- [x] 01-telegram-bot-foundation-02-PLAN.md — Telegram long polling + сохранение sessions/messages/plans
- [x] 01-telegram-bot-foundation-03-PLAN.md — OpenAI ответы с памятью 20 сообщений + интеграционные проверки

---
phase: 01-telegram-bot-foundation
plan: 02
type: execute
wave: 2
depends_on:
  - 01-telegram-bot-foundation-01
files_modified:
  - package.json
  - src/telegram/telegram.module.ts
  - src/telegram/telegram.service.ts
  - src/persistence/persistence.module.ts
  - src/persistence/persistence.service.ts
  - src/prisma/prisma.module.ts
  - src/prisma/prisma.service.ts
autonomous: true
requirements:
  - P1-REQ-02
  - P1-REQ-03
must_haves:
  truths:
    - "Бот получает входящие сообщения через long polling"
    - "Входящие сообщения и сессии сохраняются в SQLite"
    - "Сущность plan создается/обновляется в контексте диалога"
  artifacts:
    - path: "src/telegram/telegram.service.ts"
      provides: "Long polling обработчик Telegram updates"
    - path: "src/persistence/persistence.service.ts"
      provides: "CRUD-операции для Session/Message/Plan"
  key_links:
    - from: "src/telegram/telegram.service.ts"
      to: "src/persistence/persistence.service.ts"
      via: "save incoming message"
      pattern: "persistenceService\\.(create|save).*Message"
    - from: "src/telegram/telegram.module.ts"
      to: "NestJS app"
      via: "module import"
      pattern: "imports:\\s*\\[.*TelegramModule"
---

<objective>
Добавить транспортный слой Telegram long polling и persistence-слой, чтобы все ключевые события диалога фиксировались в базе.

Purpose: Обеспечить надежный сбор входящих данных перед генерацией ответов LLM.
Output: Рабочий polling-loop и запись `sessions/messages/plans` в SQLite.
</objective>

<execution_context>
@C:/Users/Kerry/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/Kerry/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-telegram-bot-foundation/01-CONTEXT.md
@.planning/phases/01-telegram-bot-foundation/01-telegram-bot-foundation-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Реализовать Telegram long polling модуль</name>
  <files>src/telegram/telegram.module.ts, src/telegram/telegram.service.ts, package.json</files>
  <action>Подключить Telegram Bot API клиент с long polling режимом (только локальная разработка, без webhook). Организовать lifecycle: старт polling при запуске приложения, graceful stop при shutdown. Обработать текстовые сообщения как входной поток.</action>
  <verify>
    <automated>npm run build && npm run test -- telegram</automated>
    <manual>Отправить тестовое сообщение боту и проверить, что update получен без падения процесса.</manual>
    <sampling_rate>после завершения Task 1</sampling_rate>
  </verify>
  <done>Бот стабильно получает update-события через long polling.</done>
</task>

<task type="auto">
  <name>Task 2: Добавить persistence service для sessions/messages/plans</name>
  <files>src/persistence/persistence.module.ts, src/persistence/persistence.service.ts, src/prisma/prisma.module.ts, src/prisma/prisma.service.ts</files>
  <action>Реализовать сервис, который upsert-ит `Session`, сохраняет каждое входящее `Message` и ведет актуальный `Plan` по chat/session. Сервис должен вызываться из Telegram-обработчика синхронно в рамках одного update-flow, чтобы исключить потерю данных при сбоях.</action>
  <verify>
    <automated>npm run test -- persistence && npx prisma studio --browser none --port 5555</automated>
    <manual>Проверить в SQLite наличие записей в таблицах Session, Message, Plan после входящего сообщения.</manual>
    <sampling_rate>после завершения Task 2</sampling_rate>
  </verify>
  <done>После входящего сообщения появляются корректные записи в `sessions/messages/plans`.</done>
</task>

</tasks>

<verification>
- Unit/integration тесты telegram + persistence проходят.
- Для одного chat id формируется одна активная session и соответствующие message записи.
- Отсутствуют unhandled promise rejection в логах на потоке polling.
</verification>

<success_criteria>
- Telegram long polling работает локально end-to-end.
- Данные диалога надежно сохраняются в SQLite.
- Foundation готова к подключению OpenAI-ответов.
</success_criteria>

<risks>
- Риск: превышение Telegram API rate limits при неаккуратном retry. Митигация: экспоненциальный backoff и throttle логики polling.
- Риск: дубли сообщений при reconnect. Митигация: идемпотентность записи по внешнему message/update id.
</risks>

<output>
After completion, create `.planning/phases/01-telegram-bot-foundation/01-telegram-bot-foundation-02-SUMMARY.md`
</output>

---
phase: 01-telegram-bot-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/main.ts
  - src/app.module.ts
  - src/health/health.controller.ts
  - prisma/schema.prisma
  - prisma/migrations/*
autonomous: true
requirements:
  - P1-REQ-01
  - P1-REQ-02
must_haves:
  truths:
    - "Сервис стартует локально без runtime ошибок"
    - "Запрос GET /health возвращает 200 и status=ok"
    - "SQLite схема включает сущности sessions/messages/plans"
  artifacts:
    - path: "src/health/health.controller.ts"
      provides: "Health-check endpoint"
    - path: "prisma/schema.prisma"
      provides: "Модели Session/Message/Plan"
  key_links:
    - from: "src/app.module.ts"
      to: "src/health/health.controller.ts"
      via: "module registration"
      pattern: "controllers:\\s*\\[.*HealthController"
    - from: "prisma/schema.prisma"
      to: "SQLite database file"
      via: "datasource db"
      pattern: "provider\\s*=\\s*\"sqlite\""
---

<objective>
Подготовить фундамент приложения: рабочий NestJS runtime, health endpoint и корректная Prisma SQLite схема для дальнейшей интеграции Telegram и OpenAI.

Purpose: Убрать инфраструктурные риски до бизнес-логики.
Output: Стартующий сервис, `GET /health`, миграция базы с моделями `sessions/messages/plans`.
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
</context>

<tasks>

<task type="auto">
  <name>Task 1: Инициализировать NestJS каркас и health endpoint</name>
  <files>package.json, src/main.ts, src/app.module.ts, src/health/health.controller.ts</files>
  <action>Создать/обновить NestJS приложение с модулем health. Реализовать `GET /health` с JSON-ответом `{ "status": "ok" }`. Не добавлять webhook-маршруты и внешние интеграции на этом шаге, чтобы сохранить узкий и проверяемый скоуп.</action>
  <verify>
    <automated>npm run build && npm run start -- --port 3000 &amp; npx wait-on http://localhost:3000/health &amp;&amp; curl -f http://localhost:3000/health</automated>
    <manual>Проверить, что ответ содержит `status: ok`.</manual>
    <sampling_rate>после завершения Task 1</sampling_rate>
  </verify>
  <done>Сервис поднимается локально, endpoint `/health` стабильно отвечает HTTP 200.</done>
</task>

<task type="auto">
  <name>Task 2: Подключить Prisma SQLite и базовые модели</name>
  <files>prisma/schema.prisma, prisma/migrations/*</files>
  <action>Настроить Prisma datasource на SQLite и добавить модели `Session`, `Message`, `Plan` с минимально достаточными полями (id, timestamps, внешние ключи связи). Прогнать миграцию и убедиться, что база создается локально.</action>
  <verify>
    <automated>npx prisma validate && npx prisma migrate dev --name init_phase1 && npx prisma generate</automated>
    <manual>Проверить, что файл SQLite создан и миграция применена без ошибок.</manual>
    <sampling_rate>после завершения Task 2</sampling_rate>
  </verify>
  <done>Схема валидна, миграции применены, модели соответствуют `sessions/messages/plans`.</done>
</task>

</tasks>

<verification>
- `npm run build` проходит без ошибок.
- `curl -f http://localhost:3000/health` возвращает 200.
- `npx prisma migrate status` показывает актуальное состояние схемы.
</verification>

<success_criteria>
- Приложение стартует локально.
- `GET /health` готов для внешнего мониторинга.
- База инициализирована и готова для хранения сессий/сообщений/планов.
</success_criteria>

<risks>
- Риск: конфликт версий NestJS/Prisma в fresh setup. Митигация: зафиксировать совместимые версии в `package.json` и сразу прогнать `npm run build`.
- Риск: нестабильность команды запуска в Windows shell. Митигация: добавить кросс-платформенный npm script для локального запуска.
</risks>

<output>
After completion, create `.planning/phases/01-telegram-bot-foundation/01-telegram-bot-foundation-01-SUMMARY.md`
</output>

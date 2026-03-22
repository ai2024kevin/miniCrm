---
phase: 01-telegram-bot-foundation
plan: 03
type: execute
wave: 3
depends_on:
  - 01-telegram-bot-foundation-01
  - 01-telegram-bot-foundation-02
files_modified:
  - src/ai/ai.module.ts
  - src/ai/ai.service.ts
  - src/chat/chat-orchestrator.service.ts
  - src/telegram/telegram.service.ts
  - test/chat-memory.e2e-spec.ts
  - test/health.e2e-spec.ts
autonomous: true
requirements:
  - P1-REQ-04
  - P1-REQ-05
must_haves:
  truths:
    - "Пользователь получает ответ от модели gpt-4.1-mini в Telegram"
    - "При генерации учитываются только последние 20 сообщений контекста"
    - "Ключевые сценарии (health, message flow) покрыты автопроверками"
  artifacts:
    - path: "src/ai/ai.service.ts"
      provides: "OpenAI клиент и вызов модели gpt-4.1-mini"
    - path: "src/chat/chat-orchestrator.service.ts"
      provides: "Сбор 20 сообщений и orchestration ответа"
    - path: "test/chat-memory.e2e-spec.ts"
      provides: "Проверка ограничения окна памяти"
  key_links:
    - from: "src/chat/chat-orchestrator.service.ts"
      to: "src/ai/ai.service.ts"
      via: "generate reply call"
      pattern: "aiService\\.(generate|create).*response"
    - from: "src/telegram/telegram.service.ts"
      to: "src/chat/chat-orchestrator.service.ts"
      via: "incoming update handling"
      pattern: "chatOrchestrator\\.(handle|process)"
---

<objective>
Завершить MVP-цепочку ответа: входящее Telegram сообщение -> контекст из БД (20 сообщений) -> генерация через OpenAI `gpt-4.1-mini` -> отправка ответа пользователю.

Purpose: Получить минимально полезный conversational backend в рамках фазы 1.
Output: AI модуль, orchestration сервис, e2e-проверки стабильности и контекстного окна.
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
@.planning/phases/01-telegram-bot-foundation/01-telegram-bot-foundation-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Интегрировать OpenAI gpt-4.1-mini в AI service</name>
  <files>src/ai/ai.module.ts, src/ai/ai.service.ts</files>
  <action>Реализовать AI service с вызовом строго модели `gpt-4.1-mini` (по зафиксированному решению). Вынести API key/параметры в env-конфиг. Добавить обработку ошибок OpenAI API с fallback-сообщением для пользователя, чтобы polling loop не ломался.</action>
  <verify>
    <automated>npm run test -- ai</automated>
    <manual>Проверить, что при ошибке OpenAI приложение не падает и возвращает безопасный fallback-ответ.</manual>
    <sampling_rate>после завершения Task 1</sampling_rate>
  </verify>
  <done>AI service стабильно вызывает `gpt-4.1-mini` и обрабатывает ошибки внешнего API.</done>
</task>

<task type="auto">
  <name>Task 2: Реализовать chat orchestrator с memory window 20</name>
  <files>src/chat/chat-orchestrator.service.ts, src/telegram/telegram.service.ts</files>
  <action>Добавить orchestration слой: для каждого входящего сообщения извлекать из БД последние 20 сообщений текущей сессии, формировать prompt-контекст, вызывать AI service и отправлять ответ через Telegram API. Не использовать более 20 сообщений в контексте, чтобы контролировать стоимость и латентность.</action>
  <verify>
    <automated>npm run test -- chat-orchestrator</automated>
    <manual>Проверить по логам/spy, что в OpenAI отправляется не более 20 исторических сообщений + текущее.</manual>
    <sampling_rate>после завершения Task 2</sampling_rate>
  </verify>
  <done>Полная цепочка update->context->LLM->reply работает, ограничение 20 сообщений соблюдается.</done>
</task>

<task type="auto">
  <name>Task 3: Добавить e2e проверки health и chat-memory</name>
  <files>test/health.e2e-spec.ts, test/chat-memory.e2e-spec.ts</files>
  <action>Создать e2e-тесты: (1) `GET /health` возвращает 200 и `status=ok`; (2) chat flow использует окно памяти ровно последних 20 сообщений; (3) Telegram inbound event приводит к попытке ответа. При необходимости замокать внешние API (Telegram/OpenAI) для стабильности CI.</action>
  <verify>
    <automated>npm run test:e2e</automated>
    <manual>Убедиться, что тесты детерминированы и не требуют внешней сети.</manual>
    <sampling_rate>после завершения Task 3</sampling_rate>
  </verify>
  <done>Ключевые сценарии фазы 1 покрыты автоматическими e2e-тестами.</done>
</task>

</tasks>

<verification>
- `npm run test` и `npm run test:e2e` проходят локально.
- Ограничение памяти (20 сообщений) подтверждено тестом.
- `/health` остается стабильным после подключения AI и Telegram слоев.
</verification>

<success_criteria>
- Бот отвечает через OpenAI `gpt-4.1-mini` в Telegram.
- Контекст ответа ограничен последними 20 сообщениями.
- Фаза 1 имеет автоматизированные проверки на критические пути.
</success_criteria>

<risks>
- Риск: таймауты OpenAI увеличивают задержку ответа. Митигация: таймаут клиента + fallback-ответ + логирование причин.
- Риск: рост токенов при ошибочном расширении контекста. Митигация: жесткий срез на уровне orchestrator и тест на upper bound.
- Риск: flaky e2e из-за реальных внешних API. Митигация: стабильные моки в тестах и отделение smoke от full integration.
</risks>

<output>
After completion, create `.planning/phases/01-telegram-bot-foundation/01-telegram-bot-foundation-03-SUMMARY.md`
</output>

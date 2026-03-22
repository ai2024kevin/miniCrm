# Phase 1 Context

## Decisions
- Использовать NestJS как backend framework.
- Использовать Telegram long polling для локальной разработки.
- Использовать SQLite через Prisma.
- Хранить `sessions`, `messages`, `plans`.
- Использовать OpenAI модель `gpt-4.1-mini`.
- Использовать память чата: последние 20 сообщений.
- Реализовать health-check `GET /health`.

## Deferred Ideas
- Переключение на webhook deployment.
- Расширенная аналитика и мониторинг.
- Ролевая модель и сложная авторизация.

## Claude's Discretion
- Конкретная модульная структура NestJS.
- Стратегия Prisma миграций для локального окружения.
- Формат логирования и обработка ошибок в сервисах.

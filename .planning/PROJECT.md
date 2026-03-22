# PROJECT

## Цель
Собрать базовый Telegram-бот сервис на NestJS для локальной разработки: long polling, хранение диалоговых данных в SQLite через Prisma, ответ через OpenAI `gpt-4.1-mini`, плюс системный health-check.

## Зафиксированные решения
- Backend framework: NestJS
- Telegram transport: long polling (локальная разработка)
- Database: SQLite + Prisma
- Persistence scope: `sessions`, `messages`, `plans`
- LLM model: `gpt-4.1-mini`
- Chat memory window: последние 20 сообщений
- Health endpoint: `GET /health`

## Ограничения
- Без смены технологического стека в фазе 1
- Без webhook-инфраструктуры в фазе 1

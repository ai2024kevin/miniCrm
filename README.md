# MiniCRM

Минималистичная CRM-система с backend на NestJS и frontend на React/Vite. Проект предназначен для управления клиентами, сделками и задачами, а также для экспорта отчётов в Google Sheets. Приложение подготовлено для локального запуска, Docker-развёртывания и последующего деплоя через Dokploy.

## Возможности

- авторизация по `CRM_LOGIN` / `CRM_PASSWORD` с bearer token для API;
- управление клиентами, сделками и задачами;
- overview-экран с агрегатами и динамикой за последние 30 дней;
- страница Google Settings для настройки интеграции с Google;
- экспорт отчётов по клиентам, сделкам и задачам в Google Sheets;
- file-based storage без внешней СУБД;
- Docker-стек для backend и frontend;
- e2e- и frontend-тесты для основных сценариев.

## Стек

### Backend
- NestJS 11
- TypeScript
- `googleapis`
- file-based JSON storage

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Vitest + Testing Library

### Infrastructure
- Docker
- Docker Compose
- Dokploy-friendly структура

## Структура проекта

```text
.
├─ src/                     # backend: auth, clients, deals, tasks, reports, google-settings, storage
├─ test/                    # backend e2e tests
├─ frontend/                # React/Vite frontend
├─ JSON_design_systems/     # design tokens
├─ Dockerfile               # backend image
├─ frontend/Dockerfile      # frontend image
├─ docker-compose.yml       # локальный и server-friendly compose
└─ .env.example             # безопасный шаблон переменных окружения
```

## Бизнес-сущности

### Clients
Клиенты с базовой контактной информацией, компанией, статусом и комментарием.

### Deals
Сделки, привязанные к клиентам, со стадией, суммой, комментарием и датой закрытия.

### Tasks
Задачи, которые могут быть связаны с клиентом и/или сделкой, со статусом, дедлайном и описанием.

## Аутентификация

Backend использует переменные окружения:

- `CRM_LOGIN`
- `CRM_PASSWORD`
- `CRM_AUTH_TOKEN`

Логин и пароль используются для входа в интерфейс. После авторизации frontend работает с backend через bearer token.

## Переменные окружения

Создай локальный `.env` на основе `.env.example`.

Пример:

```env
CRM_LOGIN="your-login"
CRM_PASSWORD="your-strong-password"
CRM_AUTH_TOKEN="your-random-token"
```

Важно:
- `.env` не должен попадать в git;
- боевые значения задаются только локально или в панели Dokploy;
- `docker-compose.yml` намеренно требует эти переменные и не содержит безопасностно-плохих fallback-секретов.

## Локальный запуск без Docker

### Backend

```bash
npm install
npm run build
npm run test:e2e
npm run start:dev
```

Backend по умолчанию работает на `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run test
npm run dev
```

Frontend dev server поднимается через Vite.

## Локальный запуск через Docker Compose

Перед запуском экспортируй переменные окружения или положи их в `.env` рядом с `docker-compose.yml`.

```bash
docker compose up --build
```

Сервисы:
- backend: `http://localhost:8000`
- frontend: `http://localhost:4173`

Хранилище данных backend вынесено в Docker volume `backend_data`, поэтому данные сохраняются между redeploy.

## Данные

Приложение использует JSON storage файл:

```text
/app/data/crm-store.json
```

В Docker этот путь смонтирован в persistent volume. Это важно для деплоя: redeploy контейнера не должен уничтожать CRM-данные.

## Google интеграция

В проекте поддерживается настройка Google Sheets/Drive через экран **Google Settings**.

Поддерживаются сценарии:
- запись отчётов в листы существующей таблицы (`spreadsheet_id`);
- создание отдельных таблиц в папке Google Drive (`folder_id`);
- OAuth flow через загруженный client secret JSON.

Чувствительные Google-данные не должны храниться в git и должны задаваться только в рабочем runtime.

## Тесты

### Backend e2e

```bash
npm run test:e2e
```

### Frontend

```bash
cd frontend
npm run test
```

## Production / Dokploy

Рекомендуемая схема для Dokploy:

1. Подключить GitHub-репозиторий к Dokploy.
2. Настроить deployment через `docker-compose.yml`.
3. В Dokploy задать environment variables:
   - `CRM_LOGIN`
   - `CRM_PASSWORD`
   - `CRM_AUTH_TOKEN`
4. Сохранить persistent volume для backend data.
5. После этого выполнять redeploy из Dokploy или через webhook из GitHub.

### Почему это важно

Секреты не должны находиться в репозитории. Репозиторий содержит только безопасный шаблон `.env.example`, а реальные значения должны храниться в Dokploy.

## Безопасность

- не коммить `.env`;
- не коммить client secret JSON и OAuth tokens;
- не использовать дефолтные production-секреты;
- хранить реальные credentials только в серверном окружении.

## Состояние проекта

Проект очищен до CRM-only состава:
- удалены legacy-модули Prisma / Telegram / AI / chat / persistence;
- оставлены только CRM backend, frontend, Docker и Google reports flow.

## Лицензия

Внутренний проект / учебно-прикладной deployment workflow.

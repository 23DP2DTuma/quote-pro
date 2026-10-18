# QuotePro — прототип улучшенного Quote Writer

Два улучшения относительно https://quote.sharpify.io/app/:

1. **Быстрый старт.** Одно поле (текст или голос) вместо анкеты на 10 полей. AI сам определяет отрасль, регион, валюту, НДС и язык. Контакты спрашиваются только при отправке сметы.
2. **Смета доходит до сделки.** Ссылка для клиента: он выбирает опции, принимает смету или задаёт вопрос. Мастер видит статусы и получает уведомления; молчащему клиенту уходят напоминания (n8n).

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
```

Без `.env` приложение работает в **демо-режиме**: смета генерируется в браузере, данные хранятся в localStorage.
Чтобы подключить n8n, скопируйте `.env.example` в `.env` и укажите `VITE_N8N_URL`.

## Структура

```
src/
  lib/quote.js          формат сметы, расчёт итогов, тексты на ru/lv/en
  lib/api.js            все запросы (демо или n8n)
  lib/mockGenerator.js  демо-генератор (в боевом режиме не нужен)
  components/
    StartScreen.jsx     одно поле + голосовой ввод
    DetectedBar.jsx     плашка «что AI угадал»
    QuoteDocument.jsx   смета (мастер редактирует / клиент выбирает опции)
    SendDialog.jsx      контакты + ссылка для клиента
  pages/
    MasterPage.jsx      экран мастера + «Мои сметы» со статусами
    ClientPage.jsx      страница клиента /q/:id
```

## Webhook'и n8n

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| POST | `/generate-quote` | `{ text }` | объект сметы (формат в `src/lib/quote.js`) |
| POST | `/save-quote` | `{ quote, business, client }` | `{ id }` |
| GET | `/get-quote?id=` | — | `{ quote, business, client, status }` |
| POST | `/quote-event` | `{ id, type, payload }` | `{ ok: true }` |

`type`: `opened` · `accepted` (payload: name, options, total) · `question` (payload: name, text).

## Деплой

Vercel: импортировать репозиторий, переменная `VITE_N8N_URL`. `vercel.json` уже настроен для ссылок `/q/:id`.

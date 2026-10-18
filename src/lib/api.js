/*
  СЛОЙ API — единственное место, где фронтенд общается с внешним миром.

  Если в .env задан VITE_N8N_URL → запросы идут в n8n (боевой режим).
  Если нет → всё работает локально в браузере (демо-режим).

  Webhook'и n8n, которые нужно будет создать:
    POST {N8N}/generate-quote   { text }                       → объект сметы
    POST {N8N}/save-quote       { quote, business, client }    → { id }
    GET  {N8N}/get-quote?id=... →                                { quote, business, client, status }
    GET  {N8N}/list-quotes      →                                { quotes: [...] }
    POST {N8N}/translate-quote  { quote, language }            → переведённая смета
*/
import { generateMock } from './mockGenerator'

const N8N = import.meta.env.VITE_N8N_URL?.replace(/\/$/, '')
export const isDemo = !N8N

async function call(path, body) {
  const res = await fetch(`${N8N}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`n8n ${path}: ${res.status}`)
  return res.json()
}

// localStorage с защитой (в приватном режиме может не работать)
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } },
  set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ } },
}

export async function generateQuote(text) {
  if (isDemo) {
    await new Promise((r) => setTimeout(r, 1200)) // имитация работы AI
    return generateMock(text)
  }
  return call('generate-quote', { text })
}

export async function saveQuote(quote, business, client) {
  if (isDemo) {
    const id = Math.random().toString(36).slice(2, 8)
    store.set(`q_${id}`, { quote, business, client, sentAt: Date.now() })
    return { id }
  }
  // appUrl — чтобы n8n мог вставить ссылку на смету в сообщение Telegram
  return call('save-quote', { quote, business, client, appUrl: window.location.origin })
}

export async function getQuote(id) {
  if (isDemo) return store.get(`q_${id}`)
  const data = await call(`get-quote?id=${encodeURIComponent(id)}`)
  return data && data.quote ? data : null // n8n отвечает { notFound: true }, если сметы нет
}

// Перевод готовой сметы на другой язык (RU / LV / EN).
// Демо: меняются только подписи. С n8n: AI переводит все строки, цены не трогает.
export async function translateQuote(quote, language) {
  if (isDemo) return { ...quote, detected: { ...quote.detected, language } }
  return call('translate-quote', { quote, language })
}

// Список отправленных смет со статусами: в демо — из браузера, с n8n — webhook list-quotes
export async function listQuotes() {
  if (!isDemo) {
    const data = await call('list-quotes')
    return data.quotes || []
  }
  const out = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k.startsWith('q_')) out.push({ id: k.slice(2), ...store.get(k) })
    }
  } catch { /* ignore */ }
  return out.sort((a, b) => b.sentAt - a.sentAt)
}

// Профиль мастера (то, что раньше требовала анкета) — запоминаем после первого раза
export const business = {
  load: () => store.get('business'),
  save: (b) => store.set('business', b),
}

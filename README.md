# QuotePro — a faster Quote Writer

**Live demo:** https://quote-pro-delta.vercel.app/

---

## Try it in 1 minute

1. Open the live demo and click one of the example jobs (or type your own, e.g. *"Bathroom 6 m² in Riga, new tiles, wall-hung WC"*). You can also press 🎤 and speak (Chrome / Edge).
2. Click **Make quote**. In ~10 seconds you get materials, labour, VAT, payment stages and terms.
3. Optional: click any line to edit it, or open **Detected → edit** to change the region (VAT updates) or the language (the whole quote is translated).
4. Click **Send to client**, enter your company name and phone, and click **Get link**.
5. Open the link **on your phone**, as the client would: tick an optional extra, watch the total update, and tap **Accept via WhatsApp**.

---

## What is better than the original

| Original form | QuotePro |
|---|---|
| ~10 fields before you see anything | **One field** (text or voice). AI detects trade, country, currency, VAT and language |
| Contact details asked first | Asked only when sending, when the contractor already sees the value |
| Quote ends as a PDF | **Client link**: the client picks extras, sees the total update live, accepts via WhatsApp with extras and total pre-filled |
| — | **AI suggests items, the app does the math**, so totals and VAT are always correct; every line is editable |
| One language per quote | **One-click translation** EN / LV / RU, prices and quantities untouched |

---

## How it works

```
React app (Vercel)                      n8n cloud
──────────────────                      ─────────
Describe the job ── generate-quote ───► OpenAI → validate → quote JSON
Change language ─── translate-quote ──► OpenAI translates text only
Get link ────────── save-quote ───────► store quote → returns id → /q/{id}
Client opens link ─ get-quote ────────► returns the stored quote
My quotes ───────── list-quotes ──────► list of sent quotes
```

- **Frontend:** React 19 + Vite, React Router, plain CSS. All network calls live in `src/lib/api.js`.
- **Backend:** n8n cloud webhooks. The OpenAI key is stored in n8n credentials, never in the browser.
- **Storage (prototype):** quotes are kept in n8n workflow static data; the contractor's profile is kept in the browser (localStorage).

### Project structure

```
src/
  pages/
    MasterPage.jsx      contractor screen: describe → quote → send, "My quotes"
    ClientPage.jsx      client screen /q/:id: extras, live total, Accept via WhatsApp
  components/
    StartScreen.jsx     one input + voice
    DetectedBar.jsx     what AI detected (region, VAT, language) + translation
    QuoteDocument.jsx   the quote itself (editable for contractor, selectable for client)
    SendDialog.jsx      contact details with validation → client link
  lib/
    api.js              every request to n8n (demo mode without it)
    quote.js            quote format, totals(), money(), labels in EN / LV / RU
    mockGenerator.js    offline demo generator (used when n8n is not configured)
```

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Without configuration the app runs in **demo mode**: quotes are generated in the browser and stored in localStorage.

To use n8n, create `.env`:

```
VITE_N8N_URL=https://YOUR-ACCOUNT.app.n8n.cloud/webhook
```

### n8n setup

1. Import both files from the `n8n/` folder (**Create workflow → … → Import from File**).
2. In the **OpenAI** and **OpenAI translate** nodes, select an OpenAI credential.
3. Activate (publish) both workflows. Production URLs (`/webhook/...`) are required: n8n saves static data only for production runs.

### Deploy

Import the repository into Vercel (framework preset: Vite) and add the environment variable `VITE_N8N_URL`. `vercel.json` routes all paths to `index.html`, so client links `/q/{id}` work.

---

## Limitations and next steps

This is a one-day prototype. Next steps:

- Notifications for the contractor when a quote is opened or accepted, and automatic follow-ups for clients who go silent (n8n schedule + Telegram / WhatsApp Business).
- The contractor's own price list instead of AI-suggested prices.
- A real database (Postgres / n8n Data Tables) and contractor login. Static data is fine for a demo, but it has no auth and no concurrency guarantees.

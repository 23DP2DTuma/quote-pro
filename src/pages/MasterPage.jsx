import { useEffect, useState } from 'react'
import StartScreen from '../components/StartScreen'
import DetectedBar from '../components/DetectedBar'
import QuoteDocument from '../components/QuoteDocument'
import SendDialog from '../components/SendDialog'
import { generateQuote, translateQuote, listQuotes, business } from '../lib/api'
import { money, totals, detectLanguage } from '../lib/quote'

// Экран мастера: описал → смета → отправил → видит статусы
export default function MasterPage() {
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [sent, setSent] = useState([])

  // Загружаем список при открытии и обновляем, когда вы возвращаетесь на вкладку.
  // listQuotes асинхронная (с n8n это запрос в интернет), поэтому .then(setSent)
  useEffect(() => {
    const refresh = () => listQuotes().then(setSent).catch(() => {})
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh) }
  }, [])

  async function handleGenerate(text) {
    setLoading(true)
    try {
      const result = await generateQuote(text)
      // язык сметы = язык, на котором написано описание (страховка, если AI ошибся)
      result.detected = { ...result.detected, language: detectLanguage(text) }
      setQuote(result)
    } catch (err) {
      alert('Generation failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Смена языка в плашке: AI переводит все строки сметы, цены и количества не меняются
  async function handleLanguage(language) {
    if (language === quote.detected.language) return
    setTranslating(true)
    try {
      setQuote(await translateQuote(quote, language))
    } catch (err) {
      alert('Translation failed: ' + err.message)
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div className="page">
      {!quote ? (
        <StartScreen onSubmit={handleGenerate} loading={loading} />
      ) : (
        <>
          <DetectedBar detected={quote.detected} onChange={(d) => setQuote({ ...quote, detected: d })} onLanguage={handleLanguage} translating={translating} />
          <div className="toolbar">
            <button className="link" onClick={() => setQuote(null)}>← New quote</button>
            <span className="muted small">Click any row to edit</span>
            <div className="grow" />
            <button onClick={() => window.print()}>🖨 PDF</button>
            <button className="primary" onClick={() => setSending(true)}>Send to client →</button>
          </div>
          <QuoteDocument quote={quote} onChange={setQuote} business={business.load()} editable />
        </>
      )}

      {sending && (
        <SendDialog quote={quote} onClose={() => setSending(false)} onSent={() => listQuotes().then(setSent)} />
      )}

      {sent.length > 0 && (
        <section className="sent">
          <h3>My quotes</h3>
          {sent.map((q) => (
            <a key={q.id} href={`/q/${q.id}`} target="_blank" rel="noreferrer" className="sent-row">
              <span className="grow">{q.quote.title}{q.client?.name ? ` · ${q.client.name}` : ''}</span>
              <span>{money(totals(q.quote).total, q.quote.detected.currency)}</span>
            </a>
          ))}
        </section>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import StartScreen from '../components/StartScreen'
import DetectedBar from '../components/DetectedBar'
import QuoteDocument from '../components/QuoteDocument'
import SendDialog from '../components/SendDialog'
import { generateQuote, listQuotes, business, isDemo } from '../lib/api'
import { money, totals } from '../lib/quote'

const STATUS = {
  sent: { label: 'Отправлена', cls: 'st-sent' },
  opened: { label: '👀 Открыта', cls: 'st-opened' },
  accepted: { label: '✅ Принята', cls: 'st-accepted' },
}

// Экран мастера: описал → смета → отправил → видит статусы
export default function MasterPage() {
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(listQuotes())

  // статусы обновляются, когда клиент открывает/принимает смету (в демо — в другой вкладке)
  useEffect(() => {
    const refresh = () => setSent(listQuotes())
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh) }
  }, [])

  async function handleGenerate(text) {
    setLoading(true)
    try {
      const result = await generateQuote(text)
      console.log('Пришла смета:', result)
      setQuote(result)
    } catch (err) {
      alert('Ошибка генерации: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      {!quote ? (
        <StartScreen onSubmit={handleGenerate} loading={loading} />
      ) : (
        <>
          <DetectedBar detected={quote.detected} onChange={(d) => setQuote({ ...quote, detected: d })} />
          <div className="toolbar">
            <button className="link" onClick={() => setQuote(null)}>← Новая смета</button>
            <span className="muted small">Кликните на любую строку, чтобы изменить</span>
            <div className="grow" />
            <button onClick={() => window.print()}>🖨 PDF</button>
            <button className="primary" onClick={() => setSending(true)}>Отправить клиенту →</button>
          </div>
          <QuoteDocument quote={quote} onChange={setQuote} business={business.load()} editable />
        </>
      )}

      {sending && (
        <SendDialog quote={quote} onClose={() => setSending(false)} onSent={() => setSent(listQuotes())} />
      )}

      {sent.length > 0 && (
        <section className="sent">
          <h3>Мои сметы</h3>
          {sent.map((q) => (
            <a key={q.id} href={`/q/${q.id}`} target="_blank" rel="noreferrer" className="sent-row">
              <span className="grow">{q.quote.title}{q.client?.name ? ` · ${q.client.name}` : ''}</span>
              <span>{money(totals(q.quote).total, q.quote.detected.currency)}</span>
              <span className={`status ${STATUS[q.status]?.cls}`}>{STATUS[q.status]?.label}</span>
            </a>
          ))}
          {isDemo && <p className="muted small">Демо: откройте ссылку как клиент — статус здесь обновится. В боевом режиме уведомление приходит в Telegram.</p>}
        </section>
      )}
    </div>
  )
}

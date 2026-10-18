import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import QuoteDocument from '../components/QuoteDocument'
import { getQuote, sendEvent } from '../lib/api'
import { money, totals, t } from '../lib/quote'

// Страница, которую клиент открывает по ссылке
export default function ClientPage() {
  const { id } = useParams()
  const [data, setData] = useState(undefined) // undefined = загрузка, null = не найдено
  const [selected, setSelected] = useState([])
  const [mode, setMode] = useState(null)      // null | 'accept' | 'question'
  const [name, setName] = useState('')
  const [agree, setAgree] = useState(false)
  const [question, setQuestion] = useState('')
  const [done, setDone] = useState(null)       // 'accepted' | 'question'
  const openedSent = useRef(false)

  useEffect(() => {
    getQuote(id).then((d) => {
      setData(d || null)
      if (d?.status === 'accepted') setDone('accepted')
      setName(d?.client?.name || '')
      // событие «клиент открыл» — один раз
      if (d && !openedSent.current) {
        openedSent.current = true
        sendEvent(id, 'opened')
      }
    }).catch(() => setData(null))
  }, [id])

  if (data === undefined) return <div className="page center muted">Загрузка…</div>
  if (data === null) return <div className="page center"><h2>Смета не найдена</h2><p className="muted">Возможно, ссылка устарела. Свяжитесь с мастером.</p></div>

  const { quote, business } = data
  const L = t(quote.detected.language)
  const sum = totals(quote, selected)
  const toggle = (i) => setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))

  async function accept(e) {
    e.preventDefault()
    await sendEvent(id, 'accepted', {
      name,
      options: selected.map((i) => quote.options[i].name),
      total: Math.round(sum.total * 100) / 100,
    })
    setDone('accepted')
  }

  async function ask(e) {
    e.preventDefault()
    await sendEvent(id, 'question', { name, text: question })
    setDone('question')
    setMode(null)
  }

  return (
    <div className="page client">
      <QuoteDocument quote={quote} business={business} client={data.client} selectable={!done} selected={selected} onToggle={toggle} />

      <div className="action-bar">
        {done === 'accepted' ? (
          <div className="success">✅ {L.accepted}</div>
        ) : (
          <>
            {done === 'question' && <div className="info">{L.questionSent}</div>}
            <div className="action-total">
              <span className="muted small">{L.total}</span>
              <strong>{money(sum.total, quote.detected.currency)}</strong>
            </div>

            {mode === null && (
              <div className="actions">
                <button className="primary big" onClick={() => setMode('accept')}>{L.accept}</button>
                <button onClick={() => setMode('question')}>{L.question}</button>
                {business?.phone && <a className="btn" href={`tel:${business.phone}`}>📞 {business.phone}</a>}
              </div>
            )}

            {mode === 'accept' && (
              <form onSubmit={accept} className="mini-form">
                <input required placeholder={L.yourName} value={name} onChange={(e) => setName(e.target.value)} />
                <label className="agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> {L.agree}</label>
                <div className="actions">
                  <button className="primary" disabled={!agree}>{L.accept}</button>
                  <button type="button" className="link" onClick={() => setMode(null)}>←</button>
                </div>
              </form>
            )}

            {mode === 'question' && (
              <form onSubmit={ask} className="mini-form">
                <textarea required rows={3} placeholder="…" value={question} onChange={(e) => setQuestion(e.target.value)} />
                <div className="actions">
                  <button className="primary">{L.send}</button>
                  <button type="button" className="link" onClick={() => setMode(null)}>←</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

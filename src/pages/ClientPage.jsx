import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QuoteDocument from '../components/QuoteDocument'
import { getQuote } from '../lib/api'
import { money, totals, t } from '../lib/quote'

// Страница, которую клиент открывает по ссылке /q/:id
export default function ClientPage() {
  const { id } = useParams()                  // id из адреса
  const [data, setData] = useState(undefined) // undefined = загрузка, null = не найдено
  const [selected, setSelected] = useState([]) // какие опции отметил клиент

  // при открытии страницы загружаем смету по id
  useEffect(() => {
    getQuote(id).then((d) => setData(d || null)).catch(() => setData(null))
  }, [id])

  if (data === undefined) return <div className="page center muted">Loading…</div>
  if (data === null) return <div className="page center"><h2>Quote not found</h2><p className="muted">The link may have expired. Please contact the contractor.</p></div>

  const { quote, business } = data
  const L = t(quote.detected.language)
  const sum = totals(quote, selected)
  const toggle = (i) => setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))

  // «Принять» = открыть WhatsApp-чат с мастером с уже готовым текстом.
  // Бэкенд не нужен: всё, что нужно (телефон мастера, опции, итог), уже есть на странице.
  const total = money(sum.total, quote.detected.currency)
  const extras = selected.map((i) => quote.options[i].name)
  const acceptText = L.acceptMessage(quote.title, total, extras)
  const phone = (business?.phone || '').replace(/\D/g, '')
  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(acceptText)}`

  return (
    <div className="page client">
      <QuoteDocument quote={quote} business={business} client={data.client} selectable selected={selected} onToggle={toggle} />

      <div className="action-bar">
        <div className="action-total">
          <span className="muted small">{L.total}</span>
          <strong>{total}</strong>
        </div>
        <div className="actions">
          {phone && <a className="btn primary big wa" target="_blank" rel="noreferrer" href={waLink}>{L.acceptWhatsApp}</a>}
          {phone && <a className="btn" href={`tel:${business.phone}`}>📞 {business.phone}</a>}
        </div>
      </div>
    </div>
  )
}

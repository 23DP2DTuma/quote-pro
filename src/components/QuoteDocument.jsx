import { money, totals, t } from '../lib/quote'

// Ячейка: у мастера — поле ввода, у клиента — просто текст
function Cell({ value, onChange, editable, type = 'text', className = '' }) {
  if (!editable) return <span className={className}>{value}</span>
  return (
    <input
      className={`cell ${className}`}
      type={type}
      value={value}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  )
}

/*
  Одна смета — две роли:
    editable   → мастер правит строки
    selectable → клиент отмечает опции
*/
export default function QuoteDocument({ quote, onChange, business, client, editable, selectable, selected = [], onToggle }) {
  const L = t(quote.detected.language)
  const cur = quote.detected.currency
  const sum = totals(quote, selected)

  const update = (key, i, patch) => {
    const list = quote[key].map((row, idx) => (idx === i ? (typeof row === 'string' ? patch : { ...row, ...patch }) : row))
    onChange({ ...quote, [key]: list })
  }
  const add = (key, row) => onChange({ ...quote, [key]: [...quote[key], row] })
  const remove = (key, i) => onChange({ ...quote, [key]: quote[key].filter((_, idx) => idx !== i) })

  const valid = new Date(Date.now() + 14 * 864e5).toLocaleDateString('lv-LV')

  return (
    <article className="doc">
      <header className="doc-head">
        <div>
          <div className="doc-brand">{business?.name || 'Ваша компания'}</div>
          {business?.phone && <div className="muted small">{business.phone}</div>}
        </div>
        <div className="right">
          <div className="doc-label">{L.quote}</div>
          <div className="muted small">{L.validUntil} {valid}</div>
        </div>
      </header>

      <h2 className="doc-title">
        <Cell editable={editable} value={quote.title} onChange={(v) => onChange({ ...quote, title: v })} className="title-input" />
      </h2>
      {client?.name && <p className="muted">{L.from}: {business?.name} → {client.name}</p>}

      {/* Материалы */}
      <h3>{L.materials}</h3>
      <table>
        <thead><tr><th>{L.item}</th><th className="num">{L.qty}</th><th className="num">€/ед.</th><th className="num">{L.amount}</th>{editable && <th />}</tr></thead>
        <tbody>
          {quote.materials.map((m, i) => (
            <tr key={i}>
              <td><Cell editable={editable} value={m.name} onChange={(v) => update('materials', i, { name: v })} /></td>
              <td className="num"><Cell editable={editable} type="number" value={m.qty} onChange={(v) => update('materials', i, { qty: v })} className="short" /> {m.unit}</td>
              <td className="num"><Cell editable={editable} type="number" value={m.price} onChange={(v) => update('materials', i, { price: v })} className="short" /></td>
              <td className="num">{money(m.qty * m.price, cur)}</td>
              {editable && <td><button className="x" onClick={() => remove('materials', i)}>×</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
      {editable && <button className="link" onClick={() => add('materials', { name: 'Новая позиция', qty: 1, unit: 'pcs', price: 0 })}>+ строка</button>}

      {/* Работы */}
      <h3>{L.labour}</h3>
      <table>
        <thead><tr><th>{L.phase}</th><th className="num">{L.duration}</th><th className="num">{L.amount}</th>{editable && <th />}</tr></thead>
        <tbody>
          {quote.labour.map((l, i) => (
            <tr key={i}>
              <td><Cell editable={editable} value={l.name} onChange={(v) => update('labour', i, { name: v })} /></td>
              <td className="num"><Cell editable={editable} value={l.duration} onChange={(v) => update('labour', i, { duration: v })} className="short" /></td>
              <td className="num"><Cell editable={editable} type="number" value={l.price} onChange={(v) => update('labour', i, { price: v })} className="short" /></td>
              {editable && <td><button className="x" onClick={() => remove('labour', i)}>×</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
      {editable && <button className="link" onClick={() => add('labour', { name: 'Новый этап', duration: '1', price: 0 })}>+ строка</button>}

      {/* Опции — у клиента галочки */}
      {quote.options.length > 0 && (
        <div className="options">
          <h3>{L.options}</h3>
          {selectable && <p className="muted small">{L.optionsHint}</p>}
          {quote.options.map((o, i) => (
            <label key={i} className={`option ${selected.includes(i) ? 'checked' : ''}`}>
              {selectable && <input type="checkbox" checked={selected.includes(i)} onChange={() => onToggle(i)} />}
              <span className="grow"><Cell editable={editable} value={o.name} onChange={(v) => update('options', i, { name: v })} /></span>
              <span>+<Cell editable={editable} type="number" value={o.price} onChange={(v) => update('options', i, { price: v })} className="short" />{!editable && ` ${cur === 'EUR' ? '€' : cur}`}</span>
            </label>
          ))}
        </div>
      )}

      {/* Итоги */}
      <div className="totals">
        <div><span>{L.materials}</span><span>{money(sum.materials, cur)}</span></div>
        <div><span>{L.labour}</span><span>{money(sum.labour, cur)}</span></div>
        {sum.options > 0 && <div><span>{L.options}</span><span>{money(sum.options, cur)}</span></div>}
        <div><span>{L.subtotal}</span><span>{money(sum.subtotal, cur)}</span></div>
        <div><span>{L.vat} {quote.detected.vat}%</span><span>{money(sum.vat, cur)}</span></div>
        <div className="grand"><span>{L.total}</span><span>{money(sum.total, cur)}</span></div>
      </div>

      <div className="scope">
        <div><h4>✓ {L.included}</h4><ul>{quote.included.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div><h4>✕ {L.excluded}</h4><ul>{quote.excluded.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      </div>

      <div className="scope">
        <div>
          <h4>{L.payment}</h4>
          <ul>{quote.payment.map((p, i) => <li key={i}>{p.label} — {p.percent}% ({money(sum.total * p.percent / 100, cur)})</li>)}</ul>
        </div>
        <div>
          <h4>{L.timeline}</h4><p>{quote.duration}</p>
          <h4>{L.warranty}</h4><p>{quote.warranty}</p>
        </div>
      </div>
    </article>
  )
}

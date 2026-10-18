import { useState } from 'react'
import { saveQuote, business as businessStore } from '../lib/api'
import { money, totals } from '../lib/quote'

/*
  «Анкета в момент ценности»: контакты спрашиваем только здесь,
  когда мастер уже видит смету и хочет её отправить.
  Профиль мастера запоминается — во второй раз поля уже заполнены.
*/
export default function SendDialog({ quote, onClose, onSent }) {
  const saved = businessStore.load() || {}
  const [biz, setBiz] = useState({ name: saved.name || '', phone: saved.phone || '', email: saved.email || '' })
  const [client, setClient] = useState({ name: '', contact: '' })
  const [link, setLink] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    try {
      businessStore.save(biz)
      const { id } = await saveQuote(quote, biz, client)
      const url = `${window.location.origin}/q/${id}`
      setLink(url)
      onSent?.(id, biz, client)
    } catch (err) {
      alert('Could not save the quote: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const total = money(totals(quote).total, quote.detected.currency)
  const msg = `Hello${client.name ? ' ' + client.name : ''}! Here is your quote "${quote.title}" for ${total}: ${link}`

  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <button className="x close" onClick={onClose}>×</button>

        {!link ? (
          <form onSubmit={send}>
            <h2>Send to client</h2>
            <p className="muted small">Your client gets a link where they can pick options and accept the quote online. You'll be notified when they open it.</p>

            <fieldset>
              <legend>You {saved.name && <span className="muted small">· saved from last time</span>}</legend>
              <input required placeholder="Company name *" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
              <input required placeholder="Your phone *" value={biz.phone} onChange={(e) => setBiz({ ...biz, phone: e.target.value })} />
              <input type="email" placeholder="Email (we'll send you a copy)" value={biz.email} onChange={(e) => setBiz({ ...biz, email: e.target.value })} />
            </fieldset>

            <fieldset>
              <legend>Client</legend>
              <input placeholder="Client name" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
              <input placeholder="Client phone or email (for reminders)" value={client.contact} onChange={(e) => setClient({ ...client, contact: e.target.value })} />
            </fieldset>

            <button className="primary big" disabled={busy}>{busy ? 'Saving…' : 'Get link'}</button>
          </form>
        ) : (
          <div>
            <h2>Link ready ✓</h2>
            <div className="linkbox">
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
              <button className="primary" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
            <div className="share">
              <a className="btn wa" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(msg)}`}>WhatsApp</a>
              <a className="btn tg" target="_blank" rel="noreferrer" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`}>Telegram</a>
              <a className="btn" target="_blank" rel="noreferrer" href={link}>Open as client</a>
            </div>
            <p className="muted small">What's next: you'll get a message when the client opens the quote, accepts it or asks a question. If they don't respond within 2 days, they'll get a polite reminder.</p>
          </div>
        )}
      </div>
    </div>
  )
}

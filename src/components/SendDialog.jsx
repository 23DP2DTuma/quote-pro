import { useState } from 'react'
import { saveQuote, business as businessStore } from '../lib/api'
import { money, totals } from '../lib/quote'

// --- Проверка телефона и email ---
// В поле телефона можно вводить только цифры, пробелы, ( ) - и один + в начале
const cleanPhone = (v) => v.replace(/[^\d+\s()-]/g, '').replace(/(?!^)\+/g, '')
const digitCount = (v) => v.replace(/\D/g, '').length
// телефон: 7–15 цифр (международный стандарт E.164 — максимум 15)
const isPhone = (v) => /^\+?[\d\s()-]+$/.test(v) && digitCount(v) >= 7 && digitCount(v) <= 15
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
// код страны для подсказки, по региону сметы
const DIAL = { Latvia: '+371', Estonia: '+372', Lithuania: '+370', Germany: '+49', 'United Kingdom': '+44' }

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
  const [errors, setErrors] = useState({})
  const dial = DIAL[quote.detected.region] || '+371'

  // возвращает объект ошибок; пустой объект = всё в порядке
  function validate() {
    const err = {}
    if (biz.name.trim().length < 2) err.name = 'Enter your company name'
    if (!isPhone(biz.phone)) err.phone = `Enter a valid phone number, e.g. ${dial} 2000 0000`
    if (biz.email && !isEmail(biz.email)) err.email = 'Enter a valid email'
    const c = client.contact.trim()
    if (c && !(c.includes('@') ? isEmail(c) : isPhone(c))) err.contact = 'Enter a valid phone number or email'
    return err
  }

  async function send(e) {
    e.preventDefault()
    const err = validate()
    setErrors(err)
    if (Object.keys(err).length) return // есть ошибки — не отправляем
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
  // если у клиента указан телефон — WhatsApp сразу откроет чат с ним
  const clientPhone = client.contact.includes('@') ? '' : client.contact.replace(/\D/g, '')
  const msg = `Hello${client.name ? ' ' + client.name : ''}! Here is your quote "${quote.title}" for ${total}: ${link}`

  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <button className="x close" onClick={onClose}>×</button>

        {!link ? (
          <form onSubmit={send} noValidate>
            <h2>Send to client</h2>
            <p className="muted small">Your client gets a link where they can pick options and accept the quote online. You'll be notified when they open it.</p>

            <fieldset>
              <legend>You {saved.name && <span className="muted small">· saved from last time</span>}</legend>
              <input required placeholder="Company name *" className={errors.name ? 'invalid' : ''} value={biz.name}
                onChange={(e) => { setBiz({ ...biz, name: e.target.value }); setErrors({ ...errors, name: null }) }} />
              {errors.name && <p className="input-error">{errors.name}</p>}
              <input required type="tel" inputMode="tel" autoComplete="tel" placeholder={`Your phone * (${dial} 2000 0000)`}
                className={errors.phone ? 'invalid' : ''} value={biz.phone}
                onFocus={() => { if (!biz.phone) setBiz({ ...biz, phone: dial + ' ' }) }}
                onChange={(e) => { setBiz({ ...biz, phone: cleanPhone(e.target.value) }); setErrors({ ...errors, phone: null }) }} />
              {errors.phone && <p className="input-error">{errors.phone}</p>}
              <input type="email" placeholder="Email (we'll send you a copy)" className={errors.email ? 'invalid' : ''} value={biz.email}
                onChange={(e) => { setBiz({ ...biz, email: e.target.value.trim() }); setErrors({ ...errors, email: null }) }} />
              {errors.email && <p className="input-error">{errors.email}</p>}
            </fieldset>

            <fieldset>
              <legend>Client</legend>
              <input placeholder="Client name" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
              <input placeholder={`Client phone or email (for reminders)`} className={errors.contact ? 'invalid' : ''} value={client.contact}
                onChange={(e) => { setClient({ ...client, contact: e.target.value }); setErrors({ ...errors, contact: null }) }} />
              {errors.contact && <p className="input-error">{errors.contact}</p>}
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
              <a className="btn wa" target="_blank" rel="noreferrer" href={`https://wa.me/${clientPhone.length >= 7 ? clientPhone : ''}?text=${encodeURIComponent(msg)}`}>WhatsApp</a>
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

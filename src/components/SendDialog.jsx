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
      alert('Не удалось сохранить смету: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const total = money(totals(quote).total, quote.detected.currency)
  const msg = `Добрый день${client.name ? ', ' + client.name : ''}! Ваша смета «${quote.title}» на ${total}: ${link}`

  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <button className="x close" onClick={onClose}>×</button>

        {!link ? (
          <form onSubmit={send}>
            <h2>Отправить клиенту</h2>
            <p className="muted small">Клиент получит ссылку: сможет выбрать опции и принять смету онлайн. Вам придёт уведомление, когда он её откроет.</p>

            <fieldset>
              <legend>Вы {saved.name && <span className="muted small">· запомнили с прошлого раза</span>}</legend>
              <input required placeholder="Название компании *" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
              <input required placeholder="Ваш телефон *" value={biz.phone} onChange={(e) => setBiz({ ...biz, phone: e.target.value })} />
              <input type="email" placeholder="Email (пришлём копию)" value={biz.email} onChange={(e) => setBiz({ ...biz, email: e.target.value })} />
            </fieldset>

            <fieldset>
              <legend>Клиент</legend>
              <input placeholder="Имя клиента" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
              <input placeholder="Телефон или email клиента (для напоминаний)" value={client.contact} onChange={(e) => setClient({ ...client, contact: e.target.value })} />
            </fieldset>

            <button className="primary big" disabled={busy}>{busy ? 'Сохраняем…' : 'Получить ссылку'}</button>
          </form>
        ) : (
          <div>
            <h2>Ссылка готова ✓</h2>
            <div className="linkbox">
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
              <button className="primary" onClick={copy}>{copied ? 'Скопировано' : 'Копировать'}</button>
            </div>
            <div className="share">
              <a className="btn wa" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(msg)}`}>WhatsApp</a>
              <a className="btn tg" target="_blank" rel="noreferrer" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`}>Telegram</a>
              <a className="btn" target="_blank" rel="noreferrer" href={link}>Открыть как клиент</a>
            </div>
            <p className="muted small">Что дальше: когда клиент откроет, примет смету или задаст вопрос — вам придёт сообщение. Если не ответит 2 дня, ему уйдёт вежливое напоминание.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'

const EXAMPLES = [
  'Bathroom 6 m² in Riga, strip-out, new tiles, wall-hung WC',
  'Install kitchen 12 m² in Riga, oak units, new worktop',
  'Terase 24 m² no lapegles, Jūrmala',
]

// Улучшение №2: одно поле вместо анкеты. Текст или голос.
export default function StartScreen({ onSubmit, loading }) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  const Speech = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  function toggleVoice() {
    if (!Speech) return alert('Voice input works in Chrome / Edge')
    if (listening) return recRef.current?.stop()
    const rec = new Speech()
    rec.lang = navigator.language?.startsWith('lv') ? 'lv-LV' : 'ru-RU'
    rec.interimResults = true
    rec.continuous = true
    const before = text ? text + ' ' : ''
    rec.onresult = (e) => {
      const said = Array.from(e.results).map((r) => r[0].transcript).join(' ')
      setText(before + said)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recRef.current = rec
    setListening(true)
  }

  const submit = (e) => {
    e.preventDefault()
    if (text.trim().length > 5 && !loading) onSubmit(text.trim())
  }

  return (
    <section className="start">
      <h1>Describe the job — get a quote</h1>
      <p className="muted">No forms. Type or say it in one sentence: what, how much, where.</p>

      <form onSubmit={submit} className="start-form">
        <div className="input-wrap">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="For example: bathroom 6 m² in Riga, strip-out, new tiles, wall-hung WC"
            rows={3}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e) }}
          />
          <button type="button" className={`mic ${listening ? 'on' : ''}`} onClick={toggleVoice} title="Voice input">
            {listening ? '■' : '🎤'}
          </button>
        </div>
        <button className="primary big" disabled={loading || text.trim().length < 6}>
          {loading ? 'Calculating materials and labour…' : 'Create quote →'}
        </button>
      </form>

      <div className="examples">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="chip" onClick={() => setText(ex)}>{ex}</button>
        ))}
      </div>
    </section>
  )
}

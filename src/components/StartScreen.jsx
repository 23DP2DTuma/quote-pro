import { useRef, useState } from 'react'

const EXAMPLES = [
  'Ремонт ванной 6 м² в Риге, демонтаж, новая плитка, подвесной унитаз',
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
    if (!Speech) return alert('Голосовой ввод работает в Chrome / Edge')
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
      <h1>Опишите работу — получите смету</h1>
      <p className="muted">Без анкет. Напишите или наговорите одной фразой: что, сколько, где.</p>

      <form onSubmit={submit} className="start-form">
        <div className="input-wrap">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Например: ванная 6 м² в Риге, демонтаж, новая плитка, подвесной унитаз"
            rows={3}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e) }}
          />
          <button type="button" className={`mic ${listening ? 'on' : ''}`} onClick={toggleVoice} title="Голосовой ввод">
            {listening ? '■' : '🎤'}
          </button>
        </div>
        <button className="primary big" disabled={loading || text.trim().length < 6}>
          {loading ? 'Считаем материалы и работы…' : 'Сделать смету →'}
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

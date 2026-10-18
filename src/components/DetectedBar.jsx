import { useState } from 'react'

const REGIONS = {
  Latvia: { currency: 'EUR', vat: 21 }, Estonia: { currency: 'EUR', vat: 24 },
  Lithuania: { currency: 'EUR', vat: 21 }, Germany: { currency: 'EUR', vat: 19 },
  'United Kingdom': { currency: 'GBP', vat: 20 },
}

// Плашка «что AI угадал» — заменяет поля отрасль / регион / валюта / НДС / язык
export default function DetectedBar({ detected, onChange }) {
  const [open, setOpen] = useState(false)
  const set = (patch) => onChange({ ...detected, ...patch })

  return (
    <div className="detected">
      <div className="detected-row">
        <span className="spark">✨ Detected:</span>
        <span>{detected.industry}</span>·<span>{detected.region}</span>·
        <span>{detected.currency}</span>·<span>VAT {detected.vat}%</span>·
        <span>{detected.language.toUpperCase()}</span>
        <button className="link" onClick={() => setOpen(!open)}>{open ? 'done' : 'edit'}</button>
      </div>
      {open && (
        <div className="detected-edit">
          <label>Industry<input value={detected.industry} onChange={(e) => set({ industry: e.target.value })} /></label>
          <label>Region
            <select value={detected.region} onChange={(e) => set({ region: e.target.value, ...REGIONS[e.target.value] })}>
              {Object.keys(REGIONS).map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label>VAT %<input type="number" value={detected.vat} onChange={(e) => set({ vat: Number(e.target.value) })} /></label>
          <label>Language
            <select value={detected.language} onChange={(e) => set({ language: e.target.value })}>
              <option value="ru">RU</option><option value="lv">LV</option><option value="en">EN</option>
            </select>
          </label>
        </div>
      )}
    </div>
  )
}

/*
  ФОРМАТ СМЕТЫ — договор между фронтендом и n8n.
  n8n (LLM) должен возвращать ровно такой объект.

  {
    detected: {                 // то, что AI угадал из описания (вместо анкеты)
      industry: "Bathroom fit-out",
      region:   "Latvia",
      currency: "EUR",
      vat:      21,             // %
      language: "ru"            // ru | lv | en
    },
    title: "Ремонт ванной 6 м²",
    materials: [ { name, qty, unit, price } ],   // price — за единицу
    labour:    [ { name, duration, price } ],    // price — за всю фазу
    options:   [ { name, price } ],              // доп. опции, клиент отмечает сам
    included:  [ "..." ],
    excluded:  [ "..." ],
    payment:   [ { label, percent } ],
    duration:  "7–9 рабочих дней",
    warranty:  "24 месяца на работы"
  }
*/

// Язык по буквам текста: кириллица → ru, латышские буквы → lv, иначе en
export function detectLanguage(text = '') {
  if (/[а-яё]/i.test(text)) return 'ru'
  if (/[āčēģīķļņšūž]/i.test(text)) return 'lv'
  return 'en'
}

export const CURRENCY_SIGN = { EUR: '€', GBP: '£', USD: '$' }

export function money(value, currency = 'EUR') {
  const sign = CURRENCY_SIGN[currency] || currency + ' '
  return sign + Number(value || 0).toLocaleString('lv-LV', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

// Считаем итоги. selected — индексы опций, которые отметил клиент.
export function totals(quote, selected = []) {
  const materials = quote.materials.reduce((s, m) => s + Number(m.qty) * Number(m.price), 0)
  const labour = quote.labour.reduce((s, l) => s + Number(l.price), 0)
  const options = selected.reduce((s, i) => s + Number(quote.options[i]?.price || 0), 0)
  const subtotal = materials + labour + options
  const vat = subtotal * (Number(quote.detected.vat) / 100)
  return { materials, labour, options, subtotal, vat, total: subtotal + vat }
}

// Тексты интерфейса сметы на языке клиента
export const T = {
  ru: {
    quote: 'Смета', materials: 'Материалы', labour: 'Работы', item: 'Позиция', qty: 'Кол-во',
    amount: 'Сумма', phase: 'Этап', duration: 'Срок', options: 'Дополнительные опции',
    optionsHint: 'Отметьте, что добавить — итог пересчитается', included: 'Входит',
    excluded: 'Не входит', payment: 'Оплата', timeline: 'Срок работ', warranty: 'Гарантия',
    subtotal: 'Без НДС', vat: 'НДС', total: 'Итого', accept: 'Принять смету',
    question: 'Задать вопрос', yourName: 'Ваше имя', agree: 'Я ознакомился со сметой и принимаю её',
    accepted: 'Смета принята. Мастер свяжется с вами для согласования даты.',
    send: 'Отправить', questionSent: 'Вопрос отправлен — мастер ответит в ближайшее время.',
    validUntil: 'Действительна до', from: 'От',
    unitPrice: 'Цена/ед.', yourCompany: 'Ваша компания',
  },
  en: {
    quote: 'Quote', materials: 'Materials', labour: 'Labour', item: 'Item', qty: 'Qty',
    amount: 'Amount', phase: 'Phase', duration: 'Duration', options: 'Optional extras',
    optionsHint: 'Tick what you want — the total updates', included: 'Included',
    excluded: 'Not included', payment: 'Payment', timeline: 'Timeline', warranty: 'Warranty',
    subtotal: 'Subtotal', vat: 'VAT', total: 'Total', accept: 'Accept quote',
    question: 'Ask a question', yourName: 'Your name', agree: 'I have read the quote and accept it',
    accepted: 'Quote accepted. The contractor will contact you to agree a start date.',
    send: 'Send', questionSent: 'Question sent — the contractor will reply shortly.',
    validUntil: 'Valid until', from: 'From',
    unitPrice: 'Unit price', yourCompany: 'Your company',
  },
}
T.lv = {
  ...T.en,
  quote: 'Tāme', materials: 'Materiāli', labour: 'Darbi', total: 'Kopā', vat: 'PVN',
  accept: 'Apstiprināt tāmi', question: 'Uzdot jautājumu', options: 'Papildu iespējas',
  included: 'Iekļauts', excluded: 'Nav iekļauts', warranty: 'Garantija', payment: 'Apmaksa',
  unitPrice: 'Cena/vien.', yourCompany: 'Jūsu uzņēmums',
  item: 'Pozīcija', qty: 'Daudz.', amount: 'Summa', phase: 'Posms', duration: 'Termiņš',
  optionsHint: 'Atzīmējiet, ko pievienot — kopsumma pārrēķināsies', timeline: 'Darbu termiņš',
  subtotal: 'Bez PVN', yourName: 'Jūsu vārds', agree: 'Esmu iepazinies ar tāmi un to apstiprinu',
  accepted: 'Tāme apstiprināta. Meistars sazināsies ar jums, lai vienotos par datumu.',
  send: 'Nosūtīt', questionSent: 'Jautājums nosūtīts — meistars drīz atbildēs.',
  validUntil: 'Derīga līdz', from: 'No',
}
export const t = (lang) => T[lang] || T.en

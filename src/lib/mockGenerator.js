/*
  ДЕМО-ГЕНЕРАТОР. Работает без n8n, чтобы прототип можно было показать сразу.
  В боевом режиме этот файл не используется — смету делает LLM в n8n.
  Логика та же, что у LLM: угадать параметры бизнеса из текста + собрать смету.
*/

// 1) Угадываем параметры, которые раньше спрашивала анкета
export function detect(text) {
  const s = text.toLowerCase()

  const language = /[а-яё]/i.test(text) ? 'ru' : /[āčēģīķļņšūž]/i.test(text) ? 'lv' : 'en'

  const regions = [
    { re: /rīg|riga|рига|риге|latvi|латви|jūrmal|юрмал/, region: 'Latvia', currency: 'EUR', vat: 21 },
    { re: /tallin|таллин|eesti|estoni|эстони/, region: 'Estonia', currency: 'EUR', vat: 24 },
    { re: /vilni|вильн|lithuan|литв/, region: 'Lithuania', currency: 'EUR', vat: 21 },
    { re: /london|лондон|\buk\b|england|англи/, region: 'United Kingdom', currency: 'GBP', vat: 20 },
    { re: /berlin|берлин|german|германи|münchen/, region: 'Germany', currency: 'EUR', vat: 19 },
  ]
  // по умолчанию — Латвия (рынок Sharpify)
  const reg = regions.find((r) => r.re.test(s)) || { region: 'Latvia', currency: 'EUR', vat: 21 }

  const area = Number((s.match(/(\d+[.,]?\d*)\s*(m2|м2|m²|м²|кв|sq)/) || [])[1]?.replace(',', '.')) || null
  const kind = pickKind(s)

  return {
    detected: { industry: kind.industry, region: reg.region, currency: reg.currency, vat: reg.vat, language },
    area,
    kind,
  }
}

function pickKind(s) {
  if (/ванн|санузел|bathroom|vannas|туалет|душ/.test(s)) return KINDS.bathroom
  if (/кухн|kitchen|virtuv/.test(s)) return KINDS.kitchen
  if (/крыш|кровл|roof|jumt/.test(s)) return KINDS.roof
  if (/покрас|краск|paint|krās|обои/.test(s)) return KINDS.painting
  if (/террас|deck|настил|terase/.test(s)) return KINDS.deck
  return KINDS.generic
}

// Шаблоны: [название ru, название en, ед., цена, коэффициент на м²]
const KINDS = {
  bathroom: {
    industry: 'Bathroom fit-out', defArea: 6, title: ['Ремонт ванной', 'Bathroom renovation'],
    materials: [
      ['Керамическая плитка', 'Ceramic tiles', 'm²', 32, 2.6],
      ['Плиточный клей 25 кг', 'Tile adhesive 25 kg', 'pcs', 12, 0.8],
      ['Гидроизоляция', 'Waterproofing kit', 'pcs', 65, 0],
      ['Подвесной унитаз с инсталляцией', 'Wall-hung WC with frame', 'pcs', 420, 0],
      ['Смеситель и душевая система', 'Mixer & shower set', 'pcs', 260, 0],
    ],
    labour: [['Демонтаж и вывоз мусора', 'Strip-out & disposal', 1, 14], ['Сантехника', 'Plumbing', 2, 0, 520], ['Укладка плитки', 'Tiling', 3, 2.6 * 28], ['Монтаж сантехники и финиш', 'Fixtures & finishing', 1, 0, 340]],
    options: [['Электрический тёплый пол', 'Electric underfloor heating', 450], ['Стеклянная душевая перегородка', 'Glass shower screen', 380], ['Зеркальный шкаф с подсветкой', 'Lit mirror cabinet', 290]],
  },
  kitchen: {
    industry: 'Kitchen fit-out', defArea: 12, title: ['Монтаж кухни', 'Kitchen installation'],
    materials: [
      ['Модули кухни (комплект)', 'Kitchen units (set)', 'pcs', 3200, 0],
      ['Столешница', 'Worktop', 'm', 140, 0.35],
      ['Мойка и смеситель', 'Sink & tap', 'pcs', 290, 0],
      ['Фурнитура и крепёж', 'Fittings & fixings', 'pcs', 180, 0],
    ],
    labour: [['Демонтаж старой кухни', 'Remove old kitchen', 1, 0, 280], ['Электрика и подключения', 'Electrical & connections', 1, 0, 390], ['Сборка и монтаж', 'Assembly & installation', 3, 0, 1100]],
    options: [['Подсветка под шкафами', 'Under-cabinet lighting', 240], ['Фартук из стекла', 'Glass splashback', 420], ['Установка техники', 'Appliance installation', 180]],
  },
  roof: {
    industry: 'Roofing', defArea: 120, title: ['Замена кровли', 'Roof replacement'],
    materials: [['Металлочерепица', 'Metal roof sheets', 'm²', 14, 1.1], ['Мембрана', 'Underlay membrane', 'm²', 3, 1.1], ['Водостоки', 'Gutters & downpipes', 'pcs', 650, 0], ['Крепёж и доборные элементы', 'Fixings & trims', 'pcs', 420, 0]],
    labour: [['Демонтаж старой кровли', 'Strip old roof', 2, 4], ['Монтаж кровли', 'Roofing installation', 5, 11], ['Водосточная система', 'Gutter installation', 1, 0, 380]],
    options: [['Мансардное окно', 'Roof window', 690], ['Снегозадержатели', 'Snow guards', 260]],
  },
  painting: {
    industry: 'Painting & decorating', defArea: 40, title: ['Покраска помещения', 'Interior painting'],
    materials: [['Краска интерьерная', 'Interior paint', 'l', 9, 0.3], ['Грунтовка', 'Primer', 'l', 5, 0.15], ['Шпаклёвка и расходники', 'Filler & consumables', 'pcs', 80, 0]],
    labour: [['Подготовка поверхностей', 'Surface preparation', 1, 4], ['Покраска в 2 слоя', 'Two-coat painting', 2, 7]],
    options: [['Покраска потолка', 'Ceiling painting', 220], ['Покраска дверей', 'Door painting', 150]],
  },
  deck: {
    industry: 'Carpentry / decking', defArea: 24, title: ['Строительство террасы', 'Deck build'],
    materials: [['Террасная доска (лиственница)', 'Larch decking boards', 'm²', 48, 1.1], ['Лаги и опоры', 'Joists & supports', 'm²', 18, 1], ['Крепёж из нержавейки', 'Stainless fixings', 'pcs', 160, 0]],
    labour: [['Демонтаж старого настила', 'Remove old deck', 1, 6], ['Основание и лаги', 'Frame & joists', 2, 14], ['Укладка доски', 'Board installation', 2, 16]],
    options: [['Масло для террас', 'Deck oil finish', 210], ['Ступени', 'Steps', 340], ['Подсветка', 'Deck lighting', 280]],
  },
  generic: {
    industry: 'General contracting', defArea: 20, title: ['Ремонтные работы', 'Renovation works'],
    materials: [['Основные материалы', 'Main materials', 'm²', 25, 1], ['Расходные материалы', 'Consumables', 'pcs', 120, 0]],
    labour: [['Подготовительные работы', 'Preparation', 1, 6], ['Основные работы', 'Main works', 3, 22]],
    options: [['Уборка после ремонта', 'Post-works cleaning', 150]],
  },
}

// 2) Собираем смету
export function generateMock(text) {
  const { detected, area: parsedArea, kind } = detect(text)
  const ru = detected.language === 'ru'
  const area = parsedArea || kind.defArea
  const L = (r, e) => (ru ? r : e)
  const round = (n) => Math.round(n)

  const materials = kind.materials.map(([r, e, unit, price, perM2]) => ({
    name: L(r, e), unit, price,
    qty: perM2 ? Math.max(1, Math.ceil(area * perM2)) : 1,
  }))
  const labour = kind.labour.map(([r, e, days, perM2, fixed]) => ({
    name: L(r, e),
    duration: `${days} ${L(days === 1 ? 'день' : days < 5 ? 'дня' : 'дней', days === 1 ? 'day' : 'days')}`,
    price: round(fixed || perM2 * area),
  }))
  const days = kind.labour.reduce((s, l) => s + l[2], 0)

  return {
    detected,
    title: `${L(kind.title[0], kind.title[1])} ${parsedArea ? area + ' m²' : ''}`.trim(),
    materials,
    labour,
    options: kind.options.map(([r, e, price]) => ({ name: L(r, e), price })),
    included: ru
      ? ['Все материалы из списка выше', 'Работы по списку выше', 'Вывоз строительного мусора', 'Уборка после работ']
      : ['All materials listed above', 'All labour listed above', 'Waste removal', 'Clean-up after works'],
    excluded: ru
      ? ['Скрытые дефекты, обнаруженные при демонтаже', 'Работы, не указанные в смете', 'Согласования с управляющей компанией']
      : ['Hidden defects found during strip-out', 'Works not listed in this quote', 'Building management permits'],
    payment: ru
      ? [{ label: 'Предоплата при подписании', percent: 30 }, { label: 'После основных работ', percent: 40 }, { label: 'После сдачи', percent: 30 }]
      : [{ label: 'Deposit on acceptance', percent: 30 }, { label: 'After main works', percent: 40 }, { label: 'On completion', percent: 30 }],
    duration: L(`${days}–${days + 2} рабочих дней`, `${days}–${days + 2} working days`),
    warranty: L('24 месяца на работы', '24 months on workmanship'),
  }
}

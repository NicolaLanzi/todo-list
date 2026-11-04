const DAY_MS = 86_400_000

const DATE_FMT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })
const WEEKDAY_FMT = new Intl.DateTimeFormat('it-IT', { weekday: 'long' })
const FULL_FMT = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Converte una stringa YYYY-MM-DD in una Date locale.
 * Restituisce null se la data non è valida.
 * @param {unknown} value
 * @returns {Date | null}
 */
export function parseISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

/** @param {unknown} value */
export function isValidISODate(value) {
  return parseISODate(value) !== null
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Restituisce etichetta e stato della scadenza di un'attività.
 * @param {string} value
 * @returns {{ days: number, label: string, state: 'overdue' | 'today' | 'future', full: string } | null}
 */
export function getDueInfo(value) {
  const date = parseISODate(value)
  if (!date) return null

  const days = Math.round((date.getTime() - startOfToday().getTime()) / DAY_MS)

  let label
  if (days === 0) label = 'Oggi'
  else if (days === 1) label = 'Domani'
  else if (days === -1) label = 'Ieri'
  else if (days > 1 && days <= 6) label = capitalize(WEEKDAY_FMT.format(date))
  else label = DATE_FMT.format(date)

  return {
    days,
    label,
    state: days < 0 ? 'overdue' : days === 0 ? 'today' : 'future',
    full: capitalize(FULL_FMT.format(date)),
  }
}

/**
 * Accorcia una stringa aggiungendo un'ellissi.
 * @param {string} value
 * @param {number} max
 */
export function truncate(value, max = 40) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value
}

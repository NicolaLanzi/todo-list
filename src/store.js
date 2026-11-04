import { isValidISODate } from './utils.js'

export const STORAGE_KEY = 'taskflow.v1'
export const FILTERS = ['all', 'active', 'completed']
export const SORTS = ['manual', 'recent', 'priority', 'due', 'alpha']
export const THEMES = ['system', 'light', 'dark']

const PRIORITIES = ['high', 'medium', 'low']
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }
const FALLBACK_CATEGORY = 'Generale'
const MAX_TITLE = 160
const MAX_CATEGORY = 24
const MAX_QUERY = 80

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `todo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeTodo(raw) {
  if (!raw || typeof raw !== 'object') return null

  const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, MAX_TITLE) : ''
  if (!title) return null

  const category =
    typeof raw.category === 'string' && raw.category.trim()
      ? raw.category.trim().slice(0, MAX_CATEGORY)
      : FALLBACK_CATEGORY

  const done = Boolean(raw.done)

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    title,
    done,
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'medium',
    due: isValidISODate(raw.due) ? raw.due : '',
    category,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    completedAt: done && Number.isFinite(raw.completedAt) ? raw.completedAt : null,
  }
}

function compareDue(a, b) {
  if (!a.due && !b.due) return 0
  if (!a.due) return 1
  if (!b.due) return -1
  return a.due.localeCompare(b.due)
}

function storageIsAvailable() {
  try {
    const probe = '__taskflow_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/**
 * Stato applicativo della todo list, con persistenza su localStorage.
 * I componenti si iscrivono con `subscribe` e ricevono notifica a ogni modifica.
 */
export class TodoStore {
  constructor() {
    /** @type {Set<(store: TodoStore) => void>} */
    this.listeners = new Set()
    /** @type {ReturnType<typeof normalizeTodo>[]} */
    this.todos = []
    this.prefs = { theme: 'system', sort: 'manual' }
    this.view = { filter: 'all', query: '', category: 'all' }
    this.undoEntry = null
    /** @type {boolean} */
    this.storageAvailable = storageIsAvailable()
    this.load()
  }

  /* ---------------------------------------------------------------- persist */

  load() {
    let data = null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      data = raw ? JSON.parse(raw) : null
    } catch {
      data = null
    }

    if (!data || typeof data !== 'object') return

    if (Array.isArray(data.todos)) {
      const seen = new Set()
      this.todos = data.todos
        .map(normalizeTodo)
        .filter((todo) => {
          if (!todo || seen.has(todo.id)) return false
          seen.add(todo.id)
          return true
        })
    }

    if (data.prefs && typeof data.prefs === 'object') {
      if (THEMES.includes(data.prefs.theme)) this.prefs.theme = data.prefs.theme
      if (SORTS.includes(data.prefs.sort)) this.prefs.sort = data.prefs.sort
    }
  }

  reload() {
    this.todos = []
    this.prefs = { theme: 'system', sort: 'manual' }
    this.undoEntry = null
    this.storageAvailable = storageIsAvailable()
    this.load()
    this.commit()
  }

  save() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ todos: this.todos, prefs: this.prefs }),
      )
      this.storageAvailable = true
      return true
    } catch {
      // localStorage non disponibile (modalità privata, quota piena...): l'app resta usabile.
      this.storageAvailable = false
      return false
    }
  }

  /** Notifica tutti gli iscritti. */
  emit() {
    for (const listener of this.listeners) listener(this)
  }

  /** @param {(store: TodoStore) => void} listener */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  commit() {
    if (
      this.view.category !== 'all' &&
      !this.todos.some((todo) => todo.category === this.view.category)
    ) {
      this.view.category = 'all'
    }
    this.save()
    this.emit()
  }

  /* ------------------------------------------------------------------ read */

  getById(id) {
    return this.todos.find((todo) => todo.id === id) ?? null
  }

  counts() {
    const total = this.todos.length
    let completed = 0
    for (const todo of this.todos) if (todo.done) completed += 1
    return { total, completed, active: total - completed }
  }

  /** @returns {{ name: string, count: number }[]} */
  getCategories() {
    const map = new Map()
    for (const todo of this.todos) {
      map.set(todo.category, (map.get(todo.category) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'it'))
  }

  canReorder() {
    return (
      this.prefs.sort === 'manual' &&
      this.view.filter === 'all' &&
      this.view.category === 'all' &&
      this.view.query.trim() === ''
    )
  }

  /** Attività filtrate e ordinate per la vista corrente. */
  getVisible() {
    const query = this.view.query.trim().toLocaleLowerCase('it')
    const list = this.todos.filter((todo) => {
      if (this.view.filter === 'active' && todo.done) return false
      if (this.view.filter === 'completed' && !todo.done) return false
      if (this.view.category !== 'all' && todo.category !== this.view.category) return false
      if (query) {
        const haystack = `${todo.title}\n${todo.category}`.toLocaleLowerCase('it')
        if (!haystack.includes(query)) return false
      }
      return true
    })

    switch (this.prefs.sort) {
      case 'recent':
        list.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'alpha':
        list.sort((a, b) => a.title.localeCompare(b.title, 'it', { sensitivity: 'base' }))
        break
      case 'priority':
        list.sort(
          (a, b) =>
            PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
            compareDue(a, b) ||
            a.createdAt - b.createdAt,
        )
        break
      case 'due':
        list.sort(
          (a, b) =>
            compareDue(a, b) ||
            PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
            a.createdAt - b.createdAt,
        )
        break
      default:
        break
    }

    return list
  }

  /* ----------------------------------------------------------------- write */

  /**
   * @param {{ title: string, priority?: string, due?: string, category?: string }} input
   */
  add(input) {
    const title = String(input.title ?? '').trim().slice(0, MAX_TITLE)
    if (!title) throw new Error('Il titolo è obbligatorio')

    const todo = {
      id: createId(),
      title,
      done: false,
      priority: PRIORITIES.includes(input.priority) ? input.priority : 'medium',
      due: isValidISODate(input.due) ? input.due : '',
      category: String(input.category ?? '').trim().slice(0, MAX_CATEGORY) || FALLBACK_CATEGORY,
      createdAt: Date.now(),
      completedAt: null,
    }

    this.todos.push(todo)
    this.commit()
    return todo
  }

  /**
   * @param {string} id
   * @param {{ title?: string, priority?: string, due?: string, category?: string }} patch
   */
  update(id, patch) {
    const todo = this.getById(id)
    if (!todo) return null

    if (typeof patch.title === 'string') {
      const title = patch.title.trim().slice(0, MAX_TITLE)
      if (!title) return null
      todo.title = title
    }

    if (PRIORITIES.includes(patch.priority)) todo.priority = patch.priority
    if ('due' in patch) todo.due = isValidISODate(patch.due) ? patch.due : ''

    if ('category' in patch) {
      const category = String(patch.category ?? '').trim().slice(0, MAX_CATEGORY)
      todo.category = category || FALLBACK_CATEGORY
    }

    this.commit()
    return todo
  }

  toggle(id) {
    const todo = this.getById(id)
    if (!todo) return null

    todo.done = !todo.done
    todo.completedAt = todo.done ? Date.now() : null
    this.commit()
    return todo
  }

  remove(id) {
    const index = this.todos.findIndex((todo) => todo.id === id)
    if (index === -1) return null

    const [removed] = this.todos.splice(index, 1)
    this.undoEntry = { items: [{ todo: removed, index }] }
    this.commit()
    return removed
  }

  clearCompleted() {
    const removed = []
    this.todos.forEach((todo, index) => {
      if (todo.done) removed.push({ todo, index })
    })
    if (removed.length === 0) return 0

    this.todos = this.todos.filter((todo) => !todo.done)
    this.undoEntry = { items: removed }
    this.commit()
    return removed.length
  }

  /** Segna tutte come completate, oppure tutte come da fare. */
  toggleAll() {
    const { total, active } = this.counts()
    if (total === 0) return { done: false, changed: 0 }

    const done = active > 0
    let changed = 0
    const now = Date.now()

    for (const todo of this.todos) {
      if (todo.done === done) continue
      todo.done = done
      todo.completedAt = done ? now : null
      changed += 1
    }

    if (changed > 0) this.commit()
    return { done, changed }
  }

  /**
   * Sposta `draggedId` prima o dopo `targetId` (solo in ordinamento manuale).
   * @returns {boolean} true se l'ordine è cambiato
   */
  move(draggedId, targetId, after) {
    if (!this.canReorder() || draggedId === targetId) return false

    const from = this.todos.findIndex((todo) => todo.id === draggedId)
    if (from === -1) return false

    const [item] = this.todos.splice(from, 1)
    let to = this.todos.findIndex((todo) => todo.id === targetId)
    if (to === -1) {
      this.todos.splice(from, 0, item)
      return false
    }

    if (after) to += 1
    this.todos.splice(to, 0, item)
    this.commit()
    return true
  }

  /**
   * Ripristina le attività dell'ultima eliminazione senza sovrascrivere
   * eventuali modifiche fatte nel frattempo.
   */
  undo() {
    if (!this.undoEntry) return false

    for (const { todo, index } of this.undoEntry.items) {
      if (this.todos.some((item) => item.id === todo.id)) continue
      const at = Math.min(index, this.todos.length)
      this.todos.splice(at, 0, todo)
    }

    this.undoEntry = null
    this.commit()
    return true
  }

  /* ------------------------------------------------------------- preferences */

  setTheme(theme) {
    if (!THEMES.includes(theme) || this.prefs.theme === theme) return
    this.prefs.theme = theme
    this.save()
    this.emit()
  }

  setSort(sort) {
    if (!SORTS.includes(sort) || this.prefs.sort === sort) return
    this.prefs.sort = sort
    this.save()
    this.emit()
  }

  setView(patch) {
    let changed = false

    if (FILTERS.includes(patch.filter) && this.view.filter !== patch.filter) {
      this.view.filter = patch.filter
      changed = true
    }
    if (typeof patch.query === 'string') {
      const query = patch.query.slice(0, MAX_QUERY)
      if (this.view.query !== query) {
        this.view.query = query
        changed = true
      }
    }
    if (typeof patch.category === 'string' && this.view.category !== patch.category) {
      this.view.category = patch.category
      changed = true
    }

    if (changed) this.emit()
  }
}

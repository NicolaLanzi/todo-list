import { TodoStore, STORAGE_KEY } from './store.js'
import { ICONS, PRIORITY_META } from './icons.js'
import { getDueInfo, truncate } from './utils.js'

const state = {
  editingId: null,
  focusEdit: false,
  pendingFocus: null,
  drag: null,
  toastTimer: null,
  toastHideTimer: null,
  toastAction: null,
}

let store
let dom

/* ------------------------------------------------------------------------- */
/*  Bootstrap                                                                 */
/* ------------------------------------------------------------------------- */

export function mountApp() {
  dom = {
    form: document.querySelector('#add-form'),
    title: document.querySelector('#new-title'),
    priority: document.querySelector('#new-priority'),
    due: document.querySelector('#new-due'),
    category: document.querySelector('#new-category'),
    formError: document.querySelector('#form-error'),
    search: document.querySelector('#search'),
    searchClear: document.querySelector('#search-clear'),
    filterButtons: [...document.querySelectorAll('.filter-btn')],
    categoryFilters: document.querySelector('#category-filters'),
    sort: document.querySelector('#sort'),
    list: document.querySelector('#todo-list'),
    visibleCount: document.querySelector('#visible-count'),
    toggleAll: document.querySelector('#toggle-all'),
    emptyState: document.querySelector('#empty-state'),
    emptyTitle: document.querySelector('#empty-title'),
    emptyText: document.querySelector('#empty-text'),
    emptyAction: document.querySelector('#empty-action'),
    statsLeft: document.querySelector('#stats-left'),
    progress: document.querySelector('#progress'),
    progressBar: document.querySelector('#progress-bar'),
    progressLabel: document.querySelector('#progress-label'),
    clearCompleted: document.querySelector('#clear-completed'),
    saveStatus: document.querySelector('#save-status'),
    saveStatusText: document.querySelector('#save-status-text'),
    themeToggle: document.querySelector('#theme-toggle'),
    categoryOptions: document.querySelector('#category-options'),
    toast: document.querySelector('#toast'),
    toastMessage: document.querySelector('#toast-message'),
    toastAction: document.querySelector('#toast-action'),
    toastClose: document.querySelector('#toast-close'),
  }

  store = new TodoStore()

  applyTheme()
  store.subscribe(() => {
    applyTheme()
    render()
  })
  bindEvents()
  render()
}

/* ------------------------------------------------------------------------- */
/*  Rendering                                                                 */
/* ------------------------------------------------------------------------- */

function render() {
  const visible = store.getVisible()

  if (state.editingId && !visible.some((todo) => todo.id === state.editingId)) {
    state.editingId = null
  }

  renderList(visible)
  renderFilterState()
  renderCategories()
  renderCategoryOptions()
  renderFooter()
  renderSaveStatus()
  renderEmptyState(visible)
  syncControls()
  applyPendingFocus()
}

function renderList(visible) {
  const canReorder = store.canReorder()
  const fragment = document.createDocumentFragment()

  for (const todo of visible) {
    fragment.append(buildTodoItem(todo, canReorder))
  }

  dom.list.replaceChildren(fragment)
  dom.visibleCount.textContent = String(visible.length)

  if (state.editingId && state.focusEdit) {
    const input = todoElement(state.editingId)?.querySelector('.edit-title')
    if (input) {
      input.focus()
      input.select()
    }
  }
  state.focusEdit = false
}

function buildTodoItem(todo, canReorder) {
  const isEditing = todo.id === state.editingId
  const li = document.createElement('li')
  li.className = 'todo'
  li.dataset.id = todo.id
  li.draggable = canReorder && !isEditing
  if (todo.done) li.classList.add('is-done')
  if (isEditing) li.classList.add('is-editing')

  const handle = document.createElement('span')
  handle.className = 'drag-handle'
  handle.innerHTML = ICONS.grip
  if (canReorder && !isEditing) {
    handle.tabIndex = 0
    handle.setAttribute('role', 'button')
    handle.setAttribute('aria-label', 'Riordina attività con le frecce su e giù')
  } else {
    handle.classList.add('is-hidden')
    handle.setAttribute('aria-hidden', 'true')
  }
  li.append(handle)

  const checkLabel = document.createElement('label')
  checkLabel.className = 'todo-check'
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.className = 'check-input'
  checkbox.checked = todo.done
  checkbox.disabled = isEditing
  checkbox.dataset.action = 'toggle'
  checkbox.setAttribute(
    'aria-label',
    todo.done ? `Segna “${todo.title}” come da fare` : `Completa “${todo.title}”`,
  )
  const checkBox = document.createElement('span')
  checkBox.className = 'check-box'
  checkBox.innerHTML = ICONS.check
  checkLabel.append(checkbox, checkBox)
  li.append(checkLabel)

  const body = document.createElement('div')
  body.className = 'todo-body'

  if (isEditing) {
    body.append(buildEditForm(todo))
    li.append(body)
    return li
  }

  const main = document.createElement('div')
  main.className = 'todo-main'

  const title = document.createElement('p')
  title.className = 'todo-title'
  title.textContent = todo.title
  title.title = todo.title
  main.append(title)

  const meta = document.createElement('div')
  meta.className = 'todo-meta'

  const priority = PRIORITY_META[todo.priority]
  const priorityBadge = document.createElement('span')
  priorityBadge.className = `badge ${priority.className}`
  priorityBadge.innerHTML = ICONS.flag
  priorityBadge.append(priority.label)
  meta.append(priorityBadge)

  const dueInfo = getDueInfo(todo.due)
  if (dueInfo) {
    const dueBadge = document.createElement('span')
    dueBadge.className = `badge due due-${todo.done ? 'past' : dueInfo.state}`
    dueBadge.innerHTML = ICONS.clock
    dueBadge.append(dueInfo.label)
    dueBadge.title = `Scadenza: ${dueInfo.full}`
    meta.append(dueBadge)
  }

  const categoryBadge = document.createElement('span')
  categoryBadge.className = 'badge category'
  categoryBadge.textContent = `#${todo.category}`
  categoryBadge.title = `Categoria: ${todo.category}`
  meta.append(categoryBadge)

  main.append(meta)
  body.append(main)
  body.append(buildActions(todo))
  li.append(body)

  return li
}

function buildActions(todo) {
  const actions = document.createElement('div')
  actions.className = 'todo-actions'
  actions.append(
    actionButton('edit', `Modifica “${todo.title}”`, ICONS.edit),
    actionButton('delete', `Elimina “${todo.title}”`, ICONS.trash, 'danger'),
  )
  return actions
}

function actionButton(action, label, icon, extraClass = '') {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `icon-btn-sm${extraClass ? ` ${extraClass}` : ''}`
  button.dataset.action = action
  button.setAttribute('aria-label', label)
  button.title = label
  button.innerHTML = icon
  return button
}

function buildEditForm(todo) {
  const form = document.createElement('form')
  form.className = 'edit-form'
  form.noValidate = true

  const title = document.createElement('input')
  title.className = 'text-input input-sm edit-title'
  title.name = 'title'
  title.value = todo.title
  title.maxLength = 160
  title.autocomplete = 'off'
  title.setAttribute('aria-label', 'Titolo attività')
  form.append(title)

  const options = document.createElement('div')
  options.className = 'edit-options'

  const priority = document.createElement('select')
  priority.className = 'select input-sm'
  priority.name = 'priority'
  priority.setAttribute('aria-label', 'Priorità')
  for (const key of ['high', 'medium', 'low']) {
    const option = document.createElement('option')
    option.value = key
    option.textContent = PRIORITY_META[key].label
    option.selected = todo.priority === key
    priority.append(option)
  }

  const due = document.createElement('input')
  due.type = 'date'
  due.className = 'text-input input-sm'
  due.name = 'due'
  due.value = todo.due
  due.setAttribute('aria-label', 'Scadenza')

  const category = document.createElement('input')
  category.className = 'text-input input-sm edit-category'
  category.name = 'category'
  category.value = todo.category
  category.maxLength = 24
  category.autocomplete = 'off'
  category.placeholder = 'Categoria'
  category.setAttribute('list', 'category-options')
  category.setAttribute('aria-label', 'Categoria')

  options.append(priority, due, category)
  form.append(options)

  const actions = document.createElement('div')
  actions.className = 'edit-actions'

  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.className = 'btn btn-ghost btn-sm'
  cancel.dataset.action = 'cancel-edit'
  cancel.textContent = 'Annulla'

  const save = document.createElement('button')
  save.type = 'submit'
  save.className = 'btn btn-primary btn-sm'
  save.textContent = 'Salva'

  actions.append(cancel, save)
  form.append(actions)
  return form
}

function renderFilterState() {
  const counts = store.counts()

  for (const button of dom.filterButtons) {
    const filter = button.dataset.filter
    button.setAttribute('aria-pressed', String(filter === store.view.filter))
    const counter = button.querySelector('[data-count]')
    if (counter) counter.textContent = String(counts[filter])
  }
}

function renderCategories() {
  const categories = store.getCategories()
  const active = document.activeElement
  const hadFocus = dom.categoryFilters.contains(active)
  const focusedValue = hadFocus ? active?.dataset.category : null

  dom.categoryFilters.replaceChildren()
  dom.categoryFilters.hidden = categories.length === 0

  if (categories.length === 0) return

  dom.categoryFilters.append(
    categoryChip('all', 'Tutte', store.todos.length),
    ...categories.map((category) => categoryChip(category.name, category.name, category.count)),
  )

  if (hadFocus && focusedValue) {
    const chip = [...dom.categoryFilters.children].find(
      (child) => child.dataset.category === focusedValue,
    )
    chip?.focus()
  }
}

function categoryChip(value, label, count) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'cat-chip'
  button.dataset.category = value
  button.dataset.action = 'category'
  button.setAttribute('aria-pressed', String(store.view.category === value))
  if (store.view.category === value) button.classList.add('is-active')

  const text = document.createElement('span')
  text.textContent = label
  const counter = document.createElement('span')
  counter.className = 'cat-count'
  counter.textContent = String(count)

  button.append(text, counter)
  return button
}

function renderCategoryOptions() {
  const options = store.getCategories().map((category) => {
    const option = document.createElement('option')
    option.value = category.name
    return option
  })
  dom.categoryOptions.replaceChildren(...options)
}

function renderFooter() {
  const { total, active, completed } = store.counts()
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  const completedLabel = completed === 1 ? '1 completata' : `${completed} completate`
  dom.statsLeft.textContent =
    total === 0 ? 'Nessuna attività' : `${active} da fare · ${completedLabel}`
  dom.progressBar.style.width = `${percent}%`
  dom.progress.setAttribute('aria-valuenow', String(percent))
  dom.progressLabel.textContent = `${percent}%`

  dom.toggleAll.disabled = total === 0
  dom.toggleAll.textContent =
    total > 0 && active === 0 ? 'Segna tutte come da fare' : 'Segna tutte come completate'

  dom.clearCompleted.disabled = completed === 0
  dom.clearCompleted.textContent = completed
    ? `Cancella completate (${completed})`
    : 'Cancella completate'
}

function renderSaveStatus() {
  const available = store.storageAvailable

  dom.saveStatus.classList.toggle('is-error', !available)
  dom.saveStatusText.textContent = available
    ? 'Salvato in locale'
    : 'Salvataggio non disponibile'
  dom.saveStatus.title = available
    ? 'Le attività sono salvate automaticamente in questo browser e restano anche dopo la chiusura del server.'
    : 'Il browser blocca il salvataggio locale: consenti i dati del sito o disattiva la modalità privata.'
}

function renderEmptyState(visible) {
  const total = store.todos.length

  if (visible.length > 0) {
    dom.emptyState.hidden = true
    return
  }

  dom.emptyState.hidden = false

  if (total === 0) {
    dom.emptyTitle.textContent = 'Nessuna attività'
    dom.emptyText.textContent =
      'Aggiungi la tua prima attività per iniziare. Puoi indicare priorità, scadenza e categoria.'
    dom.emptyAction.hidden = true
  } else {
    dom.emptyTitle.textContent = 'Nessun risultato'
    dom.emptyText.textContent = 'Nessuna attività corrisponde ai filtri o alla ricerca attuali.'
    dom.emptyAction.hidden = false
  }
}

function syncControls() {
  dom.searchClear.hidden = store.view.query.length === 0
  dom.sort.value = store.prefs.sort
}

function applyPendingFocus() {
  const pending = state.pendingFocus
  if (!pending) return
  state.pendingFocus = null

  const root = pending.id ? todoElement(pending.id) : document
  const target = root?.querySelector(pending.selector)
  target?.focus()
}

function todoElement(id) {
  return dom.list.querySelector(`[data-id="${CSS.escape(id)}"]`)
}

/* ------------------------------------------------------------------------- */
/*  Tema                                                                      */
/* ------------------------------------------------------------------------- */

function applyTheme() {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme =
    store.prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : store.prefs.theme

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme

  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', theme === 'dark' ? '#121216' : '#f4f2ee')

  const nextLabel = theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'
  dom.themeToggle.setAttribute('aria-label', nextLabel)
  dom.themeToggle.title = nextLabel
}

/* ------------------------------------------------------------------------- */
/*  Azioni                                                                    */
/* ------------------------------------------------------------------------- */

function handleAdd(event) {
  event.preventDefault()

  const title = dom.title.value.trim()
  if (!title) {
    showFormError('Scrivi cosa devi fare prima di aggiungere l’attività.')
    dom.title.focus()
    return
  }

  clearFormError()

  let todo
  try {
    todo = store.add({
      title,
      priority: dom.priority.value,
      due: dom.due.value,
      category: dom.category.value,
    })
  } catch (error) {
    showFormError(error instanceof Error ? error.message : 'Impossibile aggiungere l’attività.')
    return
  }

  ensureVisible(todo)

  dom.title.value = ''
  dom.due.value = ''
  dom.title.focus()
  highlightTodo(todo.id)
}

function ensureVisible(todo) {
  const patch = {}
  const query = store.view.query.trim().toLocaleLowerCase('it')

  if (store.view.filter === 'completed') patch.filter = 'all'
  if (store.view.category !== 'all' && store.view.category !== todo.category) {
    patch.category = 'all'
  }
  if (query) {
    const haystack = `${todo.title}\n${todo.category}`.toLocaleLowerCase('it')
    if (!haystack.includes(query)) {
      patch.query = ''
      dom.search.value = ''
    }
  }

  if (Object.keys(patch).length > 0) store.setView(patch)
}

function highlightTodo(id) {
  const element = todoElement(id)
  if (!element) return

  element.classList.add('is-new')
  window.setTimeout(() => element.classList.remove('is-new'), 1000)
  element.scrollIntoView({ block: 'nearest' })
  element.animate?.(
    [
      { opacity: 0, transform: 'translateY(-6px) scale(0.995)' },
      { opacity: 1, transform: 'none' },
    ],
    { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' },
  )
}

function handleToggle(id) {
  const before = store.counts()
  const visible = store.getVisible()
  const index = visible.findIndex((todo) => todo.id === id)

  if (store.view.filter !== 'all') {
    // L'attività uscirà dalla vista filtrata: sposta il focus su quella vicina.
    const neighbour = visible[index + 1] ?? visible[index - 1] ?? null
    state.pendingFocus = neighbour
      ? { id: neighbour.id, selector: 'input[data-action="toggle"]' }
      : { selector: '#search' }
  } else {
    state.pendingFocus = { id, selector: 'input[data-action="toggle"]' }
  }

  store.toggle(id)

  if (before.active === 1 && store.counts().active === 0) {
    showToast('Tutto completato! Ottimo lavoro 🎉')
  }
}

function handleDelete(id) {
  const todo = store.getById(id)
  if (!todo) return

  const visible = store.getVisible()
  const index = visible.findIndex((item) => item.id === id)
  const neighbour = visible[index + 1] ?? visible[index - 1] ?? null

  if (state.editingId === id) state.editingId = null

  state.pendingFocus = neighbour
    ? { id: neighbour.id, selector: 'input[data-action="toggle"]' }
    : { selector: '#new-title' }

  store.remove(id)

  showToast(`“${truncate(todo.title, 42)}” eliminata`, {
    label: 'Annulla',
    onClick: () => store.undo(),
  })
}

function handleClearCompleted() {
  const removed = store.clearCompleted()
  if (removed === 0) return

  showToast(
    removed === 1
      ? '1 attività completata rimossa'
      : `${removed} attività completate rimosse`,
    { label: 'Annulla', onClick: () => store.undo() },
  )
}

function handleToggleAll() {
  const result = store.toggleAll()
  if (result.done) showToast('Tutte le attività completate! 🎉')
}

function startEditing(id) {
  state.editingId = id
  state.focusEdit = true
  render()
}

function cancelEditing(id) {
  state.editingId = null
  state.pendingFocus = { id, selector: '[data-action="edit"]' }
  render()
}

function handleEditSubmit(form) {
  const item = form.closest('li[data-id]')
  if (!item) return

  const id = item.dataset.id
  const data = new FormData(form)
  const title = String(data.get('title') ?? '').trim()

  if (!title) {
    const input = form.querySelector('.edit-title')
    form.classList.add('has-error')
    input?.setAttribute('aria-invalid', 'true')
    input?.focus()
    return
  }

  state.editingId = null
  state.pendingFocus = { id, selector: '[data-action="edit"]' }

  store.update(id, {
    title,
    priority: String(data.get('priority') ?? 'medium'),
    due: String(data.get('due') ?? ''),
    category: String(data.get('category') ?? ''),
  })
}

function resetFilters() {
  dom.search.value = ''
  store.setView({ filter: 'all', query: '', category: 'all' })
  dom.search.focus()
}

/* ------------------------------------------------------------------------- */
/*  Toast                                                                     */
/* ------------------------------------------------------------------------- */

function showToast(message, action = null) {
  window.clearTimeout(state.toastTimer)
  window.clearTimeout(state.toastHideTimer)

  dom.toastMessage.textContent = message
  state.toastAction = action?.onClick ?? null

  if (action) {
    dom.toastAction.hidden = false
    dom.toastAction.textContent = action.label ?? 'Annulla'
  } else {
    dom.toastAction.hidden = true
    dom.toastAction.textContent = ''
  }

  dom.toast.hidden = false
  requestAnimationFrame(() => dom.toast.classList.add('is-visible'))

  state.toastTimer = window.setTimeout(hideToast, action ? 8000 : 5000)
}

function hideToast() {
  window.clearTimeout(state.toastTimer)
  state.toastAction = null
  dom.toast.classList.remove('is-visible')

  state.toastHideTimer = window.setTimeout(() => {
    if (!dom.toast.classList.contains('is-visible')) dom.toast.hidden = true
  }, 220)
}

/* ------------------------------------------------------------------------- */
/*  Form error                                                                */
/* ------------------------------------------------------------------------- */

function showFormError(message) {
  dom.formError.textContent = message
  dom.formError.hidden = false
  dom.title.setAttribute('aria-invalid', 'true')
  dom.form.classList.remove('shake')
  void dom.form.offsetWidth
  dom.form.classList.add('shake')
}

function clearFormError() {
  dom.formError.hidden = true
  dom.formError.textContent = ''
  dom.title.removeAttribute('aria-invalid')
  dom.form.classList.remove('shake')
}

/* ------------------------------------------------------------------------- */
/*  Eventi                                                                    */
/* ------------------------------------------------------------------------- */

function bindEvents() {
  dom.form.addEventListener('submit', handleAdd)
  dom.title.addEventListener('input', clearFormError)

  dom.search.addEventListener('input', () => {
    store.setView({ query: dom.search.value })
  })

  dom.search.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    if (dom.search.value) {
      dom.search.value = ''
      store.setView({ query: '' })
    } else {
      dom.search.blur()
    }
  })

  dom.searchClear.addEventListener('click', () => {
    dom.search.value = ''
    store.setView({ query: '' })
    dom.search.focus()
  })

  for (const button of dom.filterButtons) {
    button.addEventListener('click', () => {
      store.setView({ filter: button.dataset.filter })
    })
  }

  dom.categoryFilters.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-action="category"]')
    if (!chip) return
    store.setView({ category: chip.dataset.category })
  })

  dom.sort.addEventListener('change', () => {
    store.setSort(dom.sort.value)
  })

  dom.toggleAll.addEventListener('click', handleToggleAll)
  dom.clearCompleted.addEventListener('click', handleClearCompleted)
  dom.emptyAction.addEventListener('click', resetFilters)

  dom.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    store.setTheme(next)
  })

  dom.list.addEventListener('click', handleListClick)
  dom.list.addEventListener('change', handleListChange)
  dom.list.addEventListener('submit', handleListSubmit)
  dom.list.addEventListener('keydown', handleListKeydown)
  dom.list.addEventListener('input', handleListInput)
  dom.list.addEventListener('dblclick', handleListDoubleClick)
  dom.list.addEventListener('dragstart', handleDragStart)
  dom.list.addEventListener('dragover', handleDragOver)
  dom.list.addEventListener('drop', handleDrop)
  dom.list.addEventListener('dragend', finishDrag)
  dom.list.addEventListener('dragleave', handleDragLeave)

  dom.toastAction.addEventListener('click', () => {
    const action = state.toastAction
    hideToast()
    action?.()
  })
  dom.toastClose.addEventListener('click', hideToast)

  dom.toast.addEventListener('mouseenter', () => window.clearTimeout(state.toastTimer))
  dom.toast.addEventListener('mouseleave', () => {
    if (!dom.toast.hidden) state.toastTimer = window.setTimeout(hideToast, 3000)
  })

  document.addEventListener('keydown', handleGlobalKeydown)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.prefs.theme === 'system') applyTheme()
  })

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    store.reload()
  })
}

function handleListClick(event) {
  const actionElement = event.target.closest('[data-action]')
  if (!actionElement) return

  const item = actionElement.closest('li[data-id]')
  if (!item) return

  const id = item.dataset.id

  switch (actionElement.dataset.action) {
    case 'edit':
      startEditing(id)
      break
    case 'cancel-edit':
      cancelEditing(id)
      break
    case 'delete':
      handleDelete(id)
      break
    default:
      break
  }
}

function handleListChange(event) {
  const checkbox = event.target.closest('input[data-action="toggle"]')
  if (!checkbox) return

  const item = checkbox.closest('li[data-id]')
  if (!item) return

  handleToggle(item.dataset.id)
}

function handleListSubmit(event) {
  const form = event.target.closest('.edit-form')
  if (!form) return

  event.preventDefault()
  handleEditSubmit(form)
}

function handleListInput(event) {
  const input = event.target.closest('.edit-title')
  if (!input) return

  const form = input.closest('.edit-form')
  form?.classList.remove('has-error')
  input.removeAttribute('aria-invalid')
}

function handleListKeydown(event) {
  if (event.key === 'Escape') {
    const form = event.target.closest('.edit-form')
    if (form) {
      const item = form.closest('li[data-id]')
      event.preventDefault()
      if (item) cancelEditing(item.dataset.id)
    }
    return
  }

  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

  const handle = event.target.closest('.drag-handle')
  if (!handle || !store.canReorder()) return

  const item = handle.closest('li[data-id]')
  if (!item) return

  const visible = store.getVisible()
  const index = visible.findIndex((todo) => todo.id === item.dataset.id)
  const neighbour = visible[event.key === 'ArrowUp' ? index - 1 : index + 1]
  if (!neighbour) return

  event.preventDefault()
  state.pendingFocus = { id: item.dataset.id, selector: '.drag-handle' }
  store.move(item.dataset.id, neighbour.id, event.key === 'ArrowDown')
}

function handleListDoubleClick(event) {
  if (event.target.closest('button, input, select, label, a')) return

  const item = event.target.closest('li[data-id]')
  if (!item || item.classList.contains('is-editing')) return

  startEditing(item.dataset.id)
}

/* ------------------------------------------------------------------------- */
/*  Drag & drop                                                               */
/* ------------------------------------------------------------------------- */

function handleDragStart(event) {
  if (!store.canReorder()) {
    event.preventDefault()
    return
  }

  const item = event.target.closest('li[data-id]')
  if (!item) return

  state.drag = { id: item.dataset.id, targetId: null, after: false }
  item.classList.add('is-dragging')

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.dataset.id)
  }
}

function handleDragOver(event) {
  if (!state.drag) return

  event.preventDefault()

  const item = event.target.closest('li[data-id]')
  if (!item || item.dataset.id === state.drag.id) {
    state.drag.targetId = null
    clearDropIndicators()
    return
  }

  const rect = item.getBoundingClientRect()
  const after = event.clientY > rect.top + rect.height / 2

  clearDropIndicators()
  item.classList.add(after ? 'drop-after' : 'drop-before')

  state.drag.targetId = item.dataset.id
  state.drag.after = after
}

function handleDragLeave(event) {
  if (!state.drag) return
  if (event.relatedTarget && dom.list.contains(event.relatedTarget)) return
  state.drag.targetId = null
  clearDropIndicators()
}

function handleDrop(event) {
  if (!state.drag) return

  event.preventDefault()

  const { id, targetId, after } = state.drag
  state.drag = null
  clearDropIndicators()

  if (!targetId || targetId === id) return

  state.pendingFocus = { id, selector: '.drag-handle' }
  store.move(id, targetId, after)
}

function finishDrag() {
  state.drag = null
  clearDropIndicators()
}

function clearDropIndicators() {
  for (const element of dom.list.querySelectorAll('.drop-before, .drop-after')) {
    element.classList.remove('drop-before', 'drop-after')
  }
}

/* ------------------------------------------------------------------------- */
/*  Scorciatoie globali                                                       */
/* ------------------------------------------------------------------------- */

function handleGlobalKeydown(event) {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return

  const target = event.target
  const isTyping =
    target instanceof HTMLElement &&
    (target.matches('input, textarea, select') || target.isContentEditable)
  if (isTyping) return

  if (event.key === '/') {
    event.preventDefault()
    dom.search.focus()
    dom.search.select()
    return
  }

  if (event.key.toLowerCase() === 'n') {
    event.preventDefault()
    dom.title.focus()
  }
}

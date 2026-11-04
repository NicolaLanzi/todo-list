const wrap = (content) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`

export const ICONS = {
  check: wrap('<path d="m5 12.5 4.2 4.2L19 7" />'),
  plus: wrap('<path d="M12 5v14M5 12h14" />'),
  edit: wrap('<path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />'),
  trash: wrap(
    '<path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />',
  ),
  clock: wrap('<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />'),
  flag: wrap(
    '<path d="M5 21V4" /><path d="M5 4h11l-2 3 2 3H5" />',
  ),
  grip: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" />
    <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
    <circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" />
  </svg>`,
}

export const PRIORITY_META = {
  high: { label: 'Alta', className: 'priority-high' },
  medium: { label: 'Media', className: 'priority-medium' },
  low: { label: 'Bassa', className: 'priority-low' },
}

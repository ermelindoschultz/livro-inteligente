function getListItems(content) {
  if (typeof content !== 'string') {
    return []
  }

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('- ') ? line.slice(2).trim() : line))
    .filter(Boolean)
}

export default function WhatYouWillLearn({ content }) {
  const items = getListItems(content)

  if (items.length === 0) {
    return <p className="text-sm leading-6 text-[var(--color-muted)]">Nenhum item disponivel.</p>
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-3 text-sm leading-6 text-[var(--color-ink)]">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
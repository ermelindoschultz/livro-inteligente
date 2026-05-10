function renderInlineBold(text) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g)

  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={`${segment}-${index}`}>{segment.slice(2, -2)}</strong>
    }

    return <span key={`${segment}-${index}`}>{segment}</span>
  })
}

function parseContent(content) {
  if (typeof content !== 'string') {
    return []
  }

  const lines = content
    .split('\n')
    .map((line) => line.trimEnd())

  const blocks = []
  let currentList = null

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList)
      currentList = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushList()
      continue
    }

    if (line.startsWith('- ')) {
      if (!currentList || currentList.kind !== 'bullet') {
        flushList()
        currentList = { kind: 'bullet', items: [] }
      }

      currentList.items.push(line.slice(2).trim())
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      if (!currentList || currentList.kind !== 'ordered') {
        flushList()
        currentList = { kind: 'ordered', items: [] }
      }

      currentList.items.push(line.replace(/^\d+\.\s+/, '').trim())
      continue
    }

    flushList()
    blocks.push({ kind: 'paragraph', text: line })
  }

  flushList()
  return blocks
}

export default function ResumeToTest({ content }) {
  const blocks = parseContent(content)

  if (blocks.length === 0) {
    return <p className="text-sm leading-6 text-[var(--color-muted)]">Resumo indisponivel.</p>
  }

  return (
    <div className="space-y-4 text-sm leading-6 text-[var(--color-ink)]">
      {blocks.map((block, index) => {
        if (block.kind === 'bullet') {
          return (
            <ul key={`bullet-${index}`} className="space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="list-disc marker:text-[var(--color-accent)]">
                  {renderInlineBold(item)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.kind === 'ordered') {
          return (
            <ol key={`ordered-${index}`} className="space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="list-decimal marker:font-semibold marker:text-[var(--color-accent)]">
                  {renderInlineBold(item)}
                </li>
              ))}
            </ol>
          )
        }

        return <p key={`paragraph-${index}`}>{renderInlineBold(block.text)}</p>
      })}
    </div>
  )
}
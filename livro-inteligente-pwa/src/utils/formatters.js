export function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) {
    return 'Equipe Livro Inteligente'
  }

  return authors.join(' • ')
}

export function formatDate(value) {
  if (!value) {
    return 'sem data'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatFileSize(bytes) {
  const size = Number(bytes)

  if (!Number.isFinite(size) || size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** exponent

  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: exponent === 0 ? 0 : 1,
  }).format(value)} ${units[exponent]}`
}
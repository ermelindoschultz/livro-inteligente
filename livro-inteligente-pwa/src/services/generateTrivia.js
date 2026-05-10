import { ApiConfigurationError, apiBaseUrl } from './api.js'

export async function generateTriviaForChapter({ bookId, markdownUrl, existingQuestions = [], pageId, chapterId }) {
  if (!apiBaseUrl) {
    throw new ApiConfigurationError('VITE_API_BASE_URL nao foi configurada para gerar novas trivias online.')
  }

  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new Error('bookId invalido para gerar trivia.')
  }

  if (typeof markdownUrl !== 'string' || markdownUrl.trim().length === 0) {
    throw new Error('O capitulo atual nao possui markdown remoto para gerar trivia.')
  }

  if (typeof pageId !== 'string' || pageId.trim().length === 0) {
    throw new Error('A pagina atual nao possui pageId valido para gerar trivia.')
  }

  if (typeof chapterId !== 'string' || chapterId.trim().length === 0) {
    throw new Error('O capitulo hospedeiro da trivia nao foi identificado.')
  }

  const response = await fetch(`${apiBaseUrl}/books/${bookId}/trivia/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      markdownUrl,
      pageId,
      chapterId,
      existingQuestions,
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error ?? `A API respondeu com status ${response.status} ao gerar trivia.`)
  }

  if (!payload?.data?.content) {
    throw new Error('A API nao retornou uma trivia valida.')
  }

  return payload.data
}
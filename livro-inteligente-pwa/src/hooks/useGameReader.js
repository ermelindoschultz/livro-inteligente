import { useReader } from './useReader.js'

function getMainChapters(chapters) {
  return chapters.filter((chapter) => chapter?.type === 'chapter')
}

function getChallengePages(chapters, challengeId) {
  if (!challengeId) {
    return []
  }

  return chapters.filter((chapter) => chapter.id === challengeId || chapter.parent_id === challengeId)
}

function getChallengeSections(chapters, challengeId) {
  if (!challengeId) {
    return []
  }

  return chapters.filter((chapter) => chapter.parent_id === challengeId)
}

function buildFallbackBoss(chapter, challengePages) {
  const sectionCount = Math.max(challengePages.length - 1, 1)

  return {
    name: `Guardiao do Capitulo ${chapter?.order ?? chapter?.position ?? '?'}`,
    title: 'Mestre da leitura superficial',
    description: `Uma ameaca dramatica que protege ${sectionCount} partes deste desafio e tenta vencer leitores distraidos.`,
    weakness: `Compreender as ideias centrais de ${chapter?.title ?? 'cada secao'} antes de responder.`,
    personality: 'Provocador, teatral e obcecado por respostas apressadas.',
  }
}

function buildFallbackBossQuestions(challengePages, chapter) {
  const prompts = [
    'Qual ideia central aparece com mais forca neste desafio?',
    'Qual exemplo do texto melhor demonstra a aplicacao pratica do capitulo?',
    'Que erro de interpretacao este capitulo ajuda a evitar?',
    'Se voce tivesse de explicar este capitulo a outra pessoa, qual foco viria primeiro?',
    'Que pista no texto ajuda a diferenciar entendimento real de memorizacao?',
  ]

  return prompts.map((prompt) => ({
    question: prompt,
    options: [
      { label: 'A', text: `A ideia central de ${chapter?.title ?? 'o capitulo'}` },
      { label: 'B', text: 'Um detalhe isolado sem relacao com o argumento principal' },
      { label: 'C', text: 'Um comentario que ignora a progressao do texto' },
      { label: 'D', text: `A ultima curiosidade encontrada em ${challengePages.at(-1)?.title ?? 'uma secao'}` },
    ],
    correct: 'A',
    explanation: 'O desafio foi desenhado para reforcar a compreensao das ideias centrais do capitulo, nao a lembranca de detalhes soltos.',
  }))
}

export function useGameReader({ book, metadata }) {
  const reader = useReader({ book, metadata })
  const mainChapters = getMainChapters(reader.chapters)
  const currentMainChapter =
    reader.currentChapter?.type === 'chapter'
      ? reader.currentChapter
      : mainChapters.find((chapter) => chapter.id === reader.currentChapter?.parent_id) ?? null
  const currentChallengePages = getChallengePages(reader.chapters, currentMainChapter?.id)
  const currentChallengeSections = getChallengeSections(reader.chapters, currentMainChapter?.id)
  const firstChallengePage = currentChallengeSections[0] ?? currentMainChapter ?? null
  const lastChallengePage = currentChallengePages.at(-1) ?? currentMainChapter ?? null
  const currentMainChapterIndex = mainChapters.findIndex((chapter) => chapter.id === currentMainChapter?.id)
  const nextMainChapter = currentMainChapterIndex >= 0 ? mainChapters[currentMainChapterIndex + 1] ?? null : null
  const isAtLastOfGroup = Boolean(reader.currentChapter && lastChallengePage && reader.currentChapter.id === lastChallengePage.id)

  const getBossMeta = (challengeId = currentMainChapter?.id) => {
    const challenge = mainChapters.find((chapter) => chapter.id === challengeId)
    const pages = getChallengePages(reader.chapters, challengeId)

    if (!challenge) {
      return null
    }

    return challenge.boss ?? buildFallbackBoss(challenge, pages)
  }

  const getBossQuestions = (challengeId = currentMainChapter?.id) => {
    const challenge = mainChapters.find((chapter) => chapter.id === challengeId)
    const pages = getChallengePages(reader.chapters, challengeId)
    const bossQuestions = Array.isArray(challenge?.enrichment)
      ? challenge.enrichment
          .filter((item) => item?.type === 'boss_trivia' && item?.page_id === challengeId)
          .map((item) => item.content)
      : []

    if (bossQuestions.length > 0) {
      return bossQuestions.slice(0, 5)
    }

    return buildFallbackBossQuestions(pages, challenge).slice(0, 5)
  }

  return {
    ...reader,
    mainChapters,
    currentMainChapter,
    currentChallengePages,
    firstChallengePage,
    lastChallengePage,
    nextMainChapter,
    isAtLastOfGroup,
    getBossMeta,
    getBossQuestions,
  }
}
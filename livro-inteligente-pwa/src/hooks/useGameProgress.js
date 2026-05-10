import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getGameProgressMap,
  markBossDefeated as persistBossDefeated,
  markIntroSeen as persistIntroSeen,
  saveBossProgress as persistBossProgress,
} from '../services/gameProgress.js'

function getQueryKey(bookId) {
  return ['game-progress', bookId ?? null]
}

export function useGameProgress(bookId) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: getQueryKey(bookId),
    queryFn: () => getGameProgressMap(bookId),
    enabled: Boolean(bookId),
    staleTime: Infinity,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getQueryKey(bookId) })

  const markIntroSeen = async (challengeId) => {
    const record = await persistIntroSeen(bookId, challengeId)
    await invalidate()
    return record
  }

  const saveBossProgress = async (challengeId, bossCorrectCount) => {
    const record = await persistBossProgress(bookId, challengeId, bossCorrectCount)
    await invalidate()
    return record
  }

  const markBossDefeated = async (challengeId) => {
    const record = await persistBossDefeated(bookId, challengeId)
    await invalidate()
    return record
  }

  return {
    ...query,
    progressMap: query.data ?? {},
    markIntroSeen,
    saveBossProgress,
    markBossDefeated,
  }
}
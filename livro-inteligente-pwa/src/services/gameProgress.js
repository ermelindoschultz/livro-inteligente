import { deleteGameProgress, libraryDb } from './db.js'

function now() {
  return new Date().toISOString()
}

function normalizeGameProgress(bookId, challengeId, patch, currentRecord) {
  return {
    bookId,
    challengeId,
    introSeen: patch.introSeen ?? currentRecord?.introSeen ?? false,
    bossDefeated: patch.bossDefeated ?? currentRecord?.bossDefeated ?? false,
    bossCorrectCount: patch.bossCorrectCount ?? currentRecord?.bossCorrectCount ?? 0,
    updatedAt: now(),
  }
}

export async function listGameProgress(bookId) {
  if (!bookId) {
    return []
  }

  return libraryDb.gameProgress.where('bookId').equals(bookId).toArray()
}

export async function getGameProgressMap(bookId) {
  const records = await listGameProgress(bookId)

  return Object.fromEntries(records.map((record) => [record.challengeId, record]))
}

export async function upsertGameProgress(bookId, challengeId, patch = {}) {
  if (!bookId || !challengeId) {
    throw new Error('bookId e challengeId sao obrigatorios para persistir o progresso do desafio.')
  }

  const currentRecord = await libraryDb.gameProgress.get([bookId, challengeId])
  const record = normalizeGameProgress(bookId, challengeId, patch, currentRecord)
  await libraryDb.gameProgress.put(record)
  return record
}

export async function markIntroSeen(bookId, challengeId) {
  return upsertGameProgress(bookId, challengeId, { introSeen: true })
}

export async function saveBossProgress(bookId, challengeId, bossCorrectCount) {
  const currentRecord = await libraryDb.gameProgress.get([bookId, challengeId])
  const nextCorrectCount = Math.max(currentRecord?.bossCorrectCount ?? 0, bossCorrectCount ?? 0)

  return upsertGameProgress(bookId, challengeId, {
    bossCorrectCount: nextCorrectCount,
    bossDefeated: nextCorrectCount >= 5 ? true : currentRecord?.bossDefeated ?? false,
  })
}

export async function markBossDefeated(bookId, challengeId) {
  return upsertGameProgress(bookId, challengeId, {
    introSeen: true,
    bossDefeated: true,
    bossCorrectCount: 5,
  })
}

export async function resetGameProgress(bookId) {
  await deleteGameProgress(bookId)
}
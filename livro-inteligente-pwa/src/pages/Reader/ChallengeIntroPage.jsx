import { useEffect } from 'react'
import { BookOpen } from 'pixelarticons/react/BookOpen'
import { Clock } from 'pixelarticons/react/Clock'
import { Shield } from 'pixelarticons/react/Shield'
import { Sword } from 'pixelarticons/react/Sword'
import BossAvatar from '../../components/GameAssets/BossAvatar.jsx'
import RetroDialog from '../../components/GameAssets/RetroDialog.jsx'

function getDifficultyLabel(pageCount) {
  if (pageCount <= 3) {
    return 'Leve'
  }

  if (pageCount <= 5) {
    return 'Medio'
  }

  return 'Avancado'
}

export default function ChallengeIntroPage({ challenge, challengePages, bossMeta, onReveal, onStart }) {
  useEffect(() => {
    void onReveal?.()
  }, [onReveal])

  const sectionCount = Math.max(challengePages.length - 1, 1)
  const estimatedReadingTime = Math.max(6, challengePages.length * 4)
  const difficulty = getDifficultyLabel(challengePages.length)

  return (
    <section className="space-y-5 rounded-[24px] border border-[var(--color-line)] bg-[rgba(255,250,241,0.9)] p-5 shadow-[0_20px_50px_rgba(47,36,25,0.08)] sm:p-6">
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        <span className="rounded-full border border-[var(--color-line)] bg-white/80 px-3 py-1">Desafio {challenge?.order ?? challenge?.position ?? '-'}</span>
        <span className="rounded-full border border-[var(--color-line)] bg-white/80 px-3 py-1">{difficulty}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_20rem] lg:items-start">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Introducao do desafio</p>
            <h2 className="font-display mt-2 text-3xl text-[var(--color-ink)]">{challenge?.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Explore {sectionCount} partes deste capitulo, identifique as ideias centrais e prepare-se para enfrentar um chefe que pune respostas superficiais.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-[var(--color-line)] bg-white/80 p-4">
              <div className="flex items-center gap-2 text-[var(--color-accent)]">
                <BookOpen width={20} height={20} />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Secoes</span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">{sectionCount}</p>
            </div>

            <div className="rounded-[18px] border border-[var(--color-line)] bg-white/80 p-4">
              <div className="flex items-center gap-2 text-[var(--color-accent)]">
                <Clock width={20} height={20} />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Leitura</span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">{estimatedReadingTime} min</p>
            </div>

            <div className="rounded-[18px] border border-[var(--color-line)] bg-white/80 p-4">
              <div className="flex items-center gap-2 text-[var(--color-accent)]">
                <Shield width={20} height={20} />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Fraqueza</span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-ink)]">{bossMeta?.weakness}</p>
            </div>
          </div>

          <RetroDialog message={bossMeta?.description ?? 'Um desafio dramatico aguarda no fim do capitulo.'} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-[18px] border border-[rgba(195,122,74,0.22)] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(173,92,40,0.25)]"
            >
              <Sword width={18} height={18} />
              Comecar leitura
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--color-line)] bg-[rgba(32,21,13,0.92)] p-5 text-white shadow-[0_18px_45px_rgba(47,36,25,0.2)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,245,232,0.7)]">Chefe do capitulo</p>
          <div className="mt-4 flex justify-center">
            <BossAvatar size={176} variationId={bossMeta?.variationId} />
          </div>
          <h3 className="mt-4 text-xl font-semibold">{bossMeta?.name}</h3>
          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-[rgba(255,245,232,0.72)]">{bossMeta?.title}</p>
          <p className="mt-4 text-sm leading-6 text-[rgba(255,245,232,0.86)]">{bossMeta?.personality}</p>
        </div>
      </div>
    </section>
  )
}
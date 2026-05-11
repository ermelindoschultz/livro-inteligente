import { useState } from 'react'
import { ArrowLeft } from 'pixelarticons/react/ArrowLeft'
import { ArrowRight } from 'pixelarticons/react/ArrowRight'
import { Crown } from 'pixelarticons/react/Crown'
import { Sword } from 'pixelarticons/react/Sword'
import { WarningDiamond } from 'pixelarticons/react/WarningDiamond'
import BossAvatar from '../../components/GameAssets/BossAvatar.jsx'
import HpBar from '../../components/GameAssets/HpBar.jsx'
import RetroDialog from '../../components/GameAssets/RetroDialog.jsx'

function getOptionClass({ hasSelection, isSelected, isCorrect }) {
  if (!hasSelection) {
    return 'border-[var(--color-line)] bg-[var(--color-paper-strong)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]'
  }

  if (isCorrect) {
    return 'border-[var(--color-success)] bg-[rgba(80,200,120,0.12)] text-[var(--color-success)]'
  }

  if (isSelected) {
    return 'border-[var(--color-danger)] bg-[rgba(232,64,64,0.12)] text-[var(--color-danger)]'
  }

  return 'border-[var(--color-line)] bg-[rgba(255,255,255,0.04)] text-[var(--color-muted)]'
}

export default function BossFightPage({
  challenge,
  bossMeta,
  questions,
  progress,
  onRetreat,
  onSaveBossProgress,
  onFinishBoss,
}) {
  const totalQuestions = questions.length
  const initialCorrectCount = Math.min(progress?.bossCorrectCount ?? 0, totalQuestions)
  const [correctCount, setCorrectCount] = useState(initialCorrectCount)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialCorrectCount)
  const [selectedOption, setSelectedOption] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [isCompleting, setIsCompleting] = useState(false)

  const question = questions[currentQuestionIndex] ?? null
  const hasSelection = Boolean(selectedOption)
  const isAnswerCorrect = question && selectedOption === question.correct
  const isVictorious = totalQuestions > 0 && correctCount >= totalQuestions
  const remainingBossHp = Math.max(totalQuestions - correctCount, 0)
  const battleMessage = isVictorious
    ? 'Golpe final. O chefe foi derrotado e o proximo desafio ja esta a caminho.'
    : lastResult === 'correct'
      ? 'Acerto critico. O chefe perdeu forca.'
      : lastResult === 'wrong'
        ? 'O chefe resistiu. Releia com calma e tente novamente depois.'
        : 'O chefe aguarda respostas cuidadosas. Cada acerto abre caminho para o proximo capitulo.'

  const handleSelectOption = async (optionLabel) => {
    if (!question || hasSelection || isVictorious) {
      return
    }

    setSelectedOption(optionLabel)

    if (optionLabel !== question.correct) {
      setLastResult('wrong')
      return
    }

    const nextCorrectCount = Math.min(correctCount + 1, totalQuestions)
    setCorrectCount(nextCorrectCount)
    setLastResult('correct')
    await onSaveBossProgress(nextCorrectCount)
  }

  const handleContinue = async () => {
    if (!question || !isAnswerCorrect) {
      return
    }

    setSelectedOption(null)

    if (correctCount >= totalQuestions) {
      return
    }

    setCurrentQuestionIndex((index) => Math.min(index + 1, totalQuestions - 1))
    setLastResult(null)
  }

  const handleFinish = async () => {
    setIsCompleting(true)

    try {
      await onFinishBoss()
    } finally {
      setIsCompleting(false)
    }
  }

  if (totalQuestions === 0) {
    return (
      <section className="space-y-4 border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <RetroDialog tone="warning" message="Esta batalha ainda nao recebeu perguntas finais. Gere o desafio novamente para liberar o chefe deste capitulo." />
        <button
          type="button"
          onClick={onRetreat}
          className="inline-flex items-center gap-2 border-2 border-[var(--color-line)] bg-transparent px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink)] font-[var(--font-pixel)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <ArrowLeft width={18} height={18} />
          Voltar a leitura
        </button>
      </section>
    )
  }

  if (isVictorious) {
    return (
      <section className="space-y-5 border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-center">
          <div className="border-2 border-[var(--color-line)] bg-[rgba(32,21,13,0.92)] p-5 text-white">
            <div className="flex justify-center">
              <BossAvatar size={176} defeated variationId={bossMeta?.variationId} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 border border-[var(--color-success)] bg-[rgba(80,200,120,0.12)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-success)] font-[var(--font-pixel)]">
              <Crown width={16} height={16} />
              Chefe derrotado
            </div>
            <h2 className="font-display text-3xl text-[var(--color-ink)]">{bossMeta?.name} caiu</h2>
            <RetroDialog tone="success" message="Sua leitura venceu a superficialidade. O proximo desafio ja pode ser iniciado." />
            <button
              type="button"
              onClick={handleFinish}
              disabled={isCompleting}
              className="inline-flex items-center gap-2 border-2 border-[var(--color-accent)] bg-[var(--color-accent)] px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[#0d0d0d] font-[var(--font-pixel)] hover:bg-transparent hover:text-[var(--color-accent)] disabled:opacity-60"
            >
              <ArrowRight width={18} height={18} />
              {isCompleting ? 'Avancando...' : 'Ir para o proximo desafio'}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5 border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <div className="border-2 border-[var(--color-line)] bg-[rgba(32,21,13,0.92)] p-5 text-white shadow-[var(--shadow-card)]">
          <div className="flex justify-center">
            <BossAvatar size={176} defeated={remainingBossHp === 0} variationId={bossMeta?.variationId} />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,245,232,0.7)]">Batalha do desafio</p>
          <h2 className="mt-2 text-2xl font-semibold">{bossMeta?.name}</h2>
          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-[rgba(255,245,232,0.72)]">{bossMeta?.title}</p>
          <p className="mt-4 text-sm leading-6 text-[rgba(255,245,232,0.86)]">{bossMeta?.description}</p>
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[rgba(255,245,232,0.72)]">
              <span>Forca do chefe</span>
              <span>{remainingBossHp}/{totalQuestions}</span>
            </div>
            <HpBar current={remainingBossHp} max={totalQuestions} />
          </div>
        </div>

        <div className="space-y-4">
          <RetroDialog tone={lastResult === 'wrong' ? 'warning' : lastResult === 'correct' ? 'success' : 'default'} message={battleMessage} />

          <div className="border-2 border-[var(--color-line)] bg-[var(--color-paper-strong)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-muted)] font-[var(--font-pixel)]">Pergunta {currentQuestionIndex + 1} de {totalQuestions}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{challenge?.title}</h3>
              </div>

              <div className="inline-flex items-center gap-2 border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent)] font-[var(--font-pixel)]">
                <Sword width={16} height={16} />
                {correctCount} acertos
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm font-semibold leading-6 text-[var(--color-ink)]">{question?.question}</p>

              <div className="space-y-2.5">
                {question?.options?.map((option) => {
                  const label = typeof option?.label === 'string' ? option.label : ''
                  const text = typeof option?.text === 'string' ? option.text : ''
                  const isSelected = selectedOption === label
                  const isCorrect = label === question?.correct

                  return (
                    <button
                      key={label || text}
                      type="button"
                      onClick={() => void handleSelectOption(label)}
                      disabled={hasSelection}
                      className={`flex w-full items-start gap-3 border-2 px-4 py-3 text-left text-sm transition disabled:cursor-default ${getOptionClass({ hasSelection, isSelected, isCorrect })}`}
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center border-2 border-current text-xs font-semibold uppercase">
                        {label}
                      </span>
                      <span className="min-w-0 flex-1 leading-6">{text}</span>
                    </button>
                  )
                })}
              </div>

              {hasSelection ? (
                <div className={`border-2 px-4 py-4 text-sm leading-6 ${isAnswerCorrect ? 'border-[var(--color-success)] bg-[rgba(80,200,120,0.12)] text-[var(--color-success)]' : 'border-[var(--color-danger)] bg-[rgba(232,64,64,0.12)] text-[var(--color-danger)]'}`}>
                  <div className="flex items-start gap-3">
                    {isAnswerCorrect ? <Sword width={18} height={18} /> : <WarningDiamond width={18} height={18} />}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{isAnswerCorrect ? 'Resposta correta.' : `Resposta incorreta. A alternativa correta e ${question?.correct}.`}</p>
                      <p className="mt-2">{question?.explanation ?? 'A justificativa detalhada sera adicionada na proxima geracao inteligente deste livro.'}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRetreat}
              className="inline-flex items-center gap-2 border-2 border-[var(--color-line)] bg-transparent px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink)] font-[var(--font-pixel)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <ArrowLeft width={18} height={18} />
              Voltar
            </button>

            {hasSelection && isAnswerCorrect ? (
              <button
                type="button"
                onClick={() => void handleContinue()}
                className="inline-flex items-center gap-2 border-2 border-[var(--color-accent)] bg-[var(--color-accent)] px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[#0d0d0d] font-[var(--font-pixel)] hover:bg-transparent hover:text-[var(--color-accent)]"
              >
                <ArrowRight width={18} height={18} />
                {correctCount >= totalQuestions ? 'Concluir batalha' : 'Proxima pergunta'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
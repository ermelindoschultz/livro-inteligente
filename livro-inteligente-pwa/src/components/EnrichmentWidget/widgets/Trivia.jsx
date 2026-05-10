import { useState } from 'react'

function getOptionButtonClass({ hasSelection, isSelected, isCorrect }) {
  if (!hasSelection) {
    return 'border-[var(--color-line)] bg-white/80 text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]'
  }

  if (isCorrect) {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900'
  }

  if (isSelected) {
    return 'border-[rgba(138,69,48,0.28)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
  }

  return 'border-[var(--color-line)] bg-[rgba(255,255,255,0.68)] text-[var(--color-muted)]'
}

export default function Trivia({ content }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const question = content?.question
  const options = Array.isArray(content?.options) ? content.options : []
  const correctOption = typeof content?.correct === 'string' ? content.correct : null
  const hasSelection = Boolean(selectedOption)
  const isAnswerCorrect = hasSelection && selectedOption === correctOption

  if (!question || options.length === 0 || !correctOption) {
    return <p className="text-sm leading-6 text-[var(--color-muted)]">Trivia indisponivel.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold leading-6 text-[var(--color-ink)]">{question}</p>

      <div className="space-y-2.5">
        {options.map((option) => {
          const label = typeof option?.label === 'string' ? option.label : ''
          const text = typeof option?.text === 'string' ? option.text : ''
          const isSelected = selectedOption === label
          const isCorrect = label === correctOption

          return (
            <button
              key={label || text}
              type="button"
              onClick={() => setSelectedOption(label)}
              disabled={hasSelection}
              className={`flex w-full items-start gap-3 rounded-[18px] border px-4 py-3 text-left text-sm transition disabled:cursor-default ${getOptionButtonClass({ hasSelection, isSelected, isCorrect })}`}
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold uppercase">
                {label}
              </span>
              <span className="min-w-0 flex-1 leading-6">{text}</span>
            </button>
          )
        })}
      </div>

      {hasSelection ? (
        <div
          className={`rounded-[18px] border px-4 py-3 text-sm leading-6 ${
            isAnswerCorrect
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-[rgba(138,69,48,0.24)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
          }`}
        >
          {isAnswerCorrect
            ? 'Resposta correta. Continue a leitura.'
            : `Resposta incorreta. A alternativa correta e ${correctOption}.`}
        </div>
      ) : null}
    </div>
  )
}
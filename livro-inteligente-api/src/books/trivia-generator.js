const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const MAX_ATTEMPTS = 3;

const SYSTEM_PROMPT = `Você é um criador de quiz educacional.
Com base no conteúdo fornecido, crie UMA pergunta de treinamento em português.
Priorize compreensão, aplicação e leitura cuidadosa. Evite perguntas de decoração, pegadinhas ou mera cópia literal.
Não repita perguntas já existentes nem gere variações superficiais delas.
Responda APENAS com um objeto JSON válido, sem markdown, sem texto fora do JSON.

Estrutura esperada:
{
  "question": "<texto da pergunta>",
  "options": [
    { "label": "A", "text": "<alternativa>" },
    { "label": "B", "text": "<alternativa>" },
    { "label": "C", "text": "<alternativa>" },
    { "label": "D", "text": "<alternativa>" }
  ],
  "correct": "<letra da alternativa correta>",
  "explanation": "<explicacao curta dizendo por que a resposta correta faz sentido>"
}`;

function parseAiJsonResponse(result) {
	const payload = result?.response ?? result;

	if (typeof payload === 'string') {
		return JSON.parse(payload);
	}

	if (payload && typeof payload === 'object') {
		return payload;
	}

	throw new TypeError(`Unsupported AI response payload type: ${typeof payload}`);
}

function normalizeQuestionText(value) {
	return typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

function assertTriviaShape(trivia) {
	if (!trivia || typeof trivia !== 'object' || Array.isArray(trivia)) {
		throw new Error('A IA nao retornou um objeto de trivia valido.');
	}

	if (typeof trivia.question !== 'string' || trivia.question.trim().length === 0) {
		throw new Error('A trivia gerada nao possui pergunta valida.');
	}

	if (!Array.isArray(trivia.options) || trivia.options.length !== 4) {
		throw new Error('A trivia gerada nao possui exatamente 4 alternativas.');
	}

	for (const option of trivia.options) {
		if (typeof option?.label !== 'string' || option.label.trim().length !== 1) {
			throw new Error('A trivia gerada possui alternativa sem label valido.');
		}

		if (typeof option?.text !== 'string' || option.text.trim().length === 0) {
			throw new Error('A trivia gerada possui alternativa sem texto valido.');
		}
	}

	if (typeof trivia.correct !== 'string' || trivia.correct.trim().length !== 1) {
		throw new Error('A trivia gerada nao possui resposta correta valida.');
	}

	if (!trivia.options.some((option) => option.label === trivia.correct)) {
		throw new Error('A resposta correta nao corresponde a nenhuma alternativa.');
	}

	if (typeof trivia.explanation !== 'string' || trivia.explanation.trim().length === 0) {
		throw new Error('A trivia gerada nao possui explicacao valida.');
	}

	return {
		question: trivia.question.trim(),
		options: trivia.options.map((option) => ({
			label: option.label.trim().toUpperCase(),
			text: option.text.trim(),
		})),
		correct: trivia.correct.trim().toUpperCase(),
		explanation: trivia.explanation.trim(),
	};
}

export async function generateUniqueTrivia(pageContent, existingQuestions, ai) {
	const knownQuestions = new Set(existingQuestions.map(normalizeQuestionText).filter(Boolean));

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
		const avoidList = [...knownQuestions];
		const userPrompt = [
			`Conteudo da pagina:\n\n${pageContent}`,
			avoidList.length > 0
				? `\n\nPerguntas que ja existem e devem ser evitadas:\n- ${avoidList.join('\n- ')}`
				: '',
		].join('');

		const result = await ai.run(MODEL, {
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: userPrompt },
			],
		});

		const trivia = assertTriviaShape(parseAiJsonResponse(result));
		const normalizedQuestion = normalizeQuestionText(trivia.question);

		if (!knownQuestions.has(normalizedQuestion)) {
			return trivia;
		}

		knownQuestions.add(normalizedQuestion);
	}

	throw new Error('Nao foi possivel gerar uma pergunta nova sem repetir o capitulo atual.');
}
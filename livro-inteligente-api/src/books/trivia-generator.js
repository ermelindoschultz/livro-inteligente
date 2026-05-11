const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const MAX_ATTEMPTS = 2;

const SYSTEM_PROMPT = `Você é um criador de quiz educacional.
Com base no conteúdo fornecido, crie UMA pergunta de treinamento em português.
Priorize compreensão, aplicação e leitura cuidadosa. Evite perguntas de decoração, pegadinhas ou mera cópia literal.
Não repita perguntas já existentes nem gere variações superficiais delas.
Responda APENAS com um objeto JSON válido, sem markdown, sem texto fora do JSON.

IMPORTANTE: Escape corretamente todas as aspas nas strings com barra invertida (\\").
IMPORTANTE: Não inclua aspas não-escapadas dentro das strings JSON.
IMPORTANTE: Mantenha todas as strings em uma única linha, sem quebras de linha.
IMPORTANTE: A pergunta deve ter NO MÁXIMO 150 caracteres.
IMPORTANTE: Cada alternativa deve ter NO MÁXIMO 120 caracteres.
IMPORTANTE: A explicação deve ter NO MÁXIMO 200 caracteres.
IMPORTANTE: Seja conciso e direto em todas as strings.

Estrutura esperada:
{
  "question": "<texto da pergunta (max 150 caracteres)>",
  "options": [
    { "label": "A", "text": "<alternativa (max 120 caracteres)>" },
    { "label": "B", "text": "<alternativa (max 120 caracteres)>" },
    { "label": "C", "text": "<alternativa (max 120 caracteres)>" },
    { "label": "D", "text": "<alternativa (max 120 caracteres)>" }
  ],
  "correct": "<letra da alternativa correta>",
  "explanation": "<explicacao curta (max 200 caracteres)>"
}`;

function parseAiJsonResponse(result) {
	let payload = result?.response ?? result;

	if (typeof payload === 'string') {
		// Try to extract JSON from markdown code blocks
		const jsonMatch = payload.match(/```(?:json)?\s*([\s\S]*?)```/);
		if (jsonMatch) {
			payload = jsonMatch[1].trim();
		}

		// First, try parsing as-is
		try {
			return JSON.parse(payload);
		} catch {
			// If that fails, try to extract JSON
		}

		// Try to find the first { and last } to isolate JSON
		const jsonStart = payload.indexOf('{');
		const jsonEnd = payload.lastIndexOf('}');
		
		if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
			const extracted = payload.substring(jsonStart, jsonEnd + 1);
			try {
				return JSON.parse(extracted);
			} catch {
				// Continue to final parse attempt
			}
		}

		// Final attempt - let JSON.parse handle it with proper error
		try {
			return JSON.parse(payload);
		} catch (error) {
			const snippet = payload.substring(Math.max(0, error.position - 50), Math.min(payload.length, error.position + 50));
			const errorMsg = `Failed to parse AI JSON response: ${error.message}\n` +
				`Context around error: ...${snippet}...\n` +
				`Full response length: ${payload.length} characters`;
			
			const parseError = new Error(errorMsg);
			parseError.originalError = error;
			parseError.payload = payload;
			throw parseError;
		}
	}

	if (payload && typeof payload === 'object') {
		return payload;
	}

	throw new TypeError(`Unsupported AI response payload type: ${typeof payload}`);
}

function normalizeQuestionText(value) {
	return typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

function validateTrivia(trivia) {
	if (!trivia || typeof trivia !== 'object' || Array.isArray(trivia)) {
		return false;
	}

	if (typeof trivia.question !== 'string' || trivia.question.trim().length === 0) {
		return false;
	}

	if (!Array.isArray(trivia.options) || trivia.options.length !== 4) {
		return false;
	}

	for (const option of trivia.options) {
		if (typeof option?.label !== 'string' || option.label.trim().length !== 1) {
			return false;
		}

		if (typeof option?.text !== 'string' || option.text.trim().length === 0) {
			return false;
		}
	}

	if (typeof trivia.correct !== 'string' || trivia.correct.trim().length !== 1) {
		return false;
	}

	if (!trivia.options.some((option) => option.label === trivia.correct)) {
		return false;
	}

	if (typeof trivia.explanation !== 'string' || trivia.explanation.trim().length === 0) {
		return false;
	}

	// Enforce character limits
	const limits = {
		question: 150,
		optionText: 120,
		explanation: 200,
	};

	if (trivia.question.length > limits.question) {
		return false;
	}

	if (trivia.options.some(opt => opt.text.length > limits.optionText)) {
		return false;
	}

	if (trivia.explanation.length > limits.explanation) {
		return false;
	}

	return true;
}

function assertTriviaShape(trivia) {
	if (!validateTrivia(trivia)) {
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

		throw new Error('A trivia gerada excede os limites de caracteres permitidos.');
	}

	return normalizeTriviaOutput(trivia);
}

function normalizeTriviaOutput(trivia) {
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

		try {
			const result = await ai.run(MODEL, {
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					{ role: 'user', content: userPrompt },
				],
				max_tokens: 512,
				temperature: 0.7,
				response_format: {
					type: 'json_schema',
					json_schema: {
						type: 'object',
						properties: {
							question: { type: 'string' },
							options: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										label: { type: 'string' },
										text: { type: 'string' }
									},
									required: ['label', 'text']
								}
							},
							correct: { type: 'string' },
							explanation: { type: 'string' }
						},
						required: ['question', 'options', 'correct', 'explanation']
					}
				}
			});

			const trivia = assertTriviaShape(parseAiJsonResponse(result));
			const normalizedQuestion = normalizeQuestionText(trivia.question);

			if (!knownQuestions.has(normalizedQuestion)) {
				return trivia;
			}

			knownQuestions.add(normalizedQuestion);
		} catch (error) {
			console.warn(`Attempt ${attempt + 1} failed to generate unique trivia: ${error.message}`);
			if (attempt === MAX_ATTEMPTS - 1) {
				throw new Error(`Nao foi possivel gerar uma pergunta nova apos ${MAX_ATTEMPTS} tentativas: ${error.message}`);
			}
		}
	}

	throw new Error('Nao foi possivel gerar uma pergunta nova sem repetir o capitulo atual.');
}
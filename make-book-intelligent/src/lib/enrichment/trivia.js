import { parseAiJsonResponse } from './parse-ai-json-response.js';

// Best model for quick, engaging trivia generation (fast 8B, suitable for fun Q&A).
const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `Você é um criador de quiz educacional.
Com base no conteúdo fornecido, crie UMA pergunta de treinamento em português.
Priorize compreensão, aplicação e leitura cuidadosa. Evite perguntas de decoração, pegadinhas ou mera cópia literal.
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

export async function generateTrivia(pageContent, ai) {
	const result = await ai.run(MODEL, {
		messages: [
			{ role: 'system', content: SYSTEM_PROMPT },
			{
				role: 'user',
				content: `Conteúdo da página:\n\n${pageContent}`,
			},
		],
	});

	return parseAiJsonResponse(result);
}

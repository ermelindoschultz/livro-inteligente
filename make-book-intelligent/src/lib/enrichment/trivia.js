// Best model for quick, engaging trivia generation (fast 8B, suitable for fun Q&A).
const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `Você é um criador de quiz educacional.
Com base no conteúdo fornecido, crie UMA pergunta de trivia envolvente em português.
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
  "correct": "<letra da alternativa correta>"
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

	return JSON.parse(result.response);
}

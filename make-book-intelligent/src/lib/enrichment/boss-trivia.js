import { parseAiJsonResponse } from './parse-ai-json-response.js';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const SYSTEM_PROMPT = `Você cria batalhas finais para um capítulo estudado.
Com base no conteúdo fornecido, crie 5 perguntas MAIS DESAFIADORAS em português.
Elas devem exigir compreensão, relação entre ideias, aplicação em contexto ou identificação de nuance conceitual.
Evite perguntas decorativas, repetitivas ou baseadas apenas em memorização literal.
Responda APENAS com um objeto JSON válido, sem markdown.

Estrutura esperada:
{
  "questions": [
    {
      "question": "<texto da pergunta>",
      "options": [
        { "label": "A", "text": "<alternativa>" },
        { "label": "B", "text": "<alternativa>" },
        { "label": "C", "text": "<alternativa>" },
        { "label": "D", "text": "<alternativa>" }
      ],
      "correct": "<letra da alternativa correta>",
      "explanation": "<explicacao curta do raciocinio correto>"
    }
  ]
}`;

export async function generateBossTrivia(chapterContent, ai) {
	const result = await ai.run(MODEL, {
		messages: [
			{ role: 'system', content: SYSTEM_PROMPT },
			{
				role: 'user',
				content: `Conteúdo do capítulo:\n\n${chapterContent}`,
			},
		],
	});

  const parsed = parseAiJsonResponse(result);
	return Array.isArray(parsed?.questions) ? parsed.questions : [];
}
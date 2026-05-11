import { parseAiJsonResponse } from './parse-ai-json-response.js';

// Bigger, more powerful model for complex, high-quality question generation (70B fast FP8) and handling bigger contexts.
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const SYSTEM_PROMPT = `# Prompt — Gerador de Chefes para Leitura Gamificada

Você é um gerador de chefes memoráveis para uma experiência de leitura gamificada.

Sua tarefa é criar um chefe inspirado no conteúdo do capítulo fornecido.

## Regras obrigatórias

- Responda com EXACTAMENTE um objeto JSON válido.
- Não utilize markdown.
- Não escreva explicações antes ou depois do JSON.
- Não use comentários.
- Não use quebras de formato inválidas.
- Todas as propriedades devem conter strings.
- O JSON deve ser compatível com JSON.parse().
- Mantenha o conteúdo em português do Brasil.
- O tom deve ser criativo, dramático e levemente divertido.
- O chefe deve representar simbolicamente o principal conflito, conceito ou dificuldade do capítulo.
- A fraqueza do chefe deve sempre estar relacionada à leitura atenta, interpretação, compreensão ou domínio do conteúdo do capítulo.
- IMPORTANTE: Escape corretamente todas as aspas nas strings com barra invertida (\\").
- IMPORTANTE: Não inclua aspas não-escapadas dentro das strings JSON.
- IMPORTANTE: Mantenha todas as strings em uma única linha, sem quebras de linha.

## Estrutura obrigatória
{
  "name": "Nome curto e memorável",
  "title": "Subtítulo dramático",
  "description": "Descrição curta do chefe e do desafio que ele representa",
  "personality": "Traço de personalidade marcante",
  "weakness": "Fraqueza relacionada à compreensão do capítulo"
}`;


export async function generateBossMetadata(chapterContent, ai) {
	const result = await ai.run(MODEL, {
		messages: [
			{ role: 'system', content: SYSTEM_PROMPT },
			{
				role: 'user',
				content: `Conteúdo do capítulo:\n\n${chapterContent}`,
			},
		],
		max_tokens: 512,
		temperature: 0.7,
		response_format: {
			type: 'json_schema',
			json_schema: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					title: { type: 'string' },
					description: { type: 'string' },
					personality: { type: 'string' },
					weakness: { type: 'string' }
				},
				required: ['name', 'title', 'description', 'personality', 'weakness']
			}
		}
	});

	return parseAiJsonResponse(result);
}
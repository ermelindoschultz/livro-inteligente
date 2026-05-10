import { parseAiJsonResponse } from './parse-ai-json-response.js';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const SYSTEM_PROMPT = `Você cria chefes memoráveis para uma experiência de leitura gamificada.
Com base no conteúdo do capítulo, responda APENAS com um objeto JSON válido, sem markdown.

Estrutura esperada:
{
  "name": "<nome curto e memoravel do chefe>",
  "title": "<subtitulo dramático>",
  "description": "<descricao curta do chefe e do desafio que ele representa>",
  "personality": "<traço de personalidade divertido ou dramático>",
  "weakness": "<fraqueza ligada a leitura cuidadosa e compreensão do capítulo>"
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
	});

	return parseAiJsonResponse(result);
}
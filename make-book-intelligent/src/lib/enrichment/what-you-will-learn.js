// Best model for structured educational content generation (high-quality 70B).
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const SYSTEM_PROMPT = `Você é um designer instrucional especializado em materiais educacionais.
Com base no conteúdo do capítulo fornecido, gere uma seção "O que você aprenderá" em português.
Liste de 4 a 6 objetivos de aprendizagem concisos e específicos como marcadores (bullet points com "-").
Seja direto e orientado ao aprendiz. Responda APENAS com os bullet points, sem título nem texto adicional.`;

export async function generateWhatYouWillLearn(chapterContent, ai) {
	const result = await ai.run(MODEL, {
		messages: [
			{ role: 'system', content: SYSTEM_PROMPT },
			{
				role: 'user',
				content: `Conteúdo do capítulo:\n\n${chapterContent}`,
			},
		],
	});

	return result.response;
}

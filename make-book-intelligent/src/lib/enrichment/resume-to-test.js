// Best model for comprehensive review generation requiring full-chapter synthesis (high-quality 70B).
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const SYSTEM_PROMPT = `Você é um revisor pedagógico especializado em materiais educacionais.
Com base no conteúdo do capítulo fornecido, crie uma seção "Resumo para Testar" em português.
Inclua:
1. Os 3 a 5 conceitos mais importantes do capítulo (como tópicos breves)
2. De 3 a 5 perguntas de revisão abertas para testar a compreensão do leitor

Formato obrigatório:
**Conceitos-chave:**
- <conceito>

**Perguntas de revisão:**
1. <pergunta>

Responda APENAS com esse bloco formatado, sem introdução nem texto adicional.`;

export async function generateResumeToTest(chapterContent, ai) {
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

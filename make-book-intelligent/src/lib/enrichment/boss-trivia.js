import { parseAiJsonResponse } from './parse-ai-json-response.js';

// Bigger, more powerful model for complex, high-quality question generation (70B fast FP8) and handling bigger contexts.
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const QUESTIONS_COUNT = 5;

const SYSTEM_PROMPT = `# Prompt — Batalha Final do Capítulo

Você é um criador de batalhas finais para uma experiência de leitura gamificada.

Sua tarefa é gerar UMA pergunta avançada baseada no conteúdo do capítulo fornecido.

A pergunta deve avaliar:
- compreensão profunda,
- interpretação,
- relação entre conceitos,
- aplicação prática,
- análise crítica,
- identificação de nuances conceituais,
- consequências, implicações ou contradições do conteúdo.

Evite perguntas:
- decorativas,
- óbvias,
- repetitivas,
- puramente literais,
- baseadas apenas em memorização,
- respondidas diretamente por uma frase isolada do texto.
- **IMPORTANTES: Nunca repita perguntas já geradas. Crie sempre uma pergunta diferente.**

## Regras obrigatórias

- Responda com EXACTAMENTE um objeto JSON válido.
- Não utilize markdown.
- Não escreva nenhum texto antes ou depois do JSON.
- Não use comentários.
- Não inclua explicações fora da estrutura definida.
- O JSON deve ser compatível com JSON.parse().
- Todas as chaves e valores devem usar aspas duplas.
- Todas as propriedades devem existir.
- Gere EXATAMENTE 1 pergunta.
- A pergunta deve possuir EXATAMENTE 4 alternativas.
- Apenas UMA alternativa pode estar correta.
- As alternativas incorretas devem ser plausíveis.
- Evite alternativas absurdas ou facilmente descartáveis.
- O nível de dificuldade deve ser alto.
- A pergunta deve soar como uma "batalha final" de conhecimento do capítulo.
- IMPORTANTE: Escape corretamente todas as aspas nas strings com barra invertida (\\").
- IMPORTANTE: Não inclua aspas não-escapadas dentro das strings JSON.
- IMPORTANTE: Mantenha todas as strings em uma única linha, sem quebras de linha.
- IMPORTANTE: A pergunta deve ter NO MÁXIMO 150 caracteres.
- IMPORTANTE: Cada alternativa deve ter NO MÁXIMO 120 caracteres.
- IMPORTANTE: A explicação deve ter NO MÁXIMO 200 caracteres.
- IMPORTANTE: Seja conciso e direto em todas as strings.

## Estrutura obrigatória
{
  "question": "Texto da pergunta (max 150 caracteres)",
  "options": [
    { "label": "A", "text": "Alternativa A (max 120 caracteres)" },
    { "label": "B", "text": "Alternativa B (max 120 caracteres)" },
    { "label": "C", "text": "Alternativa C (max 120 caracteres)" },
    { "label": "D", "text": "Alternativa D (max 120 caracteres)" }
  ],
  "correct": "A",
  "explanation": "Explicação concisa e objetiva (max 200 caracteres)"
}`;

function validateQuestion(question) {
  if (
    !question ||
    typeof question !== 'object' ||
    typeof question.question !== 'string' ||
    !Array.isArray(question.options) ||
    question.options.length !== 4 ||
    !question.options.every(opt => opt.label && opt.text) ||
    !['A', 'B', 'C', 'D'].includes(question.correct) ||
    typeof question.explanation !== 'string'
  ) {
    return false;
  }

  return true;
}

export async function generateBossTrivia(chapterContent, ai) {
  const questions = [];

  for (let i = 0; i < QUESTIONS_COUNT; i++) {
    try {
      // Build context about previously generated questions
      let previousQuestionsContext = '';
      if (questions.length > 0) {
        const previousQuestions = questions
          .map((q, idx) => `${idx + 1}. ${q.question}`)
          .join('\n');
        previousQuestionsContext = `\n\nPerguntas já geradas (NUNCA repita essas):\n${previousQuestions}`;
      }

      const result = await ai.run(MODEL, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Conteúdo do capítulo:\n\n${chapterContent}\n\nGere a pergunta ${i + 1} de ${QUESTIONS_COUNT}.${previousQuestionsContext}`,
          },
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
      try {
        const question = parseAiJsonResponse(result);

        if (validateQuestion(question)) {
          questions.push(question);
        } else {
          // Try to sanitize if validation fails
          const sanitized = sanitizeQuestion(question);
          if (validateQuestion(sanitized)) {
            console.warn(`Question ${i + 1} was sanitized to fit limits`);
            questions.push(sanitized);
          } else {
            console.warn(`Question ${i + 1} failed validation even after sanitization, skipping...`);
          }
        }
      } catch (error) {
        console.warn(`Failed to parse question ${i + 1}: ${error.message}`);
      }
    } catch (error) {
      console.warn(`Failed to generate question ${i + 1}: ${error.message}`);
    }
  }

  return questions;
}
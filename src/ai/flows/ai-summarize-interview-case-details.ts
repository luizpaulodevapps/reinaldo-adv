'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InterviewAnswerSchema = z.object({
  question: z.string().describe('Pergunta da entrevista.'),
  answer: z.string().describe('Resposta fornecida pelo usuário.'),
  priority: z.string().optional().describe('Prioridade da pergunta no template: alta, media ou baixa.'),
  target: z.string().optional().describe('Destino definido no template para reaproveitamento.'),
});

const AiSummarizeInterviewCaseDetailsInputSchema = z.object({
  legalArea: z.string().describe('Área jurídica do caso.'),
  leadName: z.string().describe('Nome do cliente/lead.'),
  selectedAnswers: z.array(InterviewAnswerSchema).describe('Perguntas e respostas selecionadas para síntese.'),
});

export type AiSummarizeInterviewCaseDetailsInput = z.infer<typeof AiSummarizeInterviewCaseDetailsInputSchema>;

const AiSummarizeInterviewCaseDetailsOutputSchema = z.object({
  caseDetails: z.string().describe('Resumo jurídico estruturado para servir de base da petição inicial.'),
});

export type AiSummarizeInterviewCaseDetailsOutput = z.infer<typeof AiSummarizeInterviewCaseDetailsOutputSchema>;

const summarizeInterviewCaseDetailsPrompt = ai.definePrompt({
  name: 'summarizeInterviewCaseDetailsPrompt',
  input: { schema: AiSummarizeInterviewCaseDetailsInputSchema },
  output: { schema: AiSummarizeInterviewCaseDetailsOutputSchema },
  prompt: `Você é um analista jurídico especialista em triagem e preparação de petição inicial.
Responda sempre em Português (Brasil).

Objetivo:
Transformar os dados selecionados da entrevista em um texto técnico para o campo "Detalhes do Caso", pronto para apoiar elaboração da inicial.

Diretrizes:
- Organize em blocos curtos com títulos: FATOS RELEVANTES, FUNDAMENTOS INICIAIS, PEDIDOS INICIAIS, PENDÊNCIAS/PROVAS.
- Não invente fatos.
- Se faltar informação, explicite em PENDÊNCIAS/PROVAS.
- Priorize respostas marcadas com prioridade "alta".
- Escreva de forma clara, objetiva e acionável para advogado.

Área Jurídica: {{{legalArea}}}
Cliente/Lead: {{{leadName}}}

Perguntas e Respostas Selecionadas:
{{#each selectedAnswers}}
- Pergunta: {{{this.question}}}
  Resposta: {{{this.answer}}}
  Prioridade: {{{this.priority}}}
  Destino: {{{this.target}}}
{{/each}}
`,
});

const summarizeInterviewCaseDetailsFlow = ai.defineFlow(
  {
    name: 'summarizeInterviewCaseDetailsFlow',
    inputSchema: AiSummarizeInterviewCaseDetailsInputSchema,
    outputSchema: AiSummarizeInterviewCaseDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeInterviewCaseDetailsPrompt(input);
    if (!output) {
      throw new Error('Falha ao gerar detalhes do caso com IA.');
    }
    return output;
  }
);

export async function aiSummarizeInterviewCaseDetails(
  input: AiSummarizeInterviewCaseDetailsInput
): Promise<AiSummarizeInterviewCaseDetailsOutput> {
  return summarizeInterviewCaseDetailsFlow(input);
}

'use server';
/**
 * @fileOverview Flow de IA focado em realizar a análise profunda de uma entrevista jurídica.
 * 
 * - aiAnalyzeFullInterview - Processa as respostas e gera resumo, análise de teses e riscos.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeInterviewInputSchema = z.object({
  clientName: z.string(),
  interviewType: z.string(),
  responses: z.record(z.any()),
});

const AnalyzeInterviewOutputSchema = z.object({
  summary: z.string().describe('Um resumo executivo dos fatos narrados pelo cliente.'),
  legalAnalysis: z.string().describe('Uma análise jurídica técnica, identificando teses possíveis e riscos processuais.'),
  recommendations: z.string().describe('Próximos passos sugeridos e provas/documentos necessários.'),
});

export type AnalyzeInterviewOutput = z.infer<typeof AnalyzeInterviewOutputSchema>;

export async function aiAnalyzeFullInterview(input: z.infer<typeof AnalyzeInterviewInputSchema>): Promise<AnalyzeInterviewOutput> {
  return analyzeFullInterviewFlow(input);
}

const analyzeFullInterviewPrompt = ai.definePrompt({
  name: 'analyzeFullInterviewPrompt',
  input: { schema: AnalyzeInterviewInputSchema },
  output: { schema: AnalyzeInterviewOutputSchema },
  prompt: `Você é um analista jurídico sênior da banca RGMJ Advogados, especialista em Direito do Trabalho e Cível.
Sua tarefa é analisar a entrevista realizada com o cliente {{{clientName}}} para a demanda do tipo {{{interviewType}}}.

Abaixo estão as respostas capturadas durante o rito de triagem:
{{#each responses}}
- {{{@key}}}: {{{this}}}
{{/each}}

OBJETIVOS DA ANÁLISE:
1. SUMÁRIO EXECUTIVO: Sintetize os fatos de forma clara e objetiva.
2. ANÁLISE JURÍDICA: Identifique as teses de mérito (ex: horas extras, assédio, vínculo) e aponte os riscos (prescrição, falta de prova, contradições).
3. RECOMENDAÇÕES: Liste quais documentos o cliente deve enviar e quais testemunhas seriam ideais.

MANTENHA UM TOM PROFISSIONAL, TÉCNICO E ESTRATÉGICO.
Responda sempre em Português (Brasil).`,
});

const analyzeFullInterviewFlow = ai.defineFlow(
  {
    name: 'analyzeFullInterviewFlow',
    inputSchema: AnalyzeInterviewInputSchema,
    outputSchema: AnalyzeInterviewOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeFullInterviewPrompt(input);
    if (!output) {
      throw new Error('Falha ao processar análise da inteligência.');
    }
    return output;
  }
);

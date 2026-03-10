'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a strategic summary of a legal case.
 *
 * - generateCaseSummary - A function that handles the AI generation of a case summary.
 * - GenerateCaseSummaryInput - The input type for the generateCaseSummary function.
 * - GenerateCaseSummaryOutput - The return type for the generateCaseSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCaseSummaryInputSchema = z.object({
  caseId: z.string().describe('Unique identifier for the legal case.'),
  clientName: z.string().describe('The name of the client associated with the case.'),
  caseTitle: z.string().describe('The title or subject of the legal case.'),
  caseDescription: z.string().describe('A brief description of the legal case, including its background and primary claims.'),
  currentStatus: z.string().describe("The current legal status of the case (e.g., 'Awaiting Hearing', 'Appeal Phase', 'Settled')."),
  lastEvents: z.array(z.string()).describe('A list of recent significant events or updates in the case timeline.'),
  nextDeadlines: z.array(z.string()).describe('A list of upcoming judicial deadlines or important dates for the case.'),
  relatedParties: z.array(z.string()).describe('A list of other parties involved in the case, such as defendants or reclamadas.'),
  financialStatus: z.string().optional().describe('An optional high-level summary of the financial aspects related to the case.'),
});
export type GenerateCaseSummaryInput = z.infer<typeof GenerateCaseSummaryInputSchema>;

const GenerateCaseSummaryOutputSchema = z.object({
  keyFacts: z.string().describe('A concise summary of the most critical facts relevant to the case strategy, presented as a single paragraph or bullet points if appropriate.'),
  currentStatusSummary: z.string().describe('A brief overview of the current phase and key developments of the case.'),
  potentialNextSteps: z.string().describe('Recommended strategic next actions, legal procedures, or procedural steps that should be taken.'),
  risksAndChallenges: z.string().describe('Identification of potential legal risks, challenges, or obstacles that might impact the case outcome.'),
  strategicAnalysis: z.string().describe('An overall strategic analysis or recommendation for handling the case, considering its objectives and current standing.'),
});
export type GenerateCaseSummaryOutput = z.infer<typeof GenerateCaseSummaryOutputSchema>;

export async function generateCaseSummary(input: GenerateCaseSummaryInput): Promise<GenerateCaseSummaryOutput> {
  return generateCaseSummaryFlow(input);
}

const strategicSummaryPrompt = ai.definePrompt({
  name: 'strategicSummaryPrompt',
  input: { schema: GenerateCaseSummaryInputSchema },
  output: { schema: GenerateCaseSummaryOutputSchema },
  prompt: `You are an expert legal analyst specializing in labor law, tasked with providing a strategic summary of a legal case.
Your goal is to highlight key facts, current status, potential next steps, and risks to enable quick, informed decision-making.
Always respond in Portuguese (Brazil) following the provided JSON structure.

Analyze the following case data:

Case ID: {{{caseId}}}
Nome do Cliente: {{{clientName}}}
Título do Caso: {{{caseTitle}}}
Descrição do Caso: {{{caseDescription}}}
Status Atual: {{{currentStatus}}}

Eventos Recentes:
{{#if lastEvents}}
{{#each lastEvents}}- {{{this}}}
{{/each}}
{{else}}Nenhuma informação sobre eventos recentes.
{{/if}}

Próximos Prazos:
{{#if nextDeadlines}}
{{#each nextDeadlines}}- {{{this}}}
{{/each}}
{{else}}Nenhum prazo futuro registrado.
{{/if}}

Partes Relacionadas (Réus/Reclamadas):
{{#if relatedParties}}
{{#each relatedParties}}- {{{this}}}
{{/each}}
{{else}}Nenhum réu informado.
{{/if}}

Status Financeiro (Resumo): {{{financialStatus}}}

Based on this information, provide a comprehensive strategic summary. Ensure the summary is insightful, actionable, and adheres strictly to the output JSON schema provided.
`,
});

const generateCaseSummaryFlow = ai.defineFlow(
  {
    name: 'generateCaseSummaryFlow',
    inputSchema: GenerateCaseSummaryInputSchema,
    outputSchema: GenerateCaseSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await strategicSummaryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate case summary.');
    }
    return output;
  }
);

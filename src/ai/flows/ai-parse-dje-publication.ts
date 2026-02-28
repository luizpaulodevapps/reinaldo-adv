'use server';
/**
 * @fileOverview This file implements a Genkit flow for parsing judicial diary publications (DJE).
 *
 * - aiParseDjePublication - A function that handles the AI-powered parsing of DJE text.
 * - ParseDjePublicationInput - The input type for the aiParseDjePublication function.
 * - ParseDjePublicationOutput - The return type for the aiParseDjePublication function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseDjePublicationInputSchema = z.object({
  publicationText: z
    .string()
    .describe('The raw text of the judicial diary publication (DJE) to be parsed.'),
});
export type ParseDjePublicationInput = z.infer<typeof ParseDjePublicationInputSchema>;

const ParseDjePublicationOutputSchema = z.object({
  deadlineType: z
    .string()
    .optional()
    .describe('The identified type of deadline, if any (e.g., "Prazo para contestação", "Prazo para réplica", "Audiência").'),
  dueDate: z
    .string()
    .optional()
    .describe('The calculated due date for the deadline in YYYY-MM-DD format, if a deadline is identified.'),
  caseNumbers: z
    .array(z.string())
    .optional()
    .describe('An array of all related case numbers found within the publication.'),
  summary: z
    .string()
    .describe('A concise summary of the publication and its key implications for the case.'),
});
export type ParseDjePublicationOutput = z.infer<typeof ParseDjePublicationOutputSchema>;

export async function aiParseDjePublication(
  input: ParseDjePublicationInput
): Promise<ParseDjePublicationOutput> {
  return aiParseDjePublicationFlow(input);
}

const parseDjePublicationPrompt = ai.definePrompt({
  name: 'parseDjePublicationPrompt',
  input: {schema: ParseDjePublicationInputSchema},
  output: {schema: ParseDjePublicationOutputSchema},
  prompt: `You are an expert legal assistant specializing in Brazilian labor law.
Your task is to meticulously analyze the provided judicial diary publication (DJE) text and extract critical information.

Identify the following:
1.  **deadlineType**: The specific type of legal deadline mentioned. If multiple are present, prioritize the most recent or relevant. Examples: "Prazo para contestação", "Prazo para réplica", "Audiência", "Intimação para manifestação", "Cumprimento de sentença". If no clear deadline, leave empty.
2.  **dueDate**: The exact date by which the deadline must be met, formatted as 'YYYY-MM-DD'. If the deadline is stated in terms of days (e.g., "prazo de 15 dias"), calculate the exact date assuming the publication date is today, and working days (excluding weekends and national holidays if specified, otherwise count all days). If no clear due date, leave empty.
3.  **caseNumbers**: A list of all legal case numbers (e.g., "0001234-56.2023.8.26.0000") explicitly mentioned in the text. Ensure all formats are captured.
4.  **summary**: A concise and clear summary of the publication's content and its implications, focusing on actions required or significant updates.

If any information is not explicitly available or cannot be confidently inferred, omit that field or provide an empty array for lists, but always provide a summary.

--- Publication Text ---
{{{publicationText}}}
`,
});

const aiParseDjePublicationFlow = ai.defineFlow(
  {
    name: 'aiParseDjePublicationFlow',
    inputSchema: ParseDjePublicationInputSchema,
    outputSchema: ParseDjePublicationOutputSchema,
  },
  async input => {
    const {output} = await parseDjePublicationPrompt(input);
    return output!;
  }
);

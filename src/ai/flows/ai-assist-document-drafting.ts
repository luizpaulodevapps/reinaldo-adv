'use server';
/**
 * @fileOverview This file implements a Genkit flow for AI-assisted legal document drafting.
 *
 * - aiAssistDocumentDrafting - A function that generates an initial draft or suggests content for legal documents.
 * - AiAssistDocumentDraftingInput - The input type for the aiAssistDocumentDrafting function.
 * - AiAssistDocumentDraftingOutput - The return type for the aiAssistDocumentDrafting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistDocumentDraftingInputSchema = z.object({
  caseDetails: z
    .string()
    .describe(
      'Detailed information about the legal case, including parties, facts, legal arguments, and relevant dates.'
    ),
  documentType: z
    .string()
    .describe(
      "The type of legal document to draft (e.g., 'Initial Petition', 'Reply to Motion', 'Contract Draft')."
    ),
  specificInstructions: z
    .string()
    .optional()
    .describe(
      'Any specific instructions or points to include in the document draft.'
    ),
});
export type AiAssistDocumentDraftingInput = z.infer<
  typeof AiAssistDocumentDraftingInputSchema
>;

const AiAssistDocumentDraftingOutputSchema = z.object({
  draftContent: z
    .string()
    .describe(
      'The AI-generated draft content for the legal document, suitable for insertion into a Google Doc.'
    ),
  summary: z
    .string()
    .describe('A brief summary of the generated draft.'),
});
export type AiAssistDocumentDraftingOutput = z.infer<
  typeof AiAssistDocumentDraftingOutputSchema
>;

const aiAssistDocumentDraftingPrompt = ai.definePrompt({
  name: 'aiAssistDocumentDraftingPrompt',
  input: {schema: AiAssistDocumentDraftingInputSchema},
  output: {schema: AiAssistDocumentDraftingOutputSchema},
  prompt: `You are an expert legal document drafter for a law firm specialized in labor law.
Your task is to generate an initial draft for a legal document based on the provided case details and document type.
Focus on clarity, legal accuracy, and consistency with typical labor law practices.

Case Details: {{{caseDetails}}}

Document Type: {{{documentType}}}

{{#if specificInstructions}}
Specific Instructions: {{{specificInstructions}}}
{{/if}}

Generate the 'draftContent' for the legal document and a concise 'summary' of the draft. The draftContent should be comprehensive and ready for review.`,
});

const aiAssistDocumentDraftingFlow = ai.defineFlow(
  {
    name: 'aiAssistDocumentDraftingFlow',
    inputSchema: AiAssistDocumentDraftingInputSchema,
    outputSchema: AiAssistDocumentDraftingOutputSchema,
  },
  async (input) => {
    const {output} = await aiAssistDocumentDraftingPrompt(input);
    if (!output) {
      throw new Error('Failed to generate document draft.');
    }
    return output;
  }
);

export async function aiAssistDocumentDrafting(
  input: AiAssistDocumentDraftingInput
): Promise<AiAssistDocumentDraftingOutput> {
  return aiAssistDocumentDraftingFlow(input);
}

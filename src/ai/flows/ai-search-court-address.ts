'use server';
/**
 * @fileOverview Flow de IA focado em localizar o CEP oficial de órgãos judiciários.
 * 
 * - aiSearchCourtAddress - Localiza o CEP oficial e o número do prédio via Inteligência RGMJ.
 * - Este agente é instruído a ser 100% factual e não alucinar endereços.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchCourtAddressInputSchema = z.object({
  courtName: z.string().describe('O nome do fórum ou tribunal.'),
});

const SearchCourtAddressOutputSchema = z.object({
  zipCode: z.string().optional().describe('CEP oficial (00000-000)'),
  number: z.string().optional().describe('Número oficial do prédio'),
  found: z.boolean().describe('Se o CEP oficial foi localizado com certeza absoluta.'),
});

export type SearchCourtAddressOutput = z.infer<typeof SearchCourtAddressOutputSchema>;

export async function aiSearchCourtAddress(input: { courtName: string }): Promise<SearchCourtAddressOutput> {
  return aiSearchCourtAddressFlow(input);
}

const searchCourtAddressPrompt = ai.definePrompt({
  name: 'searchCourtAddressPrompt',
  input: {
    schema: z.object({
      courtName: z.string()
    })
  },
  output: {schema: SearchCourtAddressOutputSchema},
  prompt: `Você é um analista de logística de elite da banca RGMJ, especialista em endereços do Poder Judiciário Brasileiro.
Sua tarefa é retornar o CEP OFICIAL e o NÚMERO do prédio do órgão judiciário solicitado.

Órgão: {{{courtName}}}

REGRAS DE OURO (RIGOR MÁXIMO):
1. Retorne APENAS o CEP que consta no site oficial do tribunal (ex: trt2.jus.br) ou na base dos Correios.
2. Se o órgão for uma Vara do Trabalho (ex: Diadema, SBC, Barueri), forneça o CEP EXATO do edifício do fórum.
3. Se você não tiver 100% de certeza do CEP oficial deste endereço físico, retorne found=false.
4. NUNCA invente números de prédios ou CEPs aproximados. A precisão é vital para fins de citação judicial.
5. Fóruns grandes possuem CEPs específicos para o edifício. Priorize estes.`,
});

const aiSearchCourtAddressFlow = ai.defineFlow(
  {
    name: 'aiSearchCourtAddressFlow',
    inputSchema: SearchCourtAddressInputSchema,
    outputSchema: SearchCourtAddressOutputSchema,
  },
  async input => {
    const {output} = await searchCourtAddressPrompt({
      courtName: input.courtName
    });

    if (!output) {
      throw new Error('Falha ao consultar inteligência logística.');
    }
    return output;
  }
);

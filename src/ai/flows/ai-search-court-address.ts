'use server';
/**
 * @fileOverview Flow de IA para busca de endereços de órgãos judiciários.
 * 
 * - aiSearchCourtAddress - Função que localiza o endereço completo de um fórum/tribunal.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchCourtAddressInputSchema = z.object({
  courtName: z.string().describe('O nome do fórum, tribunal ou vara judiciária para buscar o endereço.'),
});

const SearchCourtAddressOutputSchema = z.object({
  zipCode: z.string().optional().describe('CEP formatado (00000-000)'),
  address: z.string().optional().describe('Logradouro (Rua, Avenida, etc)'),
  number: z.string().optional().describe('Número do prédio (se disponível)'),
  neighborhood: z.string().optional().describe('Bairro'),
  city: z.string().optional().describe('Cidade'),
  state: z.string().optional().describe('UF (Estado)'),
  found: z.boolean().describe('Se o endereço foi localizado com precisão.'),
});

export type SearchCourtAddressOutput = z.infer<typeof SearchCourtAddressOutputSchema>;

export async function aiSearchCourtAddress(input: { courtName: string }): Promise<SearchCourtAddressOutput> {
  return aiSearchCourtAddressFlow(input);
}

const searchCourtAddressPrompt = ai.definePrompt({
  name: 'searchCourtAddressPrompt',
  input: {schema: SearchCourtAddressInputSchema},
  output: {schema: SearchCourtAddressOutputSchema},
  prompt: `Você é um assistente jurídico de elite da banca RGMJ, especializado em logística do Poder Judiciário brasileiro.
Sua tarefa é encontrar o endereço oficial, completo e atualizado do seguinte órgão judiciário:

Órgão: {{{courtName}}}

Retorne os dados estruturados no formato JSON. 
REGRAS:
1. Se for uma Vara do Trabalho, localize o endereço exato do Fórum Trabalhista daquela localidade.
2. Certifique-se de que o CEP é o correto para o logradouro.
3. Se o endereço for complexo, priorize clareza no logradouro.
4. Se não encontrar com 100% de certeza, marque found=false.`,
});

const aiSearchCourtAddressFlow = ai.defineFlow(
  {
    name: 'aiSearchCourtAddressFlow',
    inputSchema: SearchCourtAddressInputSchema,
    outputSchema: SearchCourtAddressOutputSchema,
  },
  async input => {
    const {output} = await searchCourtAddressPrompt(input);
    if (!output) {
      throw new Error('Falha ao localizar endereço judiciário.');
    }
    return output;
  }
);

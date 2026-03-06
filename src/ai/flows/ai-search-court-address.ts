'use server';
/**
 * @fileOverview Flow de IA para busca de endereços de órgãos judiciários.
 * 
 * - aiSearchCourtAddress - Função que localiza o CEP e dados básicos de um fórum/tribunal.
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
  found: z.boolean().describe('Se o endereço foi localizado com precisão real.'),
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
Sua tarefa é encontrar o CEP e o endereço oficial do seguinte órgão judiciário:

Órgão: {{{courtName}}}

REGRAS CRÍTICAS DE PRECISÃO (RIGOR ABSOLUTO):
1. O seu principal objetivo é encontrar o CEP REAL do logradouro onde o fórum está situado.
2. Se for uma Vara do Trabalho (TRT), localize o Fórum Trabalhista oficial daquela localidade.
3. Se for Tribunal de Justiça (TJ), localize o Fórum Cível/Central ou a sede da Comarca.
4. EXEMPLOS DE REFERÊNCIA REAL:
   - "Vara do Trabalho de São Bernardo do Campo": Rua Santa Filomena, 727, Centro, CEP 09710-060.
   - "Vara do Trabalho de Diadema": Avenida Sete de Setembro, 922, Centro, CEP 09912-010.
   - "Vara do Trabalho de Santo André": Avenida Dom Pedro II, 555, Jardim, CEP 09080-001.
   - "Fórum Trabalhista Ruy Barbosa": Av. Marquês de São Vicente, 235, Barra Funda, São Paulo, CEP 01139-001.
5. Se não tiver certeza absoluta do CEP oficial, retorne found=false. Jamais retorne um CEP ou endereço fictício.`,
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
      throw new Error('Falha crítica ao acessar motor de busca judiciário.');
    }
    return output;
  }
);

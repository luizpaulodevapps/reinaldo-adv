'use server';
/**
 * @fileOverview Flow de IA para busca de endereços de órgãos judiciários integrado com Nominatim (OSM).
 * 
 * - aiSearchCourtAddress - Função que localiza o endereço real via Nominatim e estrutura via IA.
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

/**
 * Busca o endereço bruto no Nominatim (OpenStreetMap)
 */
async function fetchNominatim(query: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' forum tribunal')}&format=json&addressdetails=1&limit=1&countrycodes=br`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "RGMJ-Portal-Comando/1.0"
      }
    });
    const data = await res.json();
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Nominatim fetch error:", error);
    return null;
  }
}

export async function aiSearchCourtAddress(input: { courtName: string }): Promise<SearchCourtAddressOutput> {
  return aiSearchCourtAddressFlow(input);
}

const searchCourtAddressPrompt = ai.definePrompt({
  name: 'searchCourtAddressPrompt',
  input: {
    schema: z.object({
      courtName: z.string(),
      osmData: z.any().optional()
    })
  },
  output: {schema: SearchCourtAddressOutputSchema},
  prompt: `Você é um assistente jurídico de elite da banca RGMJ, especializado em logística do Poder Judiciário brasileiro.
Sua tarefa é extrair e formatar o endereço oficial do seguinte órgão judiciário:

Órgão: {{{courtName}}}

Dados de referência obtidos via satélite (Nominatim):
{{{json osmData}}}

REGRAS CRÍTICAS DE PRECISÃO:
1. Use os dados do Nominatim como fonte primária, mas limpe nomes redundantes (ex: remova "Fórum" do nome da rua se estiver lá por erro).
2. O CEP (postcode) deve estar no formato 00000-000.
3. Se o número (house_number) não estiver nos dados, tente inferir se for um fórum conhecido ou deixe em branco.
4. Identifique Bairro, Cidade e UF corretamente.
5. Se os dados forem inconsistentes ou não parecerem ser de um fórum/tribunal, retorne found=false.`,
});

const aiSearchCourtAddressFlow = ai.defineFlow(
  {
    name: 'aiSearchCourtAddressFlow',
    inputSchema: SearchCourtAddressInputSchema,
    outputSchema: SearchCourtAddressOutputSchema,
  },
  async input => {
    // 1. Consulta o Nominatim para pegar dados reais de GPS/Mapa
    const osmData = await fetchNominatim(input.courtName);
    
    // 2. Passa para a IA processar a bagunça do Nominatim e retornar o rito técnico RGMJ
    const {output} = await searchCourtAddressPrompt({
      courtName: input.courtName,
      osmData: osmData
    });

    if (!output) {
      throw new Error('Falha crítica ao acessar motor de busca judiciário.');
    }
    return output;
  }
);


/**
 * @fileOverview Serviço de integração profunda com Google Docs API.
 *
 * - createFormattedPetition: Cria e formata uma Petição Inicial completa.
 * - createRGMJDocument: Cria um documento Google Docs com conteúdo e formatação padrão RGMJ.
 */

interface PetitionParams {
  accessToken: string;
  clientName: string;
  clientData: string;
  defendantName: string;
  courtName: string;
  varaName: string;
  petitionContent: string;
}

export async function createFormattedPetition(params: PetitionParams) {
  const { accessToken, clientName, clientData, defendantName, courtName, varaName, petitionContent } = params;

  try {
    // 1. Criar o documento
    const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `PETIÇÃO INICIAL - ${clientName.toUpperCase()}`,
      }),
    });

    if (!createResponse.ok) throw new Error('Falha ao criar documento');
    const doc = await createResponse.json();
    const documentId = doc.documentId;

    // 2. Montar o rito de formatação (BatchUpdate)
    // Definimos fontes (Arial), Alinhamento (Justificado) e Negritos estratégicos.
    const requests = [
      {
        insertText: {
          location: { index: 1 },
          text: `EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DA ${varaName.toUpperCase()} DE ${courtName.toUpperCase()}\n\n\n\n` +
                `${clientName.toUpperCase()}, ${clientData}, por seu advogado que esta subscreve, vem à presença de Vossa Excelência propor a presente:\n\n` +
                `AÇÃO EM FACE DE ${defendantName.toUpperCase()}\n\n` +
                `--------------------------------------------------\n\n` +
                `${petitionContent}\n\n` +
                `--------------------------------------------------\n` +
                `Termos em que, pede deferimento.\n\n` +
                `${new Date().toLocaleDateString('pt-BR')}\n\n` +
                `DR. REINALDO GONÇALVES MIGUEL DE JESUS\n` +
                `OAB/SP XXX.XXX`,
        },
      },
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: 2000 }, // Ajustar conforme tamanho real
          paragraphStyle: {
            alignment: 'JUSTIFIED',
            lineSpacing: 115,
            spaceAbove: { magnitude: 10, unit: 'PT' },
          },
          fields: 'alignment,lineSpacing,spaceAbove',
        },
      },
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: 500 }, // Cabeçalho
          textStyle: {
            bold: true,
            fontSize: { magnitude: 12, unit: 'PT' },
            weightedFontFamily: { fontFamily: 'Arial' },
          },
          fields: 'bold,fontSize,weightedFontFamily',
        },
      }
    ];

    await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    return {
      documentId,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  } catch (error) {
    console.error('Erro Google Docs API:', error);
    throw error;
  }
}

/**
 * Cria um documento Google Docs com título e conteúdo de texto puro,
 * aplicando formatação padrão RGMJ (Arial, justificado, 12pt).
 */
export async function createRGMJDocument({
  accessToken,
  title,
  content,
}: {
  accessToken: string;
  title: string;
  content: string;
}): Promise<{ documentId: string; url: string }> {
  const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  if (!createResponse.ok) {
    const err = await createResponse.text();
    throw new Error(`Falha ao criar documento Google Docs: ${err}`);
  }

  const doc = await createResponse.json();
  const documentId: string = doc.documentId;

  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          insertText: { location: { index: 1 }, text: content },
        },
        {
          updateParagraphStyle: {
            range: { startIndex: 1, endIndex: Math.min(content.length + 1, 50000) },
            paragraphStyle: {
              alignment: 'JUSTIFIED',
              lineSpacing: 115,
              spaceAbove: { magnitude: 6, unit: 'PT' },
            },
            fields: 'alignment,lineSpacing,spaceAbove',
          },
        },
        {
          updateTextStyle: {
            range: { startIndex: 1, endIndex: Math.min(content.length + 1, 50000) },
            textStyle: {
              fontSize: { magnitude: 12, unit: 'PT' },
              weightedFontFamily: { fontFamily: 'Arial' },
            },
            fields: 'fontSize,weightedFontFamily',
          },
        },
      ],
    }),
  });

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

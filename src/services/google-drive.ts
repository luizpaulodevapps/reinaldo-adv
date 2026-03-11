'use server';

/**
 * @fileOverview Serviço de automação de Infraestrutura Documental no Google Drive.
 * 
 * - setupClientWorkspace: Cria a arquitetura de pastas jurídica para Clientes e Processos.
 */

interface DriveFolderParams {
  accessToken: string;
  rootFolderId: string;
  clientName: string;
  processInfo?: {
    number: string;
    description: string;
  };
}

export async function setupClientWorkspace(params: DriveFolderParams) {
  const { accessToken, rootFolderId, clientName, processInfo } = params;

  async function createFolder(name: string, parentId: string) {
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error('Drive API Error:', err);
      throw new Error(`Falha ao criar pasta: ${name}`);
    }
    
    return await response.json();
  }

  try {
    // 1. Criar Pasta do Cliente
    const clientFolder = await createFolder(clientName.toUpperCase(), rootFolderId);
    const clientFolderId = clientFolder.id;

    // 2. Criar Subpastas Padrão do Cliente
    const clientSubfolders = [
      "01_DOCUMENTOS_PESSOAIS",
      "02_PROVAS_GERAIS",
      "03_FINANCEIRO_CLIENTE",
      "04_PROCESSOS"
    ];

    const folderMap: Record<string, string> = {};
    for (const name of clientSubfolders) {
      const folder = await createFolder(name, clientFolderId);
      folderMap[name] = folder.id;
    }

    // 3. Se houver processo, criar estrutura de atos
    if (processInfo && folderMap["04_PROCESSOS"]) {
      const procFolderName = `${processInfo.number} - ${processInfo.description.toUpperCase()}`;
      const procFolder = await createFolder(procFolderName, folderMap["04_PROCESSOS"]);
      const procFolderId = procFolder.id;

      const procActs = [
        "01_DISTRIBUICAO",
        "02_PROCURACAO_SUBST",
        "03_DEFESA",
        "04_PROVAS_PROCESSUAIS",
        "05_SENTENCA_RECURSOS",
        "06_EXECUCAO"
      ];

      for (const act of procActs) {
        await createFolder(act, procFolderId);
      }
    }

    return { success: true, clientFolderId };
  } catch (error) {
    console.error('RGMJ Infrastructure Error:', error);
    throw error;
  }
}

/**
 * @fileOverview Serviço de automação de Infraestrutura Documental no Google Drive.
 * 
 * - setupClientWorkspace: Cria a arquitetura de pastas jurídica para Clientes e Processos.
 */

import {
  extractGoogleDriveFolderId,
  isValidGoogleDriveFolderId,
  toGoogleDriveFolderUrl,
} from '@/services/google-workspace';

interface DriveFolderParams {
  accessToken: string;
  rootFolderId: string;
  clientName: string;
  isLead?: boolean;
  processInfo?: {
    number: string;
    description: string;
  };
}

export async function createFolder(accessToken: string, name: string, parentId: string) {
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

export async function moveFile(accessToken: string, fileId: string, newParentId: string, oldParentId?: string) {
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newParentId}`;
  if (oldParentId) {
    url += `&removeParents=${oldParentId}`;
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Drive Move Error:', err);
    throw new Error(`Falha ao mover arquivo/pasta: ${fileId}`);
  }

  return await response.json();
}

export async function copyFile(accessToken: string, fileId: string, parentId: string, name: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      parents: [parentId],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Drive Copy Error:', err);
    throw new Error(`Falha ao copiar arquivo: ${fileId}`);
  }

  return await response.json();
}

export async function replaceDocTags(accessToken: string, docId: string, tagMap: Record<string, string>) {
  const requests = Object.entries(tagMap).map(([tag, value]) => ({
    replaceAllText: {
      containsText: {
        text: tag,
        matchCase: true,
      },
      replaceText: value || '---',
    },
  }));

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Docs API Error:', err);
    throw new Error(`Falha ao processar tags no documento: ${docId}`);
  }

  return await response.json();
}

export async function setupClientWorkspace(params: DriveFolderParams) {
  const { accessToken, rootFolderId, clientName, processInfo, isLead } = params;
  const normalizedRootFolderId = extractGoogleDriveFolderId(rootFolderId);

  if (!isValidGoogleDriveFolderId(normalizedRootFolderId)) {
    throw new Error('ID da pasta raiz do Google Drive inválido. Cole o ID ou a URL da pasta compartilhada.');
  }

  try {
    // 1. Criar Pasta do Cliente
    const folderName = isLead ? `[LEAD] ${clientName.toUpperCase()}` : clientName.toUpperCase();
    const clientFolder = await createFolder(accessToken, folderName, normalizedRootFolderId);
    const clientFolderId = clientFolder.id;
    let processFolderId: string | undefined;

    // 2. Criar Subpastas Padrão do Cliente
    const clientSubfolders = [
      "01_DOCUMENTOS_PESSOAIS",
      "02_PROVAS_GERAIS",
      "03_FINANCEIRO_CLIENTE",
      "04_PROCESSOS"
    ];

    const folderMap: Record<string, string> = {};
    for (const name of clientSubfolders) {
      const folder = await createFolder(accessToken, name, clientFolderId);
      folderMap[name] = folder.id;
    }

    // 3. Se houver processo, criar estrutura de atos
    if (processInfo && folderMap["04_PROCESSOS"]) {
      const procFolderName = `${processInfo.number} - ${processInfo.description.toUpperCase()}`;
      const procFolder = await createFolder(accessToken, procFolderName, folderMap["04_PROCESSOS"]);
      const procFolderId = procFolder.id;
      processFolderId = procFolderId;

      const procActs = [
        "01_DISTRIBUICAO",
        "02_PROCURACAO_SUBST",
        "03_DEFESA",
        "04_PROVAS_PROCESSUAIS",
        "05_SENTENCA_RECURSOS",
        "06_EXECUCAO"
      ];

      for (const act of procActs) {
        await createFolder(accessToken, act, procFolderId);
      }
    }

    return {
      success: true,
      clientFolderId,
      clientFolderUrl: toGoogleDriveFolderUrl(clientFolderId),
      processFolderId,
      processFolderUrl: processFolderId ? toGoogleDriveFolderUrl(processFolderId) : '',
    };
  } catch (error) {
    console.error('RGMJ Infrastructure Error:', error);
    throw error;
  }
}

export async function findFolderByName(accessToken: string, name: string, parentId?: string) {
  let query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  return data.files?.[0];
}

export async function checkFolderExists(accessToken: string, folderId: string) {
  if (!folderId) return false;
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,trashed`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  
  if (!response.ok) return false;
  const data = await response.json();
  return !data.trashed;
}

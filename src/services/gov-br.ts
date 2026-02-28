'use server';

/**
 * @fileOverview Serviço de integração com a API Gov.br (Conecta Gov)
 * Gerencia a autenticação OAuth2 (Client Credentials) e consultas ao Cadastro Base do Cidadão (CBC).
 */

let cachedToken: { token: string; expiry: number } | null = null;

/**
 * Obtém ou renova o Token JWT de acesso ao Conecta Gov.
 * O token é armazenado em cache por 2 horas para evitar sobrecarga no serviço de autenticação.
 */
async function getAccessToken() {
  const now = Date.now();
  
  // Retorna token do cache se ainda for válido (com margem de segurança de 5 min)
  if (cachedToken && cachedToken.expiry > now) {
    return cachedToken.token;
  }

  const clientId = process.env.GOV_BR_CLIENT_ID;
  const clientSecret = process.env.GOV_BR_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais Gov.br (Conecta Gov) não configuradas no servidor.');
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://apigateway.conectagov.estaleiro.serpro.gov.br/oauth2/jwt-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro Auth Gov.br:', errorData);
      throw new Error('Falha na autenticação com o servidor Gov.br.');
    }

    const data = await response.json();
    
    // Armazena em cache. expires_in vem em segundos.
    cachedToken = {
      token: data.access_token,
      expiry: now + (data.expires_in - 300) * 1000,
    };

    return cachedToken.token;
  } catch (error) {
    console.error('Erro crítico no serviço de Token Gov.br:', error);
    throw error;
  }
}

/**
 * Consulta os dados de uma pessoa física no Cadastro Base do Cidadão (CBC).
 * @param cpf String contendo o CPF (apenas números).
 */
export async function queryCpfGovBr(cpf: string) {
  const cleanCpf = cpf.replace(/\D/g, "");
  
  if (cleanCpf.length !== 11) {
    throw new Error('CPF inválido para consulta.');
  }

  try {
    const token = await getAccessToken();
    
    // Endpoint oficial do CBC para CPF
    const url = `https://apigateway.conectagov.estaleiro.serpro.gov.br/api/v1/cpf/${cleanCpf}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Erro na consulta ao Cadastro Base do Cidadão.');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na consulta CPF Gov.br:', error);
    throw error;
  }
}

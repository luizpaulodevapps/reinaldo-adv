
'use server';

/**
 * @fileOverview Serviço de integração tática com Google Calendar API para a banca RGMJ.
 * 
 * - pushActToGoogleCalendar: Injeta qualquer ato jurídico (audiência, prazo, diligência) na agenda do responsável.
 * - listGoogleEvents: Recupera a pauta para auditoria.
 */

interface CalendarEventParams {
  accessToken: string;
  act: {
    title: string;
    description?: string;
    location?: string;
    startDateTime: string; // ISO format
    endDateTime?: string;
    type: 'audiencia' | 'prazo' | 'diligencia' | 'atendimento' | 'freelance';
    processNumber?: string;
    clientName?: string;
  };
}

export async function pushActToGoogleCalendar({ accessToken, act }: CalendarEventParams) {
  if (!accessToken) return { success: false, error: 'Token de acesso não fornecido.' };

  const colorMap = {
    audiencia: "11", // Vermelho/Rose
    freelance: "7",  // Turquesa/Cyan
    prazo: "4",      // Amarelo/Gold
    diligencia: "9", // Azul
    atendimento: "5" // Amarelo
  };

  // Se for prazo, pode ser um evento de dia inteiro ou duração curta
  const isDeadline = act.type === 'prazo';
  
  const start = isDeadline 
    ? { date: act.startDateTime.split('T')[0] } 
    : { dateTime: act.startDateTime, timeZone: 'America/Sao_Paulo' };
    
  const end = isDeadline 
    ? { date: act.startDateTime.split('T')[0] } 
    : { 
        dateTime: act.endDateTime || new Date(new Date(act.startDateTime).getTime() + 60 * 60 * 1000).toISOString(), 
        timeZone: 'America/Sao_Paulo' 
      };

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: act.title,
          location: act.location || '',
          description: `${act.description || ''}\n\n--- DADOS RGMJ ---\nPROCESSO: ${act.processNumber || 'N/A'}\nCLIENTE: ${act.clientName || 'N/A'}\nTIPO: ${act.type.toUpperCase()}`,
          start,
          end,
          colorId: colorMap[act.type] || "1",
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
              { method: 'email', minutes: 1440 }, // 1 dia antes
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Calendar Error:', error);
      throw new Error('Falha ao sincronizar com Google Workspace.');
    }

    return await response.json();
  } catch (error) {
    console.error('RGMJ Calendar Push Error:', error);
    throw error;
  }
}

export async function listGoogleEvents(accessToken: string, timeMin?: string) {
  try {
    const queryParams = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('Falha na auditoria da agenda Google.');
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('RGMJ Calendar List Error:', error);
    throw error;
  }
}

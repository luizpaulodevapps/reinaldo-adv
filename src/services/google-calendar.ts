
'use server';

/**
 * @fileOverview Serviço de integração estratégica com Google Calendar API.
 * 
 * - listGoogleEvents: Recupera a pauta oficial da conta mestre ou do advogado logado.
 * - pushToGoogleCalendar: Injeta compromissos do LexFlow na agenda externa.
 */

interface CalendarSyncParams {
  accessToken: string;
  timeMin?: string;
  timeMax?: string;
}

export async function listGoogleEvents(params: CalendarSyncParams) {
  const { accessToken, timeMin, timeMax } = params;

  try {
    const queryParams = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMax) queryParams.append('timeMax', timeMax);

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

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Calendar API Error:', error);
      throw new Error('Falha na comunicação com Google Calendar.');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('RGMJ Calendar Sync Error:', error);
    throw error;
  }
}

export async function pushToGoogleCalendar(params: { accessToken: string; event: any }) {
  const { accessToken, event } = params;

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
          summary: event.title,
          description: event.notes || `Processo: ${event.processNumber || 'N/A'}`,
          location: event.location,
          start: {
            dateTime: event.startDateTime,
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            // Assume 1 hora de duração padrão para o rito
            dateTime: new Date(new Date(event.startDateTime).getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'email', minutes: 60 },
            ],
          },
        }),
      }
    );

    if (!response.ok) throw new Error('Falha ao injetar evento no Google.');
    return await response.json();
  } catch (error) {
    console.error('RGMJ Calendar Push Error:', error);
    throw error;
  }
}

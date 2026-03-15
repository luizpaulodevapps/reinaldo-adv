/**
 * @fileOverview Serviço de integração tática com Google Calendar API para a banca RGMJ.
 *
 * - pushActToGoogleCalendar: Injeta qualquer ato jurídico na agenda.
 * - updateGoogleCalendarEvent: Atualiza um evento existente via PATCH.
 * - deleteGoogleCalendarEvent: Remove um evento via DELETE.
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
    useMeet?: boolean;
  };
}

export type CalendarAct = CalendarEventParams['act'];

export class GoogleCalendarApiError extends Error {
  status: number;
  details: string;

  constructor(status: number, details: string) {
    super(`Google API Error: ${status}`);
    this.name = 'GoogleCalendarApiError';
    this.status = status;
    this.details = details;
  }
}

const COLOR_MAP: Record<string, string> = {
  audiencia: "11",
  freelance: "7",
  prazo: "4",
  diligencia: "9",
  atendimento: "5",
};

// Garante que o formato do fuso horário esteja correto para o Google
function formatGoogleDateTime(dt: string): string {
  if (!dt) return "";
  if (dt.includes('Z') || (dt.includes('-') && dt.lastIndexOf('-') > 10)) return dt;
  return `${dt}-03:00`;
}

function buildCalendarBody(act: CalendarEventParams['act']): any {
  const isDeadline = act.type === 'prazo';

  const start = isDeadline
    ? { date: act.startDateTime.split('T')[0] }
    : { dateTime: formatGoogleDateTime(act.startDateTime), timeZone: 'America/Sao_Paulo' };

  const end = isDeadline
    ? { date: act.startDateTime.split('T')[0] }
    : {
        dateTime: formatGoogleDateTime(
          act.endDateTime || new Date(new Date(act.startDateTime).getTime() + 60 * 60 * 1000).toISOString()
        ),
        timeZone: 'America/Sao_Paulo',
      };

  const body: any = {
    summary: act.title,
    location: act.location || '',
    description: `${act.description || ''}\n\n--- DADOS RGMJ ---\nPROCESSO: ${act.processNumber || 'N/A'}\nCLIENTE: ${act.clientName || 'N/A'}\nTIPO: ${act.type.toUpperCase()}`,
    start,
    end,
    colorId: COLOR_MAP[act.type] || "1",
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'email', minutes: 1440 },
      ],
    },
  };

  if (act.useMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `rgmj-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  return body;
}

function extractHangoutLink(data: any): string {
  return data.hangoutLink || (data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri) || '';
}

export async function pushActToGoogleCalendar({ accessToken, act }: CalendarEventParams) {
  if (!accessToken) return { success: false, error: 'Token de acesso não fornecido.' };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCalendarBody(act)),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new GoogleCalendarApiError(response.status, errorText);
  }

  const data = await response.json();
  return { ...data, hangoutLink: extractHangoutLink(data) };
}

export async function updateGoogleCalendarEvent({
  accessToken,
  calendarEventId,
  act,
}: {
  accessToken: string;
  calendarEventId: string;
  act: CalendarEventParams['act'];
}) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}?conferenceDataVersion=1`,
    {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCalendarBody(act)),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new GoogleCalendarApiError(response.status, errorText);
  }

  const data = await response.json();
  return { ...data, hangoutLink: extractHangoutLink(data) };
}

export async function deleteGoogleCalendarEvent({
  accessToken,
  calendarEventId,
}: {
  accessToken: string;
  calendarEventId: string;
}) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`,
    { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  // 204 = success, 404/410 = already deleted — all are acceptable
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const errorText = await response.text();
    throw new GoogleCalendarApiError(response.status, errorText);
  }
}

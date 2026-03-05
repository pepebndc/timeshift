import type { CalendarEvent, GoogleCalendar } from "./types";

const BASE = "https://www.googleapis.com/calendar/v3";

async function apiFetch<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `API error ${res.status}`);
  }

  return res.json();
}

export async function fetchCalendarList(token: string): Promise<GoogleCalendar[]> {
  const data = await apiFetch<{ items?: GoogleCalendar[] }>(
    `${BASE}/users/me/calendarList?minAccessRole=reader`,
    token
  );
  return data.items ?? [];
}

export async function fetchEvents(
  token: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
  onProgress?: (fetched: number) => void
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: "500",
    });

    if (pageToken) params.set("pageToken", pageToken);

    const data = await apiFetch<{
      items?: CalendarEvent[];
      nextPageToken?: string;
    }>(
      `${BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      token
    );

    if (data.items) {
      events.push(...data.items);
      onProgress?.(events.length);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}

export async function fetchAllCalendarsEvents(
  token: string,
  calendarIds: string[],
  timeMin: Date,
  timeMax: Date,
  onProgress?: (fetched: number, total: string) => void
): Promise<Array<{ event: CalendarEvent; calendarId: string }>> {
  const allEvents: Array<{ event: CalendarEvent; calendarId: string }> = [];

  for (const calendarId of calendarIds) {
    const events = await fetchEvents(token, calendarId, timeMin, timeMax, (n) => {
      onProgress?.(allEvents.length + n, calendarId);
    });

    for (const event of events) {
      // Skip declined and cancelled events
      if (event.status === "cancelled") continue;
      allEvents.push({ event, calendarId });
    }
  }

  return allEvents;
}

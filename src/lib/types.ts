// Google Calendar API types
export interface CalendarEventDateTime {
  dateTime?: string; // ISO 8601 with timezone offset, e.g. "2026-03-09T14:30:00-05:00"
  date?: string;     // All-day events, "YYYY-MM-DD"
  timeZone?: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  recurringEventId?: string;
  status?: string;
  organizer?: { email: string; displayName?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  htmlLink?: string;
  colorId?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  selected?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

// DST Analysis Engine types
export interface DSTGapWindow {
  start: Date;
  end: Date;
  /** How many minutes the offset diff changes vs baseline (negative = user tz loses an hour vs reference) */
  shiftMinutes: number;
}

export interface ShiftedEvent {
  event: CalendarEvent;
  calendarId: string;
  normalLocalTime: string;   // HH:MM in user's timezone (pre-gap reference)
  gapLocalTime: string;      // HH:MM during DST gap
  normalEndLocalTime: string;
  gapEndLocalTime: string;
  shiftMinutes: number;      // negative = appears earlier to user
  affectedDates: Date[];     // individual instance dates that are affected
  anchoredTimezone?: string; // timezone the event is anchored in (e.g. "America/New_York")
}

export interface Conflict {
  event1: CalendarEvent;
  event2: CalendarEvent;
  calendarId1: string;
  calendarId2: string;
  overlapStart: Date;
  overlapEnd: Date;
  overlapMinutes: number;
  date: Date;                // which day this conflict occurs
  dstCaused: boolean;       // true if one event is DST-shifted (wouldn't exist pre-gap)
}

export interface AnalysisInput {
  events: Array<{ event: CalendarEvent; calendarId: string }>;
  userTimezone: string;      // e.g. "Europe/Madrid"
  referenceTimezone: string; // e.g. "America/New_York" — auto-detected from event timezones
  windowStart: Date;
  windowEnd: Date;
}

export interface AnalysisOutput {
  dstWindows: DSTGapWindow[];
  shiftedEvents: ShiftedEvent[];
  conflicts: Conflict[];
  /** All timed events that fall within the analysis window (including unshifted ones) */
  gapEvents: Array<{ event: CalendarEvent; calendarId: string }>;
  userTimezone: string;
  referenceTimezone: string;
  totalEventsScanned: number;
}

// App state
export interface AppConfig {
  windowStart: Date;
  windowEnd: Date;
  selectedCalendarIds: string[];
}

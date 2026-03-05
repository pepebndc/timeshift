/**
 * DST Analysis Engine — pure TypeScript, zero external dependencies.
 * Uses the ECMAScript Intl API for all timezone computations.
 */

import type {
  AnalysisInput,
  AnalysisOutput,
  CalendarEvent,
  Conflict,
  DSTGapWindow,
  ShiftedEvent,
} from "./types";

// ---------------------------------------------------------------------------
// Timezone helpers
// ---------------------------------------------------------------------------

/**
 * Returns the UTC offset in minutes for a given timezone at a specific moment.
 * Positive = timezone is ahead of UTC (e.g. UTC+2 → 120), negative = behind.
 */
export function getUTCOffsetMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const p: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      p[part.type] = parseInt(part.value, 10);
    }
  }

  // Handle "24" hour (midnight edge case in some locales)
  const hour = p.hour === 24 ? 0 : p.hour;
  const localMs = Date.UTC(p.year, p.month - 1, p.day, hour, p.minute, p.second);
  return (localMs - date.getTime()) / 60000;
}

/**
 * Formats a Date as HH:MM in the given timezone.
 */
export function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Formats a Date as a readable date string in the given timezone.
 */
export function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Converts "HH:MM" string to minutes since midnight.
 */
function timeStringToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ---------------------------------------------------------------------------
// DST gap window detection
// ---------------------------------------------------------------------------

/**
 * Finds periods in `year` where the UTC offset *difference* between
 * userTimezone and referenceTimezone changes from its January baseline.
 * These are the "gap windows" where recurring meetings appear to shift time.
 */
export function findDSTGapWindows(
  year: number,
  userTimezone: string,
  referenceTimezone: string
): DSTGapWindow[] {
  // Baseline offset diff in mid-January (both hemispheres are in standard time)
  const janDate = new Date(Date.UTC(year, 0, 15, 12, 0, 0));
  const baselineDiff =
    getUTCOffsetMinutes(janDate, userTimezone) -
    getUTCOffsetMinutes(janDate, referenceTimezone);

  // Scan day by day for the whole year to find transition dates
  const transitionDates: Date[] = [];
  let prevDiff = baselineDiff;

  for (let dayOffset = 1; dayOffset < 366; dayOffset++) {
    const d = new Date(Date.UTC(year, 0, dayOffset, 12, 0, 0));
    const userOffset = getUTCOffsetMinutes(d, userTimezone);
    const refOffset = getUTCOffsetMinutes(d, referenceTimezone);
    const diff = userOffset - refOffset;

    if (diff !== prevDiff) {
      // Set transition to start-of-day UTC so it aligns with calendar days
      transitionDates.push(new Date(Date.UTC(year, 0, dayOffset)));
      prevDiff = diff;
    }
  }

  // Build gap windows (periods where diff !== baseline)
  const windows: DSTGapWindow[] = [];
  const allBoundaries = [
    new Date(Date.UTC(year, 0, 1)),
    ...transitionDates,
    new Date(Date.UTC(year + 1, 0, 1)),
  ];

  for (let i = 0; i < allBoundaries.length - 1; i++) {
    const start = allBoundaries[i];
    const end = allBoundaries[i + 1];
    const midDate = new Date((start.getTime() + end.getTime()) / 2);
    const midDiff =
      getUTCOffsetMinutes(midDate, userTimezone) -
      getUTCOffsetMinutes(midDate, referenceTimezone);

    if (midDiff !== baselineDiff) {
      windows.push({
        start,
        end,
        shiftMinutes: midDiff - baselineDiff,
      });
    }
  }

  return windows;
}

/**
 * Detects the "reference" timezone from a set of events by looking at
 * which non-local timezones appear most frequently in event timeZone fields.
 */
export function detectReferenceTimezone(
  events: Array<{ event: CalendarEvent }>,
  userTimezone: string
): string {
  const counts = new Map<string, number>();
  for (const { event } of events) {
    const tz = event.start.timeZone;
    if (tz && tz !== userTimezone) {
      counts.set(tz, (counts.get(tz) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return "America/New_York"; // sensible default
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------

export function analyzeEvents(input: AnalysisInput): AnalysisOutput {
  const { events, userTimezone, windowStart, windowEnd } = input;
  let { referenceTimezone } = input;

  // Auto-detect reference timezone if not provided or needs refinement
  if (!referenceTimezone) {
    referenceTimezone = detectReferenceTimezone(events, userTimezone);
  }

  const year = windowStart.getFullYear();
  const dstWindows = findDSTGapWindows(year, userTimezone, referenceTimezone);

  // Relevant DST windows that overlap with the analysis period
  const relevantWindows = dstWindows.filter(
    (w) => w.start < windowEnd && w.end > windowStart
  );

  // Pre-gap reference period: 14 days before windowStart
  const preGapStart = new Date(windowStart.getTime() - 14 * 24 * 60 * 60 * 1000);
  const preGapEnd = windowStart;

  // Separate events into pre-gap (reference) and gap (analysis)
  const preGapEvents = events.filter(({ event }) => {
    if (!event.start.dateTime) return false;
    const start = new Date(event.start.dateTime);
    return start >= preGapStart && start < preGapEnd;
  });

  const gapEvents = events.filter(({ event }) => {
    if (!event.start.dateTime) return false;
    const start = new Date(event.start.dateTime);
    return start >= windowStart && start <= windowEnd;
  });

  // Group pre-gap events by recurring ID (or own ID for non-recurring)
  const preGapByKey = new Map<string, Array<{ event: CalendarEvent; calendarId: string }>>();
  for (const item of preGapEvents) {
    const key = item.event.recurringEventId ?? item.event.id;
    if (!preGapByKey.has(key)) preGapByKey.set(key, []);
    preGapByKey.get(key)!.push(item);
  }

  // Group gap events by recurring ID
  const gapByKey = new Map<string, Array<{ event: CalendarEvent; calendarId: string }>>();
  for (const item of gapEvents) {
    const key = item.event.recurringEventId ?? item.event.id;
    if (!gapByKey.has(key)) gapByKey.set(key, []);
    gapByKey.get(key)!.push(item);
  }

  // Detect shifted events
  const shiftedEvents: ShiftedEvent[] = [];
  const shiftedEventIds = new Set<string>();

  for (const [key, gapItems] of gapByKey) {
    const preItems = preGapByKey.get(key);
    if (!preItems || preItems.length === 0) continue;

    // Use the last pre-gap instance as reference (closest to the gap)
    const refItem = preItems[preItems.length - 1];
    const refStart = new Date(refItem.event.start.dateTime!);
    const refEnd = new Date(refItem.event.end.dateTime ?? refItem.event.start.dateTime!);
    const normalTime = formatTime(refStart, userTimezone);
    const normalEndTime = formatTime(refEnd, userTimezone);

    const affectedDates: Date[] = [];
    let gapTime: string | null = null;
    let gapEndTime: string | null = null;
    let shiftMinutesVal = 0;

    for (const { event } of gapItems) {
      const instanceStart = new Date(event.start.dateTime!);
      const instanceEnd = new Date(event.end.dateTime ?? event.start.dateTime!);
      const instanceTime = formatTime(instanceStart, userTimezone);

      if (instanceTime !== normalTime) {
        affectedDates.push(instanceStart);
        gapTime = instanceTime;
        gapEndTime = formatTime(instanceEnd, userTimezone);
        shiftMinutesVal =
          timeStringToMinutes(instanceTime) - timeStringToMinutes(normalTime);
        shiftedEventIds.add(event.recurringEventId ?? event.id);
      }
    }

    if (affectedDates.length > 0 && gapTime && gapEndTime) {
      shiftedEvents.push({
        event: gapItems[0].event,
        calendarId: gapItems[0].calendarId,
        normalLocalTime: normalTime,
        gapLocalTime: gapTime,
        normalEndLocalTime: normalEndTime,
        gapEndLocalTime: gapEndTime,
        shiftMinutes: shiftMinutesVal,
        affectedDates,
        anchoredTimezone: refItem.event.start.timeZone,
      });
    }
  }

  // Detect conflicts: find overlapping event pairs during the gap
  const conflicts = detectConflicts(gapEvents, shiftedEventIds, userTimezone);

  return {
    dstWindows: relevantWindows,
    shiftedEvents,
    conflicts,
    gapEvents,
    userTimezone,
    referenceTimezone,
    totalEventsScanned: events.length,
  };
}

function detectConflicts(
  gapEvents: Array<{ event: CalendarEvent; calendarId: string }>,
  shiftedEventIds: Set<string>,
  userTimezone: string
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Group events by day (in user's timezone)
  const byDay = new Map<string, Array<{ event: CalendarEvent; calendarId: string }>>();

  for (const item of gapEvents) {
    if (!item.event.start.dateTime) continue;
    const start = new Date(item.event.start.dateTime);
    const dayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: userTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(start); // "YYYY-MM-DD"
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey)!.push(item);
  }

  // For each day, check all pairs for overlap
  for (const [, dayItems] of byDay) {
    for (let i = 0; i < dayItems.length; i++) {
      for (let j = i + 1; j < dayItems.length; j++) {
        const a = dayItems[i];
        const b = dayItems[j];

        if (!a.event.start.dateTime || !b.event.start.dateTime) continue;

        const aStart = new Date(a.event.start.dateTime).getTime();
        const aEnd = new Date(a.event.end.dateTime ?? a.event.start.dateTime).getTime();
        const bStart = new Date(b.event.start.dateTime).getTime();
        const bEnd = new Date(b.event.end.dateTime ?? b.event.start.dateTime).getTime();

        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);

        if (overlapEnd > overlapStart) {
          const aKey = a.event.recurringEventId ?? a.event.id;
          const bKey = b.event.recurringEventId ?? b.event.id;
          const dstCaused = shiftedEventIds.has(aKey) || shiftedEventIds.has(bKey);

          conflicts.push({
            event1: a.event,
            event2: b.event,
            calendarId1: a.calendarId,
            calendarId2: b.calendarId,
            overlapStart: new Date(overlapStart),
            overlapEnd: new Date(overlapEnd),
            overlapMinutes: Math.round((overlapEnd - overlapStart) / 60000),
            date: new Date(aStart),
            dstCaused,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Returns the next DST gap window from today, for the most common
 * user/reference timezone pair (defaults to Europe/Madrid ↔ America/New_York).
 */
export function getNextDSTWindow(
  userTimezone: string,
  referenceTimezone: string
): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();

  for (const y of [year, year + 1]) {
    const windows = findDSTGapWindows(y, userTimezone, referenceTimezone);
    for (const w of windows) {
      if (w.end > now && w.shiftMinutes !== 0) {
        return { start: w.start, end: w.end };
      }
    }
  }

  // Fallback: US spring DST window
  return {
    start: new Date(Date.UTC(year, 2, 8)),
    end: new Date(Date.UTC(year, 2, 29)),
  };
}

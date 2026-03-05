/**
 * Demo data for the /demo page.
 * Scenario: User in Europe/Madrid, recurring meetings with US-based colleagues.
 * Gap window: March 8–29, 2026 (US springs forward Mar 8, EU on Mar 29).
 *
 * NY-anchored events shift 1h earlier in Madrid during the gap (amber/red).
 * CET-anchored events stay put (blue).
 */

import type { AnalysisOutput, CalendarEvent, Conflict, DSTGapWindow, ShiftedEvent } from "./types";

function makeEvent(
  id: string,
  summary: string,
  startIso: string,
  endIso: string,
  recurringId?: string,
  tz = "America/New_York"
): CalendarEvent {
  return {
    id,
    summary,
    start: { dateTime: startIso, timeZone: tz },
    end: { dateTime: endIso, timeZone: tz },
    recurringEventId: recurringId,
    htmlLink: "#",
  };
}

// ---------------------------------------------------------------------------
// Named event instances — used by both the gap-week arrays and shiftedEvents/conflicts
// ---------------------------------------------------------------------------

// Week 1 — NY-anchored (shift from 1h later to current, Mon/Wed)
const w1_steering   = makeEvent("gap-1a", "Weekly Steering",     "2026-03-09T09:30:00-04:00", "2026-03-09T10:00:00-04:00", "rec-steering");
const w1_sprint     = makeEvent("gap-7a", "Sprint Planning",      "2026-03-09T09:00:00-04:00", "2026-03-09T09:30:00-04:00", "rec-sprint");
const w1_eng        = makeEvent("gap-3a", "Engineering Standup",  "2026-03-11T09:30:00-04:00", "2026-03-11T10:30:00-04:00", "rec-eng");
const w1_review     = makeEvent("gap-6a", "Team Review",          "2026-03-11T09:00:00-04:00", "2026-03-11T09:45:00-04:00", "rec-review");
const w1_cross      = makeEvent("gap-4a", "Cross-team Sync",      "2026-03-11T10:30:00-04:00", "2026-03-11T11:30:00-04:00", "rec-cross");
const w1_product    = makeEvent("gap-2a", "Product Sync",         "2026-03-11T11:30:00-04:00", "2026-03-11T12:30:00-04:00", "rec-product");

// Week 1 — CET-anchored (no shift, blue)
const w1_1on1       = makeEvent("gap-5a",  "1:1 Check-in",   "2026-03-09T10:00:00+01:00", "2026-03-09T10:30:00+01:00", "rec-1on1",   "Europe/Madrid");
const w1_standup_mo = makeEvent("gap-s1a", "Daily Standup",  "2026-03-09T09:00:00+01:00", "2026-03-09T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w1_standup_tu = makeEvent("gap-s2a", "Daily Standup",  "2026-03-10T09:00:00+01:00", "2026-03-10T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w1_standup_we = makeEvent("gap-s3a", "Daily Standup",  "2026-03-11T09:00:00+01:00", "2026-03-11T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w1_standup_th = makeEvent("gap-s4a", "Daily Standup",  "2026-03-12T09:00:00+01:00", "2026-03-12T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w1_design     = makeEvent("gap-d1a", "Design Review",  "2026-03-10T14:00:00+01:00", "2026-03-10T15:00:00+01:00", "rec-design", "Europe/Madrid");
const w1_lunch      = makeEvent("gap-l1a", "Lunch & Learn",  "2026-03-12T13:00:00+01:00", "2026-03-12T14:00:00+01:00", "rec-lunch",  "Europe/Madrid");
const w1_retro      = makeEvent("gap-r1a", "Retrospective",  "2026-03-12T15:30:00+01:00", "2026-03-12T16:30:00+01:00", "rec-retro",  "Europe/Madrid");

// Week 2
const w2_steering   = makeEvent("gap-1b", "Weekly Steering",     "2026-03-16T09:30:00-04:00", "2026-03-16T10:00:00-04:00", "rec-steering");
const w2_sprint     = makeEvent("gap-7b", "Sprint Planning",      "2026-03-16T09:00:00-04:00", "2026-03-16T09:30:00-04:00", "rec-sprint");
const w2_eng        = makeEvent("gap-3b", "Engineering Standup",  "2026-03-18T09:30:00-04:00", "2026-03-18T10:30:00-04:00", "rec-eng");
const w2_review     = makeEvent("gap-6b", "Team Review",          "2026-03-18T09:00:00-04:00", "2026-03-18T09:45:00-04:00", "rec-review");
const w2_cross      = makeEvent("gap-4b", "Cross-team Sync",      "2026-03-18T10:30:00-04:00", "2026-03-18T11:30:00-04:00", "rec-cross");
const w2_product    = makeEvent("gap-2b", "Product Sync",         "2026-03-18T11:30:00-04:00", "2026-03-18T12:30:00-04:00", "rec-product");

const w2_1on1       = makeEvent("gap-5b",  "1:1 Check-in",   "2026-03-16T10:00:00+01:00", "2026-03-16T10:30:00+01:00", "rec-1on1",   "Europe/Madrid");
const w2_standup_mo = makeEvent("gap-s1b", "Daily Standup",  "2026-03-16T09:00:00+01:00", "2026-03-16T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w2_standup_tu = makeEvent("gap-s2b", "Daily Standup",  "2026-03-17T09:00:00+01:00", "2026-03-17T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w2_standup_we = makeEvent("gap-s3b", "Daily Standup",  "2026-03-18T09:00:00+01:00", "2026-03-18T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w2_standup_th = makeEvent("gap-s4b", "Daily Standup",  "2026-03-19T09:00:00+01:00", "2026-03-19T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w2_design     = makeEvent("gap-d1b", "Design Review",  "2026-03-17T14:00:00+01:00", "2026-03-17T15:00:00+01:00", "rec-design", "Europe/Madrid");
const w2_lunch      = makeEvent("gap-l1b", "Lunch & Learn",  "2026-03-19T13:00:00+01:00", "2026-03-19T14:00:00+01:00", "rec-lunch",  "Europe/Madrid");
const w2_retro      = makeEvent("gap-r1b", "Retrospective",  "2026-03-19T15:30:00+01:00", "2026-03-19T16:30:00+01:00", "rec-retro",  "Europe/Madrid");

// Week 3
const w3_steering   = makeEvent("gap-1c", "Weekly Steering",     "2026-03-23T09:30:00-04:00", "2026-03-23T10:00:00-04:00", "rec-steering");
const w3_sprint     = makeEvent("gap-7c", "Sprint Planning",      "2026-03-23T09:00:00-04:00", "2026-03-23T09:30:00-04:00", "rec-sprint");
const w3_eng        = makeEvent("gap-3c", "Engineering Standup",  "2026-03-25T09:30:00-04:00", "2026-03-25T10:30:00-04:00", "rec-eng");
const w3_review     = makeEvent("gap-6c", "Team Review",          "2026-03-25T09:00:00-04:00", "2026-03-25T09:45:00-04:00", "rec-review");
const w3_cross      = makeEvent("gap-4c", "Cross-team Sync",      "2026-03-25T10:30:00-04:00", "2026-03-25T11:30:00-04:00", "rec-cross");
const w3_product    = makeEvent("gap-2c", "Product Sync",         "2026-03-25T11:30:00-04:00", "2026-03-25T12:30:00-04:00", "rec-product");

const w3_1on1       = makeEvent("gap-5c",  "1:1 Check-in",   "2026-03-23T10:00:00+01:00", "2026-03-23T10:30:00+01:00", "rec-1on1",   "Europe/Madrid");
const w3_standup_mo = makeEvent("gap-s1c", "Daily Standup",  "2026-03-23T09:00:00+01:00", "2026-03-23T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w3_standup_tu = makeEvent("gap-s2c", "Daily Standup",  "2026-03-24T09:00:00+01:00", "2026-03-24T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w3_standup_we = makeEvent("gap-s3c", "Daily Standup",  "2026-03-25T09:00:00+01:00", "2026-03-25T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w3_standup_th = makeEvent("gap-s4c", "Daily Standup",  "2026-03-26T09:00:00+01:00", "2026-03-26T09:15:00+01:00", "rec-standup","Europe/Madrid");
const w3_design     = makeEvent("gap-d1c", "Design Review",  "2026-03-24T14:00:00+01:00", "2026-03-24T15:00:00+01:00", "rec-design", "Europe/Madrid");
const w3_lunch      = makeEvent("gap-l1c", "Lunch & Learn",  "2026-03-26T13:00:00+01:00", "2026-03-26T14:00:00+01:00", "rec-lunch",  "Europe/Madrid");
const w3_retro      = makeEvent("gap-r1c", "Retrospective",  "2026-03-26T15:30:00+01:00", "2026-03-26T16:30:00+01:00", "rec-retro",  "Europe/Madrid");

// ---------------------------------------------------------------------------
// Pre-gap reference events (week of Mar 2, NY=UTC-5) — establish "normal" times
// ---------------------------------------------------------------------------
const PRE_GAP_EVENTS: CalendarEvent[] = [
  makeEvent("ref-1",  "Weekly Steering",    "2026-03-02T09:30:00-05:00", "2026-03-02T10:00:00-05:00", "rec-steering"),
  makeEvent("ref-7",  "Sprint Planning",     "2026-03-02T09:00:00-05:00", "2026-03-02T09:30:00-05:00", "rec-sprint"),
  makeEvent("ref-3",  "Engineering Standup", "2026-03-04T09:30:00-05:00", "2026-03-04T10:30:00-05:00", "rec-eng"),
  makeEvent("ref-6",  "Team Review",         "2026-03-04T09:00:00-05:00", "2026-03-04T09:45:00-05:00", "rec-review"),
  makeEvent("ref-4",  "Cross-team Sync",     "2026-03-04T10:30:00-05:00", "2026-03-04T11:30:00-05:00", "rec-cross"),
  makeEvent("ref-2",  "Product Sync",        "2026-03-04T11:30:00-05:00", "2026-03-04T12:30:00-05:00", "rec-product"),
  makeEvent("ref-5",  "1:1 Check-in",        "2026-03-02T10:00:00+01:00", "2026-03-02T10:30:00+01:00", "rec-1on1",   "Europe/Madrid"),
  makeEvent("ref-8",  "Daily Standup",       "2026-03-02T09:00:00+01:00", "2026-03-02T09:15:00+01:00", "rec-standup","Europe/Madrid"),
  makeEvent("ref-9",  "Daily Standup",       "2026-03-03T09:00:00+01:00", "2026-03-03T09:15:00+01:00", "rec-standup","Europe/Madrid"),
  makeEvent("ref-10", "Daily Standup",       "2026-03-04T09:00:00+01:00", "2026-03-04T09:15:00+01:00", "rec-standup","Europe/Madrid"),
  makeEvent("ref-11", "Daily Standup",       "2026-03-05T09:00:00+01:00", "2026-03-05T09:15:00+01:00", "rec-standup","Europe/Madrid"),
  makeEvent("ref-12", "Design Review",       "2026-03-03T14:00:00+01:00", "2026-03-03T15:00:00+01:00", "rec-design", "Europe/Madrid"),
  makeEvent("ref-13", "Retrospective",       "2026-03-05T15:30:00+01:00", "2026-03-05T16:30:00+01:00", "rec-retro",  "Europe/Madrid"),
  makeEvent("ref-14", "Lunch & Learn",       "2026-03-05T13:00:00+01:00", "2026-03-05T14:00:00+01:00", "rec-lunch",  "Europe/Madrid"),
];

// ---------------------------------------------------------------------------
// Gap-week event lists (for gapEvents / totalEventsScanned)
// ---------------------------------------------------------------------------
const GAP_WEEK1_EVENTS = [
  w1_standup_mo, w1_sprint,     w1_1on1,       w1_steering,
  w1_standup_tu, w1_design,
  w1_standup_we, w1_review,     w1_eng,        w1_cross,      w1_product,
  w1_standup_th, w1_lunch,      w1_retro,
];
const GAP_WEEK2_EVENTS = [
  w2_standup_mo, w2_sprint,     w2_1on1,       w2_steering,
  w2_standup_tu, w2_design,
  w2_standup_we, w2_review,     w2_eng,        w2_cross,      w2_product,
  w2_standup_th, w2_lunch,      w2_retro,
];
const GAP_WEEK3_EVENTS = [
  w3_standup_mo, w3_sprint,     w3_1on1,       w3_steering,
  w3_standup_tu, w3_design,
  w3_standup_we, w3_review,     w3_eng,        w3_cross,      w3_product,
  w3_standup_th, w3_lunch,      w3_retro,
];

// ---------------------------------------------------------------------------
// Shifted events — NY-anchored, appear 1h earlier in Madrid during the gap
// ---------------------------------------------------------------------------
const shiftedEvents: ShiftedEvent[] = [
  {
    event: w1_steering,
    calendarId: "primary",
    normalLocalTime: "15:30", gapLocalTime: "14:30",
    normalEndLocalTime: "16:00", gapEndLocalTime: "15:00",
    shiftMinutes: -60,
    affectedDates: [
      new Date("2026-03-09T09:30:00-04:00"),
      new Date("2026-03-16T09:30:00-04:00"),
      new Date("2026-03-23T09:30:00-04:00"),
    ],
    anchoredTimezone: "America/New_York",
  },
  {
    event: w1_sprint,
    calendarId: "primary",
    normalLocalTime: "15:00", gapLocalTime: "14:00",
    normalEndLocalTime: "15:30", gapEndLocalTime: "14:30",
    shiftMinutes: -60,
    affectedDates: [
      new Date("2026-03-09T09:00:00-04:00"),
      new Date("2026-03-16T09:00:00-04:00"),
      new Date("2026-03-23T09:00:00-04:00"),
    ],
    anchoredTimezone: "America/New_York",
  },
  {
    event: w1_eng,
    calendarId: "primary",
    normalLocalTime: "15:30", gapLocalTime: "14:30",
    normalEndLocalTime: "16:30", gapEndLocalTime: "15:30",
    shiftMinutes: -60,
    affectedDates: [
      new Date("2026-03-11T09:30:00-04:00"),
      new Date("2026-03-18T09:30:00-04:00"),
      new Date("2026-03-25T09:30:00-04:00"),
    ],
    anchoredTimezone: "America/New_York",
  },
  {
    event: w1_review,
    calendarId: "primary",
    normalLocalTime: "15:00", gapLocalTime: "14:00",
    normalEndLocalTime: "15:45", gapEndLocalTime: "14:45",
    shiftMinutes: -60,
    affectedDates: [
      new Date("2026-03-11T09:00:00-04:00"),
      new Date("2026-03-18T09:00:00-04:00"),
      new Date("2026-03-25T09:00:00-04:00"),
    ],
    anchoredTimezone: "America/New_York",
  },
  {
    event: w1_cross,
    calendarId: "primary",
    normalLocalTime: "16:30", gapLocalTime: "15:30",
    normalEndLocalTime: "17:30", gapEndLocalTime: "16:30",
    shiftMinutes: -60,
    affectedDates: [
      new Date("2026-03-11T10:30:00-04:00"),
      new Date("2026-03-18T10:30:00-04:00"),
      new Date("2026-03-25T10:30:00-04:00"),
    ],
    anchoredTimezone: "America/New_York",
  },
  {
    event: w1_product,
    calendarId: "primary",
    normalLocalTime: "17:30", gapLocalTime: "16:30",
    normalEndLocalTime: "18:30", gapEndLocalTime: "17:30",
    shiftMinutes: -60,
    affectedDates: [
      new Date("2026-03-11T11:30:00-04:00"),
      new Date("2026-03-18T11:30:00-04:00"),
      new Date("2026-03-25T11:30:00-04:00"),
    ],
    anchoredTimezone: "America/New_York",
  },
];

// ---------------------------------------------------------------------------
// Conflicts — Engineering Standup (14:30–15:30) overlaps Team Review (14:00–14:45)
// ---------------------------------------------------------------------------
const conflicts: Conflict[] = [
  {
    event1: w1_eng, event2: w1_review,
    calendarId1: "primary", calendarId2: "primary",
    overlapStart: new Date("2026-03-11T13:30:00Z"),
    overlapEnd:   new Date("2026-03-11T13:45:00Z"),
    overlapMinutes: 15,
    date: new Date("2026-03-11T09:30:00-04:00"),
    dstCaused: true,
  },
  {
    event1: w2_eng, event2: w2_review,
    calendarId1: "primary", calendarId2: "primary",
    overlapStart: new Date("2026-03-18T13:30:00Z"),
    overlapEnd:   new Date("2026-03-18T13:45:00Z"),
    overlapMinutes: 15,
    date: new Date("2026-03-18T09:30:00-04:00"),
    dstCaused: true,
  },
  {
    event1: w3_eng, event2: w3_review,
    calendarId1: "primary", calendarId2: "primary",
    overlapStart: new Date("2026-03-25T13:30:00Z"),
    overlapEnd:   new Date("2026-03-25T13:45:00Z"),
    overlapMinutes: 15,
    date: new Date("2026-03-25T09:30:00-04:00"),
    dstCaused: true,
  },
];

const dstWindows: DSTGapWindow[] = [
  {
    start: new Date("2026-03-08T00:00:00Z"),
    end: new Date("2026-03-29T00:00:00Z"),
    shiftMinutes: -60,
  },
];

const gapEvents: Array<{ event: CalendarEvent; calendarId: string }> = [
  ...GAP_WEEK1_EVENTS.map((event) => ({ event, calendarId: "primary" })),
  ...GAP_WEEK2_EVENTS.map((event) => ({ event, calendarId: "primary" })),
  ...GAP_WEEK3_EVENTS.map((event) => ({ event, calendarId: "primary" })),
];

export const DEMO_ANALYSIS: AnalysisOutput = {
  dstWindows,
  shiftedEvents,
  conflicts,
  gapEvents,
  userTimezone: "Europe/Madrid",
  referenceTimezone: "America/New_York",
  totalEventsScanned:
    PRE_GAP_EVENTS.length +
    GAP_WEEK1_EVENTS.length +
    GAP_WEEK2_EVENTS.length +
    GAP_WEEK3_EVENTS.length,
};

export const DEMO_WINDOW = {
  start: new Date("2026-03-08T00:00:00Z"),
  end: new Date("2026-03-29T00:00:00Z"),
};

export const DEMO_CALENDARS = [
  { id: "primary", summary: "My Calendar", primary: true },
];

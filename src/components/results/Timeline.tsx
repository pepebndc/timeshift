"use client";

import { useMemo } from "react";
import type { AnalysisOutput, CalendarEvent, Conflict } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/dst-engine";

interface Props {
  output: AnalysisOutput;
  windowStart: Date;
  windowEnd: Date;
  selectedEventKey: string | null;
  onSelectEvent: (key: string | null) => void;
  onSelectConflict: (conflict: Conflict) => void;
}

const DAY_START_H = 8;
const DAY_END_H = 21;
const TOTAL_MINUTES = (DAY_END_H - DAY_START_H) * 60;
const LANE_H = 28; // px per lane row

export default function Timeline({
  output,
  windowStart,
  windowEnd,
  selectedEventKey,
  onSelectEvent,
  onSelectConflict,
}: Props) {
  const { days, eventsByDay } = useMemo(() => {
    return buildDayMap(output, windowStart, windowEnd);
  }, [output, windowStart, windowEnd]);

  const shiftedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const s of output.shiftedEvents) {
      set.add(s.event.recurringEventId ?? s.event.id);
    }
    return set;
  }, [output.shiftedEvents]);

  // Keyed by specific instance ID so only the dates that actually conflict
  // are highlighted, not the whole recurring series.
  // dstConflictIds  → red   (shift caused this conflict)
  // preConflictIds  → orange (conflict exists regardless of DST)
  const { dstConflictIds, preConflictIds } = useMemo(() => {
    const dstConflictIds = new Set<string>();
    const preConflictIds = new Set<string>();
    for (const c of output.conflicts) {
      const target = c.dstCaused ? dstConflictIds : preConflictIds;
      target.add(c.event1.id);
      target.add(c.event2.id);
    }
    return { dstConflictIds, preConflictIds };
  }, [output.conflicts]);

  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-sm">
        No events in this window.
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      {/* Hour labels */}
      <div className="sticky top-0 z-10 bg-navy-800 border-b border-navy-600 pl-28 pr-4 py-1.5 flex">
        {Array.from({ length: DAY_END_H - DAY_START_H + 1 }, (_, i) => {
          const h = DAY_START_H + i;
          return (
            <div
              key={h}
              className="flex-1 text-[10px] text-gray-600 tabular-nums"
              style={{ minWidth: 0 }}
            >
              {h.toString().padStart(2, "0")}:00
            </div>
          );
        })}
      </div>

      {/* Day rows */}
      <div className="divide-y divide-navy-600/50">
        {days.map((day) => {
          const events = eventsByDay.get(day.key) ?? [];
          const hasEvents = events.length > 0;

          return (
            <div key={day.key} className={`flex items-start py-1.5 px-4 gap-2 ${hasEvents ? "" : "opacity-40"}`}>
              {/* Day label */}
              <div className="w-24 flex-shrink-0 pt-0.5">
                <p className="text-xs font-medium text-gray-400">{day.label}</p>
                <p className="text-[10px] text-gray-600">{day.dateLabel}</p>
              </div>

              {/* Event bars track */}
              {(() => {
                const laned = assignLanes(events);
                const maxLane = laned.reduce((m, e) => Math.max(m, e.lane), 0);
                const trackH = (maxLane + 1) * LANE_H;
                return (
                  <div className="flex-1 relative" style={{ height: `${Math.max(trackH, LANE_H)}px` }}>
                    {laned.map((item) => {
                      const eventKey = item.event.recurringEventId ?? item.event.id;
                      const isShifted = shiftedKeys.has(eventKey);
                      const isDstConflict = dstConflictIds.has(item.event.id);
                      const isPreConflict = preConflictIds.has(item.event.id);
                      const isSelected = selectedEventKey === eventKey;

                      const startM = toMinutesSinceDayStart(item.start, output.userTimezone);
                      const endM = toMinutesSinceDayStart(item.end, output.userTimezone);
                      const leftPct = Math.max(0, (startM / TOTAL_MINUTES) * 100);
                      const widthPct = Math.max(1.5, ((endM - startM) / TOTAL_MINUTES) * 100);

                      const color = isDstConflict
                        ? "bg-brand-red/80 border-brand-red"
                        : isPreConflict
                        ? "bg-orange-500/80 border-orange-400"
                        : isShifted
                        ? "bg-sky-500/80 border-sky-400"
                        : "bg-slate-500/70 border-slate-400/50";

                      const relatedConflict = output.conflicts.find(
                        (c) =>
                          c.event1.id === item.event.id ||
                          c.event2.id === item.event.id
                      );

                      return (
                        <button
                          key={item.event.id}
                          onClick={() => {
                            if (relatedConflict) {
                              onSelectConflict(relatedConflict);
                            } else {
                              onSelectEvent(isSelected ? null : eventKey);
                            }
                          }}
                          className={`absolute h-6 rounded border text-[10px] text-white font-medium overflow-hidden whitespace-nowrap px-1.5 flex items-center transition-all ${color} ${
                            isSelected ? "ring-1 ring-white/50" : "hover:brightness-125"
                          }`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            top: `${item.lane * LANE_H + 2}px`,
                          }}
                          title={`${item.event.summary ?? "Event"} · ${formatTime(item.start, output.userTimezone)}–${formatTime(item.end, output.userTimezone)}`}
                        >
                          <span className="truncate">{item.event.summary ?? "Event"}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface DayEntry {
  key: string;   // "2026-03-09"
  label: string; // "Mon"
  dateLabel: string; // "Mar 9"
  date: Date;
}

interface EventBar {
  event: CalendarEvent;
  start: Date;
  end: Date;
}

function buildDayMap(
  output: AnalysisOutput,
  windowStart: Date,
  windowEnd: Date
): {
  days: DayEntry[];
  eventsByDay: Map<string, EventBar[]>;
} {
  const days: DayEntry[] = [];
  const eventsByDay = new Map<string, EventBar[]>();
  const tz = output.userTimezone;

  // Enumerate all days in the window
  const dayMs = 24 * 60 * 60 * 1000;
  let cursor = new Date(windowStart);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= windowEnd) {
    const key = toDateKey(cursor, tz);
    const label = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
    }).format(cursor);
    const dateLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      month: "short",
      day: "numeric",
    }).format(cursor);

    days.push({ key, label, dateLabel, date: new Date(cursor) });
    eventsByDay.set(key, []);
    cursor = new Date(cursor.getTime() + dayMs);
  }

  // Place every gap event into its day bucket
  for (const { event } of output.gapEvents) {
    if (!event.start.dateTime) continue;
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime ?? event.start.dateTime);
    const key = toDateKey(start, tz);
    const bucket = eventsByDay.get(key);
    if (bucket) bucket.push({ event, start, end });
  }

  return { days, eventsByDay };
}

function toDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function assignLanes(events: EventBar[]): (EventBar & { lane: number })[] {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const laneEndTimes: number[] = [];
  return sorted.map((item) => {
    const startMs = item.start.getTime();
    let lane = laneEndTimes.findIndex((endMs) => endMs <= startMs);
    if (lane === -1) lane = laneEndTimes.length;
    laneEndTimes[lane] = item.end.getTime();
    return { ...item, lane };
  });
}

function toMinutesSinceDayStart(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0");
  const minutes = (h === 24 ? 0 : h) * 60 + m;
  return minutes - DAY_START_H * 60;
}

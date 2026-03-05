"use client";

import { useEffect, useRef } from "react";
import type { Conflict } from "@/lib/types";
import { formatTime, formatDate } from "@/lib/dst-engine";

interface Props {
  conflict: Conflict | null;
  userTimezone: string;
  onClose: () => void;
}

export default function ConflictModal({ conflict, userTimezone, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Trap focus
  useEffect(() => {
    if (conflict) {
      overlayRef.current?.focus();
    }
  }, [conflict]);

  if (!conflict) return null;

  const e1Start = new Date(conflict.event1.start.dateTime!);
  const e1End = new Date(conflict.event1.end.dateTime ?? conflict.event1.start.dateTime!);
  const e2Start = new Date(conflict.event2.start.dateTime!);
  const e2End = new Date(conflict.event2.end.dateTime ?? conflict.event2.start.dateTime!);

  const overlapStartTime = formatTime(conflict.overlapStart, userTimezone);
  const overlapEndTime = formatTime(conflict.overlapEnd, userTimezone);

  // Build a simple visual timeline for the conflict
  const dayStart = 8 * 60; // 08:00
  const dayEnd = 20 * 60;  // 20:00
  const totalMinutes = dayEnd - dayStart;

  function toPercent(date: Date) {
    const minutes =
      date.getUTCHours() * 60 +
      date.getUTCMinutes() +
      getUTCOffsetForTimezone(date, userTimezone);
    return Math.max(0, Math.min(100, ((minutes - dayStart) / totalMinutes) * 100));
  }

  const e1Left = toPercent(e1Start);
  const e1Width = Math.max(2, toPercent(e1End) - e1Left);
  const e2Left = toPercent(e2Start);
  const e2Width = Math.max(2, toPercent(e2End) - e2Left);
  const olLeft = toPercent(conflict.overlapStart);
  const olWidth = Math.max(1, toPercent(conflict.overlapEnd) - olLeft);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Conflict details"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="relative bg-navy-700 border border-navy-600 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-600">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
              conflict.dstCaused
                ? "bg-brand-red/10 text-brand-red border-brand-red/30"
                : "bg-orange-500/10 text-orange-400 border-orange-500/30"
            }`}>
              {conflict.dstCaused ? "DST CONFLICT" : "CONFLICT"}
            </span>
            <span className="text-white font-medium text-sm">
              {formatDate(conflict.date, userTimezone)}
            </span>
            <span className="text-gray-600 text-sm">
              · {conflict.overlapMinutes} min overlap
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M18 6 6 18M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* DST cause note */}
          {conflict.dstCaused && (
            <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/5 border border-sky-500/20 rounded-lg px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                />
              </svg>
              This conflict is caused by a DST shift — it does not exist outside this window.
            </div>
          )}

          {/* Event 1 */}
          <EventRow
            label={conflict.dstCaused ? "Shifted by DST" : "Event"}
            name={conflict.event1.summary ?? "Untitled"}
            startTime={formatTime(e1Start, userTimezone)}
            endTime={formatTime(e1End, userTimezone)}
            shifted={conflict.dstCaused}
            link={conflict.event1.htmlLink}
          />

          {/* Event 2 */}
          <EventRow
            label="Unchanged"
            name={conflict.event2.summary ?? "Untitled"}
            startTime={formatTime(e2Start, userTimezone)}
            endTime={formatTime(e2End, userTimezone)}
            shifted={false}
            link={conflict.event2.htmlLink}
          />

          {/* Visual timeline */}
          <div>
            <p className="text-xs text-gray-600 mb-2">Timeline (your local time)</p>
            <div className="relative h-10 bg-navy-600 rounded-lg overflow-hidden">
              {/* Event 1 bar */}
              <div
                className="absolute top-1 h-3.5 rounded bg-sky-500/70"
                style={{ left: `${e1Left}%`, width: `${e1Width}%` }}
                title={`${conflict.event1.summary}: ${formatTime(e1Start, userTimezone)}–${formatTime(e1End, userTimezone)}`}
              />
              {/* Event 2 bar */}
              <div
                className="absolute bottom-1 h-3.5 rounded bg-brand-blue/70"
                style={{ left: `${e2Left}%`, width: `${e2Width}%` }}
                title={`${conflict.event2.summary}: ${formatTime(e2Start, userTimezone)}–${formatTime(e2End, userTimezone)}`}
              />
              {/* Overlap indicator */}
              <div
                className="absolute top-1 h-7 rounded bg-brand-red/40 border border-brand-red/60"
                style={{ left: `${olLeft}%`, width: `${olWidth}%` }}
                title={`Overlap: ${overlapStartTime}–${overlapEndTime}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1 px-0.5">
              <span>08:00</span>
              <span>Overlap: {overlapStartTime}–{overlapEndTime}</span>
              <span>20:00</span>
            </div>
          </div>

          {/* Overlap detail */}
          <div className="bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-3">
            <p className="text-sm text-white">
              <span className="text-brand-red font-semibold">Overlap: </span>
              {overlapStartTime}–{overlapEndTime}
              <span className="text-gray-500 ml-2">({conflict.overlapMinutes} min)</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-navy-600 flex gap-2 justify-end">
          <button
            onClick={() => {
              const text = `CONFLICT on ${formatDate(conflict.date, userTimezone)}\n"${conflict.event1.summary}" × "${conflict.event2.summary}"\nOverlap: ${overlapStartTime}–${overlapEndTime} (${conflict.overlapMinutes} min)`;
              void navigator.clipboard.writeText(text);
            }}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-navy-500 hover:border-navy-400 hover:text-white transition-colors"
          >
            Copy details
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm bg-navy-600 text-white hover:bg-navy-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function EventRow({
  label,
  name,
  startTime,
  endTime,
  shifted,
  link,
}: {
  label: string;
  name: string;
  startTime: string;
  endTime: string;
  shifted: boolean;
  link?: string;
}) {
  return (
    <div className="border border-navy-500 rounded-lg px-4 py-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">{label}</p>
        {link && link !== "#" && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-blue hover:underline"
          >
            Open
          </a>
        )}
      </div>
      <p className="text-white font-medium text-sm">&ldquo;{name}&rdquo;</p>
      <p className={`text-sm font-mono ${shifted ? "text-sky-400" : "text-gray-400"}`}>
        {startTime} – {endTime}
        {shifted && <span className="text-sky-400 ml-2 text-xs">(shifted)</span>}
      </p>
    </div>
  );
}

function getUTCOffsetForTimezone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m - (date.getUTCHours() * 60 + date.getUTCMinutes());
}

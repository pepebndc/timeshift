"use client";

import type { ShiftedEvent, Conflict } from "@/lib/types";
import { formatDate } from "@/lib/dst-engine";

interface Props {
  shifted: ShiftedEvent;
  conflicts: Conflict[];
  userTimezone: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function EventCard({
  shifted,
  conflicts,
  userTimezone,
  isSelected,
  onClick,
}: Props) {
  const eventKey = shifted.event.recurringEventId ?? shifted.event.id;
  const relatedConflicts = conflicts.filter(
    (c) =>
      (c.event1.recurringEventId ?? c.event1.id) === eventKey ||
      (c.event2.recurringEventId ?? c.event2.id) === eventKey
  );
  const hasDstConflict = relatedConflicts.some((c) => c.dstCaused);
  const hasPreConflict = relatedConflicts.some((c) => !c.dstCaused);

  const shiftLabel =
    shifted.shiftMinutes < 0
      ? `-${Math.abs(shifted.shiftMinutes)}min`
      : `+${shifted.shiftMinutes}min`;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all ${
        isSelected
          ? "border-brand-blue bg-brand-blue/5"
          : "border-navy-500 bg-navy-700 hover:border-navy-400"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {hasDstConflict ? (
            <Badge color="red">DST CONFLICT</Badge>
          ) : hasPreConflict ? (
            <Badge color="orange">CONFLICT</Badge>
          ) : (
            <Badge color="sky">SHIFTED</Badge>
          )}
          <h3 className="text-white font-medium text-sm leading-snug truncate">
            {shifted.event.summary ?? "Untitled event"}
          </h3>
        </div>
        <span className="flex-shrink-0 text-xs font-mono text-sky-400">
          {shiftLabel}
        </span>
      </div>

      {shifted.anchoredTimezone && (
        <p className="text-gray-600 text-xs mb-3">
          Anchored in: {shifted.anchoredTimezone}
        </p>
      )}

      <div className="space-y-1 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 w-20">Normal:</span>
          <span className="text-gray-300">
            {shifted.normalLocalTime}–{shifted.normalEndLocalTime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 w-20">During gap:</span>
          <span className="text-sky-400 font-medium">
            {shifted.gapLocalTime}–{shifted.gapEndLocalTime}
          </span>
        </div>
      </div>

      {shifted.affectedDates.length > 0 && (
        <div className="mt-3">
          <p className="text-gray-600 text-xs mb-1.5">Affected dates:</p>
          <div className="flex flex-wrap gap-1.5">
            {shifted.affectedDates.slice(0, 6).map((d) => (
              <span
                key={d.toISOString()}
                className="text-[11px] text-gray-400 bg-navy-600 px-2 py-0.5 rounded"
              >
                {formatDate(d, userTimezone)}
              </span>
            ))}
            {shifted.affectedDates.length > 6 && (
              <span className="text-[11px] text-gray-600 px-1">
                +{shifted.affectedDates.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {shifted.event.htmlLink && shifted.event.htmlLink !== "#" && (
        <div className="mt-3 pt-3 border-t border-navy-600">
          <a
            href={shifted.event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-brand-blue hover:underline"
          >
            Open in Google Calendar
          </a>
        </div>
      )}
    </button>
  );
}

function Badge({
  color,
  children,
}: {
  color: "red" | "orange" | "sky";
  children: React.ReactNode;
}) {
  const cls =
    color === "red"
      ? "bg-brand-red/10 text-brand-red border-brand-red/30"
      : color === "orange"
      ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
      : "bg-sky-500/10 text-sky-400 border-sky-500/30";
  return (
    <span
      className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${cls}`}
    >
      {children}
    </span>
  );
}

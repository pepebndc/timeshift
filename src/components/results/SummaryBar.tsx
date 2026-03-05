"use client";

import type { AnalysisOutput } from "@/lib/types";
import { formatDate } from "@/lib/dst-engine";

interface Props {
  output: AnalysisOutput;
  windowStart: Date;
  windowEnd: Date;
  isDemo?: boolean;
}

export default function SummaryBar({ output, windowStart, windowEnd, isDemo }: Props) {
  const tz1 = abbrev(output.userTimezone);
  const tz2 = abbrev(output.referenceTimezone);

  return (
    <div className="bg-navy-700 border-b border-navy-600 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4 justify-between no-print">
      {/* Timezone pair + window */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-white">
          {tz1} <span className="text-gray-500">↔</span> {tz2}
        </span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-400">
          {formatDate(windowStart, output.userTimezone)} –{" "}
          {formatDate(windowEnd, output.userTimezone)}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <Stat
          value={output.shiftedEvents.length}
          label="events shift time"
          color="sky"
        />
        <div className="w-px h-4 bg-navy-500" />
        <Stat
          value={output.conflicts.filter((c) => c.dstCaused).length}
          label="DST conflicts"
          color="red"
        />
        <div className="w-px h-4 bg-navy-500" />
        <span className="text-gray-600 text-xs">{output.totalEventsScanned} scanned</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isDemo && (
          <a
            href="/connect"
            className="text-xs px-3 py-1.5 rounded-md border border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10 transition-colors"
          >
            Analyze your calendar
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: "sky" | "red";
}) {
  const colorClass = color === "sky" ? "text-sky-400" : "text-brand-red";
  return (
    <span className="text-gray-400">
      <span className={`font-bold ${colorClass}`}>{value}</span> {label}
    </span>
  );
}

function abbrev(timezone: string): string {
  // e.g. "Europe/Madrid" → "CET", "America/New_York" → "EDT"
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
  } catch {
    return timezone.split("/").pop() ?? timezone;
  }
}

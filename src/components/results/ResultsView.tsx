"use client";

import { useState, useCallback } from "react";
import type { AnalysisOutput, Conflict, ShiftedEvent } from "@/lib/types";
import SummaryBar from "./SummaryBar";
import EventCard from "./EventCard";
import Timeline from "./Timeline";
import ConflictModal from "./ConflictModal";

interface Props {
  output: AnalysisOutput;
  windowStart: Date;
  windowEnd: Date;
  isDemo?: boolean;
}

type Filter = "all" | "conflicts" | "shifted";

export default function ResultsView({ output, windowStart, windowEnd, isDemo }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);

  const handleSelectConflict = useCallback((conflict: Conflict) => {
    setSelectedConflict(conflict);
  }, []);

  const filteredEvents = output.shiftedEvents.filter((s) => {
    if (filter === "all") return true;
    if (filter === "conflicts") {
      const key = s.event.recurringEventId ?? s.event.id;
      return output.conflicts.some(
        (c) =>
          (c.event1.recurringEventId ?? c.event1.id) === key ||
          (c.event2.recurringEventId ?? c.event2.id) === key
      );
    }
    return true; // "shifted" = all
  });

  const isEmpty = output.shiftedEvents.length === 0;

  return (
    <div className="flex flex-col h-screen bg-navy overflow-hidden">
      {/* Summary bar */}
      <SummaryBar
        output={output}
        windowStart={windowStart}
        windowEnd={windowEnd}
        isDemo={isDemo}
      />

      {/* Demo banner */}
      {isDemo && (
        <div className="bg-brand-amber/10 border-b border-brand-amber/20 px-4 py-2 text-center text-xs text-brand-amber no-print">
          This is demo data.{" "}
          <a href="/connect" className="underline hover:no-underline font-medium">
            Connect your Google Calendar
          </a>{" "}
          to analyze your real events.
        </div>
      )}

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: shifted events list */}
          <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-r border-navy-600 overflow-hidden">
            {/* Filter bar */}
            <div className="px-4 py-3 border-b border-navy-600 flex gap-1 no-print">
              {(["all", "conflicts", "shifted"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    filter === f
                      ? "bg-navy-500 text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-navy-600"
                  }`}
                >
                  {f === "conflicts"
                    ? `Conflicts (${output.conflicts.length})`
                    : f === "all"
                    ? `All (${output.shiftedEvents.length})`
                    : "Shifted"}
                </button>
              ))}
            </div>

            {/* Event list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredEvents.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">
                  No events match this filter.
                </p>
              ) : (
                filteredEvents.map((shifted) => (
                  <EventCard
                    key={shifted.event.id}
                    shifted={shifted}
                    conflicts={output.conflicts}
                    userTimezone={output.userTimezone}
                    isSelected={selectedKey === (shifted.event.recurringEventId ?? shifted.event.id)}
                    onClick={() => {
                      const key = shifted.event.recurringEventId ?? shifted.event.id;
                      setSelectedKey((prev) => (prev === key ? null : key));
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right panel: timeline (desktop only) */}
          <div className="hidden md:flex flex-1 flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-navy-600 flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-gray-400 flex-shrink-0">
                Conflict Timeline
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                <LegendDot color="bg-slate-500/70" label="No change" />
                <LegendDot color="bg-sky-500/80" label="Shifted" />
                <LegendDot color="bg-orange-500/80" label="Pre-existing conflict" />
                <LegendDot color="bg-brand-red/80" label="DST conflict" />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Timeline
                output={output}
                windowStart={windowStart}
                windowEnd={windowEnd}
                selectedEventKey={selectedKey}
                onSelectEvent={setSelectedKey}
                onSelectConflict={handleSelectConflict}
              />
            </div>
          </div>
        </div>
      )}

      {/* Conflict modal */}
      <ConflictModal
        conflict={selectedConflict}
        userTimezone={output.userTimezone}
        onClose={() => setSelectedConflict(null)}
      />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-white font-semibold mb-1">No shifts detected</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          None of your recurring meetings appear to shift time during this DST window.
          Your schedule looks clean.
        </p>
      </div>
    </div>
  );
}

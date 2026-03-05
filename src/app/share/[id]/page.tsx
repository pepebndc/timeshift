"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { AnalysisOutput } from "@/lib/types";
import ResultsView from "@/components/results/ResultsView";

/**
 * Share page — renders a read-only snapshot of an analysis result.
 *
 * The data is encoded as a base64url-compressed JSON blob in the URL hash
 * (so it never leaves the browser / reaches our servers).
 * URL format: /share/snapshot#<base64url-data>
 *
 * For very large datasets, use the `?d=<data>` query param instead
 * (still client-side decoded, but survives hard-refresh).
 */
export default function SharePage() {
  return (
    <Suspense>
      <ShareInner />
    </Suspense>
  );
}

function ShareInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [output, setOutput] = useState<AnalysisOutput | null>(null);
  const [windowStart, setWindowStart] = useState<Date | null>(null);
  const [windowEnd, setWindowEnd] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try URL hash first, then query param
    const hashData = window.location.hash.slice(1);
    const queryData = searchParams.get("d");
    const encoded = hashData || queryData;

    if (!encoded) {
      setError("No snapshot data found in this link.");
      return;
    }

    try {
      const json = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
      const parsed = JSON.parse(json) as {
        output: AnalysisOutput;
        windowStart: string;
        windowEnd: string;
      };

      // Rehydrate Date objects (JSON serializes Dates as strings)
      const rehydrated = rehydrateDates(parsed.output);
      setOutput(rehydrated);
      setWindowStart(new Date(parsed.windowStart));
      setWindowEnd(new Date(parsed.windowEnd));
    } catch {
      setError("This link appears to be invalid or corrupted.");
    }
  }, [searchParams]);

  const id = typeof params.id === "string" ? params.id : "";

  if (error) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-gray-400">{error}</p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-lg bg-brand-blue text-white font-medium hover:bg-blue-500 transition-colors"
        >
          Analyze your own calendar
        </Link>
      </div>
    );
  }

  if (!output || !windowStart || !windowEnd) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-navy-600 bg-navy-800 flex-shrink-0">
        <Link href="/" className="font-bold text-base tracking-tight text-white">
          Time<span className="text-brand-blue">Shift</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            Shared snapshot · {id}
          </span>
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-md bg-brand-blue text-white hover:bg-blue-500 transition-colors"
          >
            Analyze my calendar
          </Link>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden">
        <ResultsView
          output={output}
          windowStart={windowStart}
          windowEnd={windowEnd}
          isDemo
        />
      </div>
    </div>
  );
}

/**
 * Rehydrate Date objects from a JSON-parsed AnalysisOutput.
 * JSON.parse turns Date strings into plain strings; we restore them here.
 */
function rehydrateDates(output: AnalysisOutput): AnalysisOutput {
  return {
    ...output,
    dstWindows: output.dstWindows.map((w) => ({
      ...w,
      start: new Date(w.start),
      end: new Date(w.end),
    })),
    shiftedEvents: output.shiftedEvents.map((s) => ({
      ...s,
      affectedDates: s.affectedDates.map((d) => new Date(d)),
    })),
    conflicts: output.conflicts.map((c) => ({
      ...c,
      overlapStart: new Date(c.overlapStart),
      overlapEnd: new Date(c.overlapEnd),
      date: new Date(c.date),
    })),
  };
}


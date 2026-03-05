"use client";

import Link from "next/link";
import { DEMO_ANALYSIS, DEMO_WINDOW } from "@/lib/demo-data";
import ResultsView from "@/components/results/ResultsView";

export default function DemoPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-navy-600 bg-navy-800 flex-shrink-0">
        <Link href="/" className="font-bold text-base tracking-tight text-white">
          Time<span className="text-brand-blue">Shift</span>
        </Link>
        <Link
          href="/"
          className="text-xs px-3 py-1.5 rounded-md bg-brand-blue text-white hover:bg-blue-500 transition-colors"
        >
          Connect my calendar
        </Link>
      </nav>

      <div className="flex-1 overflow-hidden">
        <ResultsView
          output={DEMO_ANALYSIS}
          windowStart={DEMO_WINDOW.start}
          windowEnd={DEMO_WINDOW.end}
          isDemo
        />
      </div>
    </div>
  );
}

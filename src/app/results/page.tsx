"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import ResultsView from "@/components/results/ResultsView";

export default function ResultsPage() {
  const router = useRouter();
  const { analysisOutput, windowStart, windowEnd, clearSession } = useAppStore();

  // Redirect to landing if no analysis data (e.g. direct navigation or refresh)
  useEffect(() => {
    if (!analysisOutput || !windowStart || !windowEnd) {
      router.replace("/");
    }
  }, [analysisOutput, windowStart, windowEnd, router]);

  if (!analysisOutput || !windowStart || !windowEnd) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-navy-600 bg-navy-800 no-print flex-shrink-0">
        <Link href="/" className="font-bold text-base tracking-tight text-white">
          Time<span className="text-brand-blue">Shift</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/connect"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Change calendars
          </Link>
          <button
            onClick={() => {
              clearSession();
              router.push("/");
            }}
            className="text-xs text-gray-500 hover:text-brand-red transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden">
        <ResultsView
          output={analysisOutput}
          windowStart={windowStart}
          windowEnd={windowEnd}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { exchangeCodeForToken } from "@/lib/google-oauth";
import { fetchCalendarList, fetchAllCalendarsEvents } from "@/lib/google-calendar";
import { analyzeEvents, getNextDSTWindow } from "@/lib/dst-engine";
import { useAppStore } from "@/lib/store";
import type { GoogleCalendar } from "@/lib/types";

// Wrap in Suspense because useSearchParams requires it
export default function ConnectPage() {
  return (
    <Suspense>
      <ConnectInner />
    </Suspense>
  );
}

type Step = "exchanging" | "setup" | "analyzing" | "error";

function ConnectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useAppStore();

  const [step, setStep] = useState<Step>("exchanging");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [progressMsg, setProgressMsg] = useState("Authenticating...");
  const [eventsCount, setEventsCount] = useState(0);

  // Calendar setup state
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [windowStart, setWindowStart] = useState<string>("");
  const [windowEnd, setWindowEnd] = useState<string>("");

  const exchangeAttempted = useRef(false);

  const handleError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setStep("error");
  }, []);

  // OAuth callback: exchange code for token
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      handleError(
        oauthError === "access_denied"
          ? "You declined calendar access. Please try again and allow read-only access to continue."
          : `Google sign-in failed: ${oauthError}`
      );
      return;
    }

    if (!code || !state) {
      handleError("No authorization code received. Please start from the beginning.");
      return;
    }

    // Already have a token from a previous auth
    if (store.accessToken) {
      void loadCalendars(store.accessToken);
      return;
    }

    // Guard against React Strict Mode double-invocation, which would consume
    // the sessionStorage state on the first run, causing a false state mismatch.
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    exchangeCodeForToken(code, state)
      .then((token) => {
        store.setAccessToken(token);
        return loadCalendars(token);
      })
      .catch((e) => {
        handleError(e instanceof Error ? e.message : "Sign-in failed. Please try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCalendars(token: string) {
    setProgressMsg("Fetching your calendars...");
    try {
      const list = await fetchCalendarList(token);
      setCalendars(list);

      // Pre-select primary calendar
      const primaryIds = list.filter((c) => c.primary).map((c) => c.id);
      setSelectedIds(new Set(primaryIds.length > 0 ? primaryIds : [list[0]?.id].filter(Boolean)));

      // Pre-fill DST window dates
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const window = getNextDSTWindow(userTz, "America/New_York");
      setWindowStart(toDateInputValue(window.start));
      setWindowEnd(toDateInputValue(window.end));

      setStep("setup");
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        handleError("Session expired. Please sign in again.");
      } else {
        handleError(e instanceof Error ? e.message : "Failed to load calendars.");
      }
    }
  }

  function toggleCalendar(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleAnalyze() {
    if (!store.accessToken) return;
    if (selectedIds.size === 0) return;

    const start = new Date(windowStart);
    const end = new Date(windowEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      handleError("Invalid date range. Please select a valid start and end date.");
      return;
    }

    setStep("analyzing");
    setProgressMsg("Fetching events...");
    setEventsCount(0);

    try {
      // Fetch events from 14 days before the window to get pre-gap reference data
      const fetchStart = new Date(start.getTime() - 14 * 24 * 60 * 60 * 1000);

      const events = await fetchAllCalendarsEvents(
        store.accessToken,
        [...selectedIds],
        fetchStart,
        end,
        (count) => {
          setEventsCount(count);
          setProgressMsg(`Fetching events... ${count} found`);
        }
      );

      setProgressMsg("Analyzing DST shifts...");

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const output = analyzeEvents({
        events,
        userTimezone,
        referenceTimezone: "", // auto-detect
        windowStart: start,
        windowEnd: end,
      });

      store.setAnalysisOutput(output);
      store.setWindow(start, end);
      store.setCalendars(calendars);
      store.setSelectedCalendarIds([...selectedIds]);

      router.push("/results");
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        handleError("Your session expired. Please sign in again.");
      } else {
        handleError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
        <Link href="/" className="font-bold text-lg tracking-tight text-white">
          Time<span className="text-brand-blue">Shift</span>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {step === "exchanging" && (
            <LoadingCard message="Completing sign-in..." />
          )}

          {step === "error" && (
            <ErrorCard message={errorMsg} />
          )}

          {step === "analyzing" && (
            <LoadingCard
              message={progressMsg}
              detail={eventsCount > 0 ? `${eventsCount} events loaded` : undefined}
            />
          )}

          {step === "setup" && (
            <SetupCard
              calendars={calendars}
              selectedIds={selectedIds}
              windowStart={windowStart}
              windowEnd={windowEnd}
              onToggleCalendar={toggleCalendar}
              onWindowStartChange={setWindowStart}
              onWindowEndChange={setWindowEnd}
              onAnalyze={handleAnalyze}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingCard({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 rounded-full border-2 border-brand-blue border-t-transparent animate-spin mx-auto" />
      <p className="text-white font-medium">{message}</p>
      {detail && <p className="text-gray-500 text-sm">{detail}</p>}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-red/10 border border-brand-red/30 flex items-center justify-center mx-auto">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-white font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
      <Link
        href="/"
        className="inline-block px-6 py-2.5 rounded-lg bg-brand-blue text-white font-medium hover:bg-blue-500 transition-colors"
      >
        Start over
      </Link>
    </div>
  );
}

function SetupCard({
  calendars,
  selectedIds,
  windowStart,
  windowEnd,
  onToggleCalendar,
  onWindowStartChange,
  onWindowEndChange,
  onAnalyze,
}: {
  calendars: GoogleCalendar[];
  selectedIds: Set<string>;
  windowStart: string;
  windowEnd: string;
  onToggleCalendar: (id: string) => void;
  onWindowStartChange: (v: string) => void;
  onWindowEndChange: (v: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="bg-navy-700 rounded-xl border border-navy-600 overflow-hidden animate-fade-in">
      <div className="px-6 py-5 border-b border-navy-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            <h1 className="text-white font-semibold">Connected to Google Calendar</h1>
            <p className="text-gray-500 text-xs mt-0.5">Read-only access granted</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Calendar selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Calendars to analyze
          </label>
          <div className="space-y-2">
            {calendars.map((cal) => (
              <label
                key={cal.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-navy-600 hover:bg-navy-500 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(cal.id)}
                  onChange={() => onToggleCalendar(cal.id)}
                  className="w-4 h-4 rounded accent-brand-blue"
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: cal.backgroundColor ?? "#3b82f6",
                    }}
                  />
                  <span className="text-white text-sm truncate">{cal.summary}</span>
                  {cal.primary && (
                    <span className="text-[10px] text-gray-500 bg-navy-500 px-1.5 py-0.5 rounded flex-shrink-0">
                      primary
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            DST window to analyze
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={windowStart}
                onChange={(e) => onWindowStartChange(e.target.value)}
                className="w-full bg-navy-600 border border-navy-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={windowEnd}
                onChange={(e) => onWindowEndChange(e.target.value)}
                className="w-full bg-navy-600 border border-navy-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Pre-filled with the next active DST gap for your timezone
          </p>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-navy-600/50 border border-navy-500">
          <svg
            className="flex-shrink-0 mt-0.5"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              stroke="#6b7280"
              strokeWidth="2"
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
            />
          </svg>
          <p className="text-xs text-gray-500 leading-relaxed">
            TimeShift reads your events in-browser. Nothing is stored on our servers.
            Your access token is held in memory and lost when you close this tab.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-navy-600 bg-navy-700/50">
        <button
          onClick={onAnalyze}
          disabled={selectedIds.size === 0}
          className="w-full py-3 rounded-lg bg-brand-blue text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Analyze {selectedIds.size} calendar{selectedIds.size !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

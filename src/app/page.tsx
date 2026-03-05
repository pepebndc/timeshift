"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { initiateOAuth } from "@/lib/google-oauth";

export default function LandingPage() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      await initiateOAuth();
      // Page will redirect — no need to reset state
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start sign-in.");
      setConnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
        <span className="font-bold text-lg tracking-tight text-white">
          Time<span className="text-brand-blue">Shift</span>
        </span>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <Link href="/demo" className="hover:text-white transition-colors">
            Demo
          </Link>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-4 py-1.5 rounded-md bg-brand-blue text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-brand-amber/5 rounded-full blur-3xl" />
        </div>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-amber/30 bg-brand-amber/10 text-brand-amber text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse-slow" />
          Gap window active · Mar 8–29, 2026
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight max-w-3xl mb-6">
          Your calendar has a{" "}
          <span className="text-brand-blue">blind spot.</span>
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
          When the US and Europe change clocks on different weeks, recurring
          meetings silently shift by an hour. TimeShift finds them{" "}
          <em className="text-white not-italic font-medium">
            before they find you.
          </em>
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm max-w-md">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleConnect}
            disabled={connecting || !mounted}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-blue text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {connecting ? (
              <>
                <Spinner />
                Connecting...
              </>
            ) : (
              <>
                <GoogleIcon />
                Connect Google Calendar
              </>
            )}
          </button>

          <Link
            href="/demo"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-navy-500 text-gray-300 font-medium hover:border-navy-400 hover:text-white transition-colors text-base"
          >
            See a demo
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-600">
          Read-only access · No calendar data stored
        </p>
      </main>

      {/* How it works */}
      <section className="border-t border-navy-600 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                n: "1",
                title: "Connect your calendar",
                desc: "Sign in with Google. TimeShift requests read-only access — it can never modify your events.",
              },
              {
                n: "2",
                title: "Scan DST windows",
                desc: "TimeShift finds recurring meetings anchored in US timezones and checks how they appear during the gap weeks.",
              },
              {
                n: "3",
                title: "See what shifts",
                desc: "Get a clear list of every affected meeting, the exact time change, and any scheduling conflicts the shift creates.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-sm font-bold flex items-center justify-center">
                  {n}
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-navy-600 px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>
            Time<span className="text-gray-500">Shift</span> — Find the gap
            before it finds you.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/policy" className="hover:text-gray-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              Terms
            </Link>
            <span>
              Created by{" "}
              <a
                href="https://github.com/pepebndc"
                className="hover:text-gray-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pepe Blasco
              </a>
            </span>
            <a
              href="https://github.com/pepebndc/timeshift"
              className="hover:text-gray-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
          <span>US EDT · CET · WET supported</span>
        </div>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#fff"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#fff"
        opacity=".8"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#fff"
        opacity=".6"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"
      />
      <path
        fill="#fff"
        opacity=".4"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="31.4"
        strokeDashoffset="10"
        strokeLinecap="round"
      />
    </svg>
  );
}

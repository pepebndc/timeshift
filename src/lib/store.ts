"use client";

import { create } from "zustand";
import type { AnalysisOutput, GoogleCalendar } from "./types";

interface AppState {
  // Auth — token held in memory only, never persisted
  accessToken: string | null;

  // Calendar setup
  calendars: GoogleCalendar[];
  selectedCalendarIds: string[];
  windowStart: Date | null;
  windowEnd: Date | null;

  // Analysis results
  analysisOutput: AnalysisOutput | null;

  // Actions
  setAccessToken: (token: string) => void;
  clearSession: () => void;
  setCalendars: (calendars: GoogleCalendar[]) => void;
  setSelectedCalendarIds: (ids: string[]) => void;
  setWindow: (start: Date, end: Date) => void;
  setAnalysisOutput: (output: AnalysisOutput) => void;
}

export const useAppStore = create<AppState>((set) => ({
  accessToken: null,
  calendars: [],
  selectedCalendarIds: [],
  windowStart: null,
  windowEnd: null,
  analysisOutput: null,

  setAccessToken: (token) => set({ accessToken: token }),

  clearSession: () =>
    set({
      accessToken: null,
      calendars: [],
      selectedCalendarIds: [],
      windowStart: null,
      windowEnd: null,
      analysisOutput: null,
    }),

  setCalendars: (calendars) => {
    const primaryIds = calendars
      .filter((c) => c.primary)
      .map((c) => c.id);
    set({
      calendars,
      selectedCalendarIds: primaryIds.length > 0 ? primaryIds : [calendars[0]?.id].filter(Boolean),
    });
  },

  setSelectedCalendarIds: (ids) => set({ selectedCalendarIds: ids }),

  setWindow: (start, end) => set({ windowStart: start, windowEnd: end }),

  setAnalysisOutput: (output) => set({ analysisOutput: output }),
}));

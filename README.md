# TimeShift

Detect meetings that silently shift time during Daylight Saving Time transition gaps — the weeks when the US and Europe change clocks on different dates.

**[Live demo →](https://gettimeshifted.com/demo)**

---

## The problem

When the US springs forward (early March) and Europe doesn't follow for another 3 weeks, recurring meetings anchored in a US timezone appear 1 hour earlier in European calendars. Google Calendar silently adjusts the UTC time with no warning. You find out when you miss the meeting.

TimeShift finds every affected event before the gap starts, shows you the exact before/after times, and flags any scheduling conflicts the shift creates.

## Features

- **Google Calendar integration** — read-only OAuth, no data stored on servers
- **DST gap detection** — auto-detects the transition window for your timezone pair
- **Shifted events list** — every recurring meeting with its exact before/after local time
- **Conflict timeline** — visual week-by-week Gantt showing amber (shifted) and red (conflict) events
- **Conflict detail modal** — overlap duration, visual timeline, copy to clipboard
- **Demo mode** — full experience without signing in (`/demo`)
- **Shareable links** — encode results in a URL hash; no server, no storage
- **PDF export** — `window.print()` with print-optimized styles
- **Mobile-first** — list view works on all screen sizes; timeline on desktop

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS v3 |
| State | Zustand (token held in memory only) |
| Calendar API | Google Calendar API v3 |
| DST logic | Custom TypeScript, zero external deps |
| Auth | OAuth 2.0 PKCE + serverless token exchange |
| Hosting | Vercel |

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/yourname/timeshift.git
cd timeshift
npm install
```

### 2. Set up Google OAuth

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a project and enable the **Google Calendar API**
3. Create an **OAuth 2.0 Client ID** — application type: **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/connect` (local dev)
   - `https://your-domain.vercel.app/connect` (production)
5. Copy the client ID and client secret

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The `/demo` route works without any credentials.

## Architecture

### Data flow

```
Browser
  │
  ├── OAuth PKCE ──────────────────────> Google (returns auth code)
  │
  ├── POST /api/auth/token ────────────> Google (exchanges code for access token)
  │         (client_secret stays server-side)
  │
  ├── GET /calendar/v3/calendarList ───> Google Calendar API
  ├── GET /calendar/v3/calendars/.../events (paginated, singleEvents=true)
  │
  └── DST Analysis Engine (pure client-side TypeScript)
        ├── Detect DST transition dates via Intl API
        ├── Find gap windows where offset diff changes
        ├── Group events by recurringEventId
        ├── Compare local display times before vs. during gap
        ├── Flag shifted events and detect overlapping pairs
        └── Store results in Zustand (memory only)
```

### Security model

- **No calendar data leaves the browser.** All analysis is client-side.
- Access token held in Zustand memory — lost when the tab closes.
- OAuth `code_verifier` stored in `sessionStorage`, deleted immediately after token exchange.
- CSRF state validated before every token exchange.
- `/api/auth/token` is stateless — exchanges code for token and returns only `access_token`, never a refresh token.
- Read-only OAuth scope: `calendar.readonly`.
- Content Security Policy headers restrict all external connections.

### DST engine

`src/lib/dst-engine.ts` — zero dependencies, uses only the ECMAScript `Intl` API.

The engine scans day-by-day through the year to find dates where the UTC offset difference between two timezones changes from the January baseline. Each such period is a "gap window." For each recurring event, it compares the local display time (in the user's timezone) for instances before the gap against instances during it — if they differ, the event is shifted.

## Project structure

```
src/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── connect/page.tsx           # OAuth callback + calendar setup
│   ├── results/page.tsx           # Results dashboard
│   ├── demo/page.tsx              # Demo with fake data
│   ├── share/[id]/page.tsx        # Read-only shared snapshot
│   └── api/auth/token/route.ts    # Stateless token exchange
├── components/results/
│   ├── ResultsView.tsx            # Shared layout (results + demo + share)
│   ├── SummaryBar.tsx             # Timezone pair, counts, export
│   ├── EventCard.tsx              # Shifted event card
│   ├── Timeline.tsx               # Week-by-week Gantt timeline
│   └── ConflictModal.tsx          # Conflict detail modal
└── lib/
    ├── types.ts                   # Shared TypeScript types
    ├── dst-engine.ts              # DST analysis engine
    ├── google-oauth.ts            # PKCE OAuth helpers
    ├── google-calendar.ts         # Calendar API client
    ├── demo-data.ts               # Hardcoded demo scenario
    ├── store.ts                   # Zustand store
    └── share.ts                   # Share URL encoder
```

## Privacy

TimeShift reads your calendar events in your browser to perform analysis. It does not store, transmit, or log any calendar data. The only data that leaves your browser is the OAuth authorization code (exchanged once for an access token) and the Calendar API requests made directly from your browser to Google's servers.

Analytics, if added, would be page-view-only (no event data).

## License

MIT

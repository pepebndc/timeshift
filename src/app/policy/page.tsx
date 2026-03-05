import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — TimeShift",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy text-gray-300">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
        <Link href="/" className="font-bold text-lg tracking-tight text-white">
          Time<span className="text-brand-blue">Shift</span>
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-10">Last updated: March 2026</p>

        <Section title="Overview">
          TimeShift is a client-side tool that analyzes your Google Calendar for
          DST-related meeting shifts. We are committed to handling your data with
          minimal footprint and full transparency.
        </Section>

        <Section title="What we access">
          When you connect your Google Calendar, TimeShift requests read-only
          access using the scope{" "}
          <code className="text-sky-400 text-sm">
            https://www.googleapis.com/auth/calendar.readonly
          </code>
          . This allows us to read your calendar list and event data. We cannot
          create, modify, or delete any events.
        </Section>

        <Section title="How your data is used">
          All calendar data is fetched and processed entirely in your browser.
          Your events are never transmitted to our servers, never stored in a
          database, and never logged. The analysis runs locally and the results
          exist only in your browser session.
        </Section>

        <Section title="Access tokens">
          The OAuth access token issued by Google is held in memory for the
          duration of your session only. It is never written to{" "}
          <code className="text-sky-400 text-sm">localStorage</code>,{" "}
          <code className="text-sky-400 text-sm">sessionStorage</code>, or any
          cookie. When you close the tab, the token is gone.
        </Section>

        <Section title="Third parties">
          TimeShift does not share any data with third parties. We do not use
          analytics trackers, advertising networks, or data brokers. The only
          external service contacted is the Google Calendar API, which you
          authorize directly.
        </Section>

        <Section title="Data retention">
          We retain no user data. There is no account system, no database of
          calendar events, and no persistent identifiers tied to you.
        </Section>

        <Section title="Contact">
          If you have questions about this policy, open an issue on{" "}
          <a
            href="https://github.com/pepebndc/timeshift"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline"
          >
            GitHub
          </a>
          .
        </Section>
      </main>

      <footer className="border-t border-navy-600 px-6 py-6 text-center text-xs text-gray-600">
        <Link href="/terms" className="hover:text-gray-400 transition-colors">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
      <p className="text-sm leading-relaxed text-gray-400">{children}</p>
    </section>
  );
}

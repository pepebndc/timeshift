import Link from "next/link";

export const metadata = {
  title: "Terms of Service — TimeShift",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy text-gray-300">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
        <Link href="/" className="font-bold text-lg tracking-tight text-white">
          Time<span className="text-brand-blue">Shift</span>
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-10">Last updated: March 2026</p>

        <Section title="Acceptance">
          By using TimeShift you agree to these terms. If you do not agree,
          please do not use the service.
        </Section>

        <Section title="Description of service">
          TimeShift is a free, open-source tool that analyzes Google Calendar
          data in your browser to identify recurring meetings affected by
          Daylight Saving Time transitions. It is provided as-is for
          informational purposes.
        </Section>

        <Section title="Use of the service">
          You may use TimeShift for personal or professional purposes. You agree
          not to attempt to reverse-engineer, abuse, or use the service in any
          way that violates Google's Terms of Service or applicable law. You are
          responsible for the Google account you connect.
        </Section>

        <Section title="No warranty">
          TimeShift is provided "as is" without warranty of any kind. We make no
          guarantees about the accuracy of the DST analysis, the completeness of
          conflict detection, or the uninterrupted availability of the service.
          Always verify critical scheduling decisions independently.
        </Section>

        <Section title="Limitation of liability">
          To the maximum extent permitted by law, the authors of TimeShift shall
          not be liable for any direct, indirect, incidental, or consequential
          damages arising from your use of the service, including missed
          meetings, scheduling errors, or data loss.
        </Section>

        <Section title="Third-party services">
          TimeShift integrates with the Google Calendar API. Your use of Google
          services is governed by{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline"
          >
            Google's Terms of Service
          </a>
          . We are not affiliated with or endorsed by Google.
        </Section>

        <Section title="Open source">
          TimeShift is open source under the MIT License. The source code is
          available on{" "}
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

        <Section title="Changes">
          We may update these terms at any time. Continued use of the service
          after changes constitutes acceptance of the revised terms.
        </Section>

        <Section title="Contact">
          Questions or concerns can be raised via{" "}
          <a
            href="https://github.com/pepebndc/timeshift/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline"
          >
            GitHub Issues
          </a>
          .
        </Section>
      </main>

      <footer className="border-t border-navy-600 px-6 py-6 text-center text-xs text-gray-600">
        <Link href="/policy" className="hover:text-gray-400 transition-colors">
          Privacy Policy
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

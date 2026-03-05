import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TimeShift — Find the gap before it finds you",
  description:
    "Detect meetings that silently shift during Daylight Saving Time transition gaps between the US and Europe. Connect your Google Calendar and see what changes before it catches you off guard.",
  keywords: ["DST", "Daylight Saving Time", "calendar", "timezone", "meeting conflicts"],
  openGraph: {
    title: "TimeShift — Find the gap before it finds you",
    description:
      "Detect meetings that silently shift during DST transitions. Connect Google Calendar, see what shifts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

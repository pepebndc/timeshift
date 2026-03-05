import type { AnalysisOutput } from "./types";

/**
 * Encodes an AnalysisOutput into a shareable URL.
 * Data is base64url-encoded into the URL hash — never sent to a server.
 */
export function generateShareUrl(
  output: AnalysisOutput,
  windowStart: Date,
  windowEnd: Date
): string {
  const payload = JSON.stringify({ output, windowStart, windowEnd });
  const encoded = btoa(payload)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const id = Date.now().toString(36);
  return `${window.location.origin}/share/${id}#${encoded}`;
}

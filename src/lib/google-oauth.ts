/**
 * Google OAuth 2.0 PKCE flow — runs entirely in the browser.
 * The client_secret never touches the client; token exchange happens
 * through our /api/auth/token serverless function.
 */

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const STATE_KEY = "ts_oauth_state";
const VERIFIER_KEY = "ts_code_verifier";

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function initiateOAuth(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

  if (!clientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.");
  }

  const codeVerifier = generateRandomString(48);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = generateRandomString(16);
  const redirectUri = `${appUrl}/connect`;

  // Store verifier and state in sessionStorage (cleared on tab close)
  sessionStorage.setItem(VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  returnedState: string
): Promise<string> {
  const storedState = sessionStorage.getItem(STATE_KEY);
  const codeVerifier = sessionStorage.getItem(VERIFIER_KEY);

  // Clean up immediately to prevent reuse
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  if (!storedState || storedState !== returnedState) {
    throw new Error("OAuth state mismatch — possible CSRF attack.");
  }

  if (!codeVerifier) {
    throw new Error("Code verifier not found. Please try connecting again.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  const redirectUri = `${appUrl}/connect`;

  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, codeVerifier, redirectUri }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Token exchange failed.");
  }

  const { access_token } = await res.json();

  if (!access_token || typeof access_token !== "string") {
    throw new Error("Invalid token response.");
  }

  return access_token;
}

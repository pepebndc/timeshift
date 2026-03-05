import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { code, codeVerifier, redirectUri } = body as Record<string, unknown>;

  if (
    typeof code !== "string" ||
    typeof codeVerifier !== "string" ||
    typeof redirectUri !== "string"
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate redirectUri is from our own origin (prevent open-redirect abuse)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!redirectUri.startsWith(appUrl)) {
    return NextResponse.json({ error: "Invalid redirect URI" }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("[auth/token] Google error:", data?.error);
    return NextResponse.json(
      { error: data?.error_description ?? "Token exchange failed" },
      { status: 400 }
    );
  }

  // Return only the access_token — never relay refresh_token to client
  return NextResponse.json({ access_token: data.access_token });
}

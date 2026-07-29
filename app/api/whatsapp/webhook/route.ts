import { NextRequest, NextResponse } from "next/server";

/**
 * WhatsApp Cloud API webhook.
 * GET  — Meta verification challenge
 * POST — delivery status / inbound messages (acknowledged)
 */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    // Acknowledge quickly so Meta does not retry.
    const body = (await request.json()) as unknown;
    if (process.env.NODE_ENV !== "production") {
      console.log("WhatsApp webhook:", JSON.stringify(body).slice(0, 500));
    }
  } catch {
    // ignore malformed payloads
  }

  return NextResponse.json({ ok: true });
}

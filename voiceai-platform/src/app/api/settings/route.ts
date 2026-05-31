import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting, getAllSettings } from "@/lib/db";

export async function GET() {
  try {
    const settings = getAllSettings();
    // Mask sensitive values
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (key.includes("TOKEN") || key.includes("KEY") || key.includes("SECRET") || key.includes("AUTH")) {
        masked[key] = value ? `${value.slice(0, 4)}${"*".repeat(Math.max(0, value.length - 8))}${value.slice(-4)}` : "";
      } else {
        masked[key] = value;
      }
    }
    return NextResponse.json({ settings: masked, configured: Object.keys(settings) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    const allowedKeys = [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "OPENAI_API_KEY",
      "BASE_URL",
      "DEFAULT_VOICE",
      "DEFAULT_MODEL",
      "DEFAULT_LANGUAGE",
    ];

    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "Invalid setting key" }, { status: 400 });
    }

    setSetting(key, value);

    return NextResponse.json({ success: true, key });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "settings object is required" }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined && value !== "") {
        setSetting(key, value);
      }
    }

    // Verify Twilio credentials if provided
    let twilioStatus = "not_configured";
    const sid = getSetting("TWILIO_ACCOUNT_SID");
    const token = getSetting("TWILIO_AUTH_TOKEN");
    if (sid && token) {
      try {
        const twilio = (await import("twilio")).default;
        const client = twilio(sid, token);
        await client.api.accounts(sid).fetch();
        twilioStatus = "connected";
      } catch {
        twilioStatus = "invalid";
      }
    }

    // Verify OpenAI key if provided
    let openaiStatus = "not_configured";
    const openaiKey = getSetting("OPENAI_API_KEY");
    if (openaiKey) {
      try {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey: openaiKey });
        await client.models.list();
        openaiStatus = "connected";
      } catch {
        openaiStatus = "invalid";
      }
    }

    return NextResponse.json({
      success: true,
      status: { twilio: twilioStatus, openai: openaiStatus },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

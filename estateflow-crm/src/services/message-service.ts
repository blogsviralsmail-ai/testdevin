const DRY_RUN = !process.env.TWILIO_ACCOUNT_SID || process.env.DRY_RUN === 'true';

interface SendMessageResult {
  success: boolean;
  messageId: string | null;
  message: string;
}

interface MessagePayload {
  to: string;
  body: string;
  mediaUrl?: string;
}

export async function sendWhatsApp(payload: MessagePayload): Promise<SendMessageResult> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] WhatsApp to ${payload.to}: ${payload.body}`);
    return { success: true, messageId: `WA_dry_${Date.now()}`, message: '[DRY RUN] WhatsApp sent' };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.WHATSAPP_SENDER_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { success: false, messageId: null, message: 'WhatsApp not configured' };
  }

  try {
    const params = new URLSearchParams({
      To: `whatsapp:${payload.to}`,
      From: `whatsapp:${from}`,
      Body: payload.body,
    });
    if (payload.mediaUrl) params.set('MediaUrl', payload.mediaUrl);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );

    const result = await response.json();
    return {
      success: response.ok,
      messageId: result.sid || null,
      message: response.ok ? 'WhatsApp sent' : result.message || 'Failed',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, messageId: null, message: errMsg };
  }
}

export async function sendSMS(payload: MessagePayload): Promise<SendMessageResult> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] SMS to ${payload.to}: ${payload.body}`);
    return { success: true, messageId: `SMS_dry_${Date.now()}`, message: '[DRY RUN] SMS sent' };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { success: false, messageId: null, message: 'SMS not configured' };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: payload.to,
          From: from,
          Body: payload.body,
        }),
      }
    );

    const result = await response.json();
    return {
      success: response.ok,
      messageId: result.sid || null,
      message: response.ok ? 'SMS sent' : result.message || 'Failed',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, messageId: null, message: errMsg };
  }
}

export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

const DRY_RUN = !process.env.RESEND_API_KEY || process.env.DRY_RUN === 'true';

interface SendEmailResult {
  success: boolean;
  messageId: string | null;
  message: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Email to ${payload.to}: ${payload.subject}`);
    return { success: true, messageId: `EMAIL_dry_${Date.now()}`, message: '[DRY RUN] Email sent' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, messageId: null, message: 'Email not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from || process.env.EMAIL_FROM || 'EstateFlow CRM <noreply@estateflow.app>',
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    const result = await response.json();
    return {
      success: response.ok,
      messageId: result.id || null,
      message: response.ok ? 'Email sent' : result.message || 'Failed',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, messageId: null, message: errMsg };
  }
}

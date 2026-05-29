import { NextResponse } from 'next/server';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const conferenceName = url.searchParams.get('conferenceName');
  const leadPhone = url.searchParams.get('leadPhone');

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  const safeConferenceName = escapeXml(conferenceName || 'default');

  if (twilioAccountSid && twilioAuthToken && twilioPhone && leadPhone) {
    try {
      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: leadPhone,
            From: twilioPhone,
            Twiml: `<Response><Dial><Conference>${safeConferenceName}</Conference></Dial></Response>`,
          }),
        }
      );
    } catch (err) {
      console.error('Failed to call lead:', err);
    }
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you now.</Say>
  <Dial>
    <Conference>${safeConferenceName}</Conference>
  </Dial>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

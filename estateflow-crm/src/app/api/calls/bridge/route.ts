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
  const leadName = url.searchParams.get('leadName');
  const leadPhone = url.searchParams.get('leadPhone');
  const source = url.searchParams.get('source');

  const safeSource = escapeXml(source || 'unknown source');
  const safeLeadName = escapeXml(leadName || 'the lead');

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/api/calls/bridge/connect?conferenceName=${encodeURIComponent(conferenceName || '')}&amp;leadPhone=${encodeURIComponent(leadPhone || '')}">
    <Say voice="alice">New real estate lead from ${safeSource}. Press any key to connect with ${safeLeadName}.</Say>
  </Gather>
  <Say voice="alice">No input received. Goodbye.</Say>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

import type { Lead, Profile, CallLog } from '@/types';

const DRY_RUN = !process.env.TWILIO_ACCOUNT_SID || process.env.DRY_RUN === 'true';

interface BridgeCallResult {
  success: boolean;
  callSid: string | null;
  conferenceSid: string | null;
  message: string;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) return null;
  return { accountSid, authToken, phoneNumber };
}

export async function initiateBridgeCall(
  lead: Lead,
  agent: Profile,
  organizationId: string
): Promise<BridgeCallResult> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Bridge call: Agent ${agent.full_name} → Lead ${lead.full_name} (${lead.phone})`);
    const fakeSid = `CA_dry_${Date.now()}`;
    return {
      success: true,
      callSid: fakeSid,
      conferenceSid: `CF_dry_${Date.now()}`,
      message: `[DRY RUN] Bridge call simulated for ${lead.full_name}`,
    };
  }

  const config = getTwilioConfig();
  if (!config) {
    return { success: false, callSid: null, conferenceSid: null, message: 'Twilio not configured' };
  }

  try {
    const conferenceName = `lead_${lead.id}_${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Step 1: Call the agent first
    const agentCallResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: agent.phone || '',
          From: config.phoneNumber,
          Url: `${baseUrl}/api/calls/bridge?conferenceName=${conferenceName}&leadName=${encodeURIComponent(lead.full_name)}&leadPhone=${encodeURIComponent(lead.phone)}&source=${lead.source}`,
          StatusCallback: `${baseUrl}/api/calls/status?leadId=${lead.id}&agentId=${agent.id}&orgId=${organizationId}`,
          StatusCallbackEvent: 'initiated ringing answered completed',
        }),
      }
    );

    const agentCall = await agentCallResponse.json();

    return {
      success: agentCallResponse.ok,
      callSid: agentCall.sid || null,
      conferenceSid: conferenceName,
      message: agentCallResponse.ok ? 'Agent call initiated' : agentCall.message || 'Failed to initiate call',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, callSid: null, conferenceSid: null, message: errMsg };
  }
}

export async function makeDirectCall(
  lead: Lead,
  agent: Profile
): Promise<BridgeCallResult> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Direct call: Agent ${agent.full_name} → ${lead.phone}`);
    return {
      success: true,
      callSid: `CA_dry_${Date.now()}`,
      conferenceSid: null,
      message: `[DRY RUN] Direct call simulated to ${lead.full_name}`,
    };
  }

  const config = getTwilioConfig();
  if (!config) {
    return { success: false, callSid: null, conferenceSid: null, message: 'Twilio not configured' };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: lead.phone,
          From: config.phoneNumber,
          Twiml: `<Response><Dial callerId="${config.phoneNumber}"><Number>${lead.phone}</Number></Dial></Response>`,
          StatusCallback: `${baseUrl}/api/calls/status?leadId=${lead.id}&agentId=${agent.id}`,
        }),
      }
    );

    const call = await response.json();

    return {
      success: response.ok,
      callSid: call.sid || null,
      conferenceSid: null,
      message: response.ok ? 'Call initiated' : call.message || 'Failed',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, callSid: null, conferenceSid: null, message: errMsg };
  }
}

export function buildCallLog(
  result: BridgeCallResult,
  lead: Lead,
  agent: Profile,
  organizationId: string
): Omit<CallLog, 'id' | 'created_at' | 'lead' | 'agent'> {
  return {
    organization_id: organizationId,
    lead_id: lead.id,
    agent_id: agent.id,
    call_sid: result.callSid,
    conference_sid: result.conferenceSid,
    status: result.success ? 'initiated' : 'failed',
    duration: null,
    recording_url: null,
    outcome: result.success ? 'pending' : 'failed',
    started_at: new Date().toISOString(),
    ended_at: null,
    notes: result.message,
  };
}

import twilio from "twilio";
import { getSetting } from "./db";

export function getTwilioClient() {
  const accountSid = getSetting("TWILIO_ACCOUNT_SID");
  const authToken = getSetting("TWILIO_AUTH_TOKEN");
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured. Go to Settings > API Keys to add them.");
  }
  return twilio(accountSid, authToken);
}

export function getTwilioCredentials() {
  return {
    accountSid: getSetting("TWILIO_ACCOUNT_SID"),
    authToken: getSetting("TWILIO_AUTH_TOKEN"),
  };
}

export async function buyPhoneNumber(areaCode?: string, country = "US") {
  const client = getTwilioClient();
  const baseUrl = getSetting("BASE_URL") || "https://calling.kkhsmedia.com";

  const availableNumbers = await client.availablePhoneNumbers(country).local.list({
    areaCode: areaCode ? parseInt(areaCode) : undefined,
    limit: 1,
    voiceEnabled: true,
  });

  if (availableNumbers.length === 0) {
    const tollFree = await client.availablePhoneNumbers(country).tollFree.list({ limit: 1, voiceEnabled: true });
    if (tollFree.length === 0) throw new Error("No phone numbers available");
    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: tollFree[0].phoneNumber,
      voiceUrl: `${baseUrl}/api/twilio/voice`,
      voiceMethod: "POST",
      statusCallback: `${baseUrl}/api/twilio/status`,
      statusCallbackMethod: "POST",
    });
    return purchased;
  }

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: availableNumbers[0].phoneNumber,
    voiceUrl: `${baseUrl}/api/twilio/voice`,
    voiceMethod: "POST",
    statusCallback: `${baseUrl}/api/twilio/status`,
    statusCallbackMethod: "POST",
  });
  return purchased;
}

export async function makeOutboundCall(toNumber: string, fromNumber: string, agentId: string) {
  const client = getTwilioClient();
  const baseUrl = getSetting("BASE_URL") || "https://calling.kkhsmedia.com";

  const call = await client.calls.create({
    to: toNumber,
    from: fromNumber,
    url: `${baseUrl}/api/twilio/voice?agent_id=${agentId}&direction=outbound`,
    method: "POST",
    statusCallback: `${baseUrl}/api/twilio/status`,
    statusCallbackMethod: "POST",
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    record: true,
  });

  return call;
}

export async function listTwilioNumbers() {
  const client = getTwilioClient();
  const numbers = await client.incomingPhoneNumbers.list();
  return numbers;
}

export function generateTwiml(text: string, voice = "Polly.Joanna") {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  response.say({ voice: voice as "Polly.Joanna" }, text);
  return response.toString();
}

export function generateGatherTwiml(prompt: string, actionUrl: string, voice = "Polly.Joanna") {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  const gather = response.gather({
    input: ["speech"],
    action: actionUrl,
    method: "POST",
    speechTimeout: "auto",
    language: "en-US",
    enhanced: true,
  });
  gather.say({ voice: voice as "Polly.Joanna" }, prompt);

  response.say({ voice: voice as "Polly.Joanna" }, "I didn't catch that. Goodbye!");
  response.hangup();

  return response.toString();
}

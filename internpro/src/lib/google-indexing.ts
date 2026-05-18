import jwt from "jsonwebtoken";

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface IndexingResult {
  url: string;
  status: number;
  response: Record<string, unknown>;
}

function getCredentials(): ServiceAccountCredentials {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }
  return JSON.parse(raw);
}

async function getAccessToken(): Promise<string> {
  const creds = getCredentials();
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: creds.client_email,
    sub: creds.client_email,
    aud: creds.token_uri,
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/indexing",
  };

  const token = jwt.sign(payload, creds.private_key, { algorithm: "RS256" });

  const resp = await fetch(creds.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
    }),
  });

  const data = await resp.json();
  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function notifyUrlUpdate(url: string): Promise<IndexingResult> {
  const accessToken = await getAccessToken();

  const resp = await fetch(
    "https://indexing.googleapis.com/v3/urlNotifications:publish",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    }
  );

  const response = await resp.json();
  return { url, status: resp.status, response };
}

export async function notifyUrlRemoved(url: string): Promise<IndexingResult> {
  const accessToken = await getAccessToken();

  const resp = await fetch(
    "https://indexing.googleapis.com/v3/urlNotifications:publish",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type: "URL_DELETED" }),
    }
  );

  const response = await resp.json();
  return { url, status: resp.status, response };
}

export async function batchNotifyUrls(
  urls: string[],
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<IndexingResult[]> {
  const accessToken = await getAccessToken();
  const results: IndexingResult[] = [];

  for (const url of urls) {
    const resp = await fetch(
      "https://indexing.googleapis.com/v3/urlNotifications:publish",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ url, type }),
      }
    );

    const response = await resp.json();
    results.push({ url, status: resp.status, response });
  }

  return results;
}

export async function getUrlNotificationStatus(url: string): Promise<Record<string, unknown>> {
  const accessToken = await getAccessToken();

  const resp = await fetch(
    `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(url)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return resp.json();
}

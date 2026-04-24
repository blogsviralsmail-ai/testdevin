import dns from "dns/promises";
import net from "net";
import { Agent as UndiciAgent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";

/**
 * SSRF guard: validate that a user-supplied URL is safe to fetch from the
 * server. Rejects non-http(s) schemes, hostnames that resolve to private /
 * reserved IP ranges (loopback, link-local, cloud metadata, RFC1918, etc.),
 * and raw IP URLs targeting those ranges.
 *
 * Returns the parsed URL together with the pre-resolved IPs so the caller
 * can pin the subsequent HTTP lookup and avoid DNS-rebinding TOCTOU.
 */
export async function assertSafeExternalUrl(
  rawUrl: string
): Promise<{ url: URL; ips: Array<{ address: string; family: 4 | 6 }> }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  const resolved: Array<{ address: string; family: 4 | 6 }> = [];
  const rawFamily = net.isIP(host);
  if (rawFamily) {
    resolved.push({ address: host, family: rawFamily as 4 | 6 });
  } else {
    const records = await dns.lookup(host, { all: true }).catch(() => []);
    for (const r of records) resolved.push({ address: r.address, family: r.family as 4 | 6 });
  }
  if (!resolved.length) throw new Error("Host did not resolve");

  for (const r of resolved) {
    if (isPrivateIp(r.address)) {
      throw new Error("URL resolves to a private or reserved IP");
    }
  }
  return { url: parsed, ips: resolved };
}

/**
 * Fetch a URL that has already been validated by `assertSafeExternalUrl`,
 * pinning the TCP connection to the pre-resolved IP so a hostile DNS server
 * cannot rebind between validation and the socket open. Redirects are
 * disabled because a 3xx response could point at a private address and
 * would be resolved fresh; callers can re-invoke this helper with the new
 * URL if they want to follow redirects safely.
 */
export async function safeFetch(
  validated: { url: URL; ips: Array<{ address: string; family: 4 | 6 }> },
  init: UndiciRequestInit = {}
) {
  const pinned = validated.ips[0];
  const dispatcher = new UndiciAgent({
    connect: {
      lookup: (_hostname, _options, callback) => {
        callback(null, pinned.address, pinned.family);
      },
    },
  });
  try {
    return await undiciFetch(validated.url.toString(), {
      ...init,
      redirect: "error",
      dispatcher,
    });
  } finally {
    await dispatcher.close().catch(() => {});
  }
}

function isPrivateIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return isPrivateV4(ip);
  if (v === 6) return isPrivateV6(ip);
  return true;
}

function isPrivateV4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (AWS/GCP metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 reserved
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
  if (lower.startsWith("ff")) return true; // multicast
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.replace("::ffff:", "");
    return isPrivateV4(v4);
  }
  return false;
}

interface TTSRequest {
  text: string;
  voice: string;
  provider: string;
  voiceId?: string;
  createdAt: number;
}

const ttsCache = new Map<string, TTSRequest>();

export function storeTTSRequest(text: string, voice: string, provider: string, voiceId?: string): string {
  const now = Date.now();
  // Clean up entries older than 5 minutes
  const keys = Array.from(ttsCache.keys());
  keys.forEach((key) => {
    const value = ttsCache.get(key);
    if (value && now - value.createdAt > 5 * 60 * 1000) {
      ttsCache.delete(key);
    }
  });

  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  ttsCache.set(id, { text, voice, provider, voiceId, createdAt: now });
  return id;
}

export function getTTSRequest(id: string): TTSRequest | undefined {
  return ttsCache.get(id);
}

export function deleteTTSRequest(id: string): void {
  ttsCache.delete(id);
}

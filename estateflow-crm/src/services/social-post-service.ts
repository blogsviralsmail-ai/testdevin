const DRY_RUN = process.env.DRY_RUN === 'true' || !process.env.OPENAI_API_KEY;

interface AICaptionResult {
  success: boolean;
  caption: string;
  message: string;
}

export async function generateCaption(
  propertyTitle: string,
  propertyLocation: string,
  propertyType: string,
  postType: string
): Promise<AICaptionResult> {
  if (DRY_RUN) {
    const fallback = `🏠 ${propertyTitle} in ${propertyLocation}\n\nBeautiful ${propertyType} now available! Contact us for details.\n\n#RealEstate #Property #${propertyLocation.replace(/\s/g, '')}`;
    return { success: true, caption: fallback, message: '[DRY RUN] AI caption generated' };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, caption: '', message: 'OpenAI API key not configured' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate social media expert. Generate engaging captions for property posts.',
          },
          {
            role: 'user',
            content: `Write a ${postType} caption for: ${propertyTitle} in ${propertyLocation} (${propertyType}). Include relevant hashtags. Keep it under 200 words.`,
          },
        ],
        max_tokens: 300,
      }),
    });

    const result = await response.json();
    const caption = result.choices?.[0]?.message?.content || '';

    return {
      success: !!caption,
      caption,
      message: caption ? 'Caption generated' : 'No caption returned',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, caption: '', message: errMsg };
  }
}

export async function publishToWebhook(
  webhookUrl: string,
  postData: Record<string, unknown>
): Promise<{ success: boolean; message: string }> {
  if (DRY_RUN) {
    console.log('[DRY RUN] Publish to webhook:', webhookUrl);
    return { success: true, message: '[DRY RUN] Published to webhook' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });

    return {
      success: response.ok,
      message: response.ok ? 'Published to webhook' : 'Webhook returned error',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: errMsg };
  }
}

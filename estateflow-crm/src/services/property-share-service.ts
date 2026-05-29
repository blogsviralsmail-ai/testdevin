import type { Lead, Property } from '@/types';
import { sendWhatsApp, sendSMS, interpolateTemplate } from './message-service';
import { sendEmail } from './email-service';
import { formatCurrency } from '@/lib/constants';

interface ShareResult {
  success: boolean;
  shareLink: string;
  messageId: string | null;
  message: string;
}

export function generateShareLink(propertyId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/properties/share/${propertyId}`;
}

export async function sharePropertyViaWhatsApp(
  lead: Lead,
  property: Property
): Promise<ShareResult> {
  const shareLink = generateShareLink(property.id);
  const message = interpolateTemplate(
    'Hi {{leadName}}, sharing details of {{propertyTitle}} in {{location}}. Price: {{price}}. Photos and details: {{shareLink}}',
    {
      leadName: lead.full_name,
      propertyTitle: property.title,
      location: property.location,
      price: formatCurrency(property.price),
      shareLink,
    }
  );

  const result = await sendWhatsApp({ to: lead.phone, body: message });
  return { ...result, shareLink };
}

export async function sharePropertyViaSMS(
  lead: Lead,
  property: Property
): Promise<ShareResult> {
  const shareLink = generateShareLink(property.id);
  const message = `Hi ${lead.full_name}, check out ${property.title} in ${property.location} at ${formatCurrency(property.price)}. Details: ${shareLink}`;

  const result = await sendSMS({ to: lead.phone, body: message });
  return { ...result, shareLink };
}

export async function sharePropertyViaEmail(
  lead: Lead,
  property: Property
): Promise<ShareResult> {
  if (!lead.email) {
    return { success: false, shareLink: '', messageId: null, message: 'Lead has no email' };
  }

  const shareLink = generateShareLink(property.id);
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${property.title}</h2>
      <p>Hi ${lead.full_name},</p>
      <p>Here are the details for the property you inquired about:</p>
      <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Location:</strong> ${property.location}</p>
        <p><strong>Type:</strong> ${property.property_type}</p>
        <p><strong>Price:</strong> ${formatCurrency(property.price)}</p>
        ${property.bedrooms ? `<p><strong>Bedrooms:</strong> ${property.bedrooms}</p>` : ''}
        ${property.size ? `<p><strong>Size:</strong> ${property.size}</p>` : ''}
        ${property.description ? `<p>${property.description}</p>` : ''}
      </div>
      <a href="${shareLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View Full Details</a>
      <p style="margin-top: 24px; color: #666;">Best regards,<br>EstateFlow CRM</p>
    </div>
  `;

  const result = await sendEmail({
    to: lead.email,
    subject: `Property Details: ${property.title} - ${property.location}`,
    html,
  });

  return { ...result, shareLink };
}

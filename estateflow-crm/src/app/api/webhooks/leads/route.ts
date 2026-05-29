import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assignLeadToAgent } from '@/services/lead-assignment-service';
import { initiateBridgeCall, buildCallLog } from '@/services/call-service';
import { z } from 'zod/v4';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const leadWebhookSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: z.email().optional(),
  source: z.string().optional().default('other'),
  propertyType: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  preferredLocation: z.string().optional(),
  notes: z.string().optional(),
  organizationId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const webhookSecret = request.headers.get('x-webhook-secret');
    const body = await request.json();
    const parsed = leadWebhookSchema.parse(body);

    let organizationId = parsed.organizationId;

    if (!organizationId) {
      if (webhookSecret) {
        const { data: settings } = await supabaseAdmin
          .from('integration_settings')
          .select('organization_id')
          .eq('webhook_secret', webhookSecret)
          .single();

        if (settings) {
          organizationId = settings.organization_id;
        }
      }

      if (!organizationId) {
        const { data: org } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .limit(1)
          .single();

        if (!org) {
          return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }
        organizationId = org.id;
      }
    }

    const { data: intSettings } = await supabaseAdmin
      .from('integration_settings')
      .select('lead_assignment_mode')
      .eq('organization_id', organizationId)
      .single();

    const mode = (intSettings?.lead_assignment_mode as 'round_robin' | 'manual' | 'least_busy') || 'round_robin';
    const assignedAgentId = await assignLeadToAgent(organizationId!, mode);

    const sourceMap: Record<string, string> = {
      '36 acre': '36_acre',
      '36acre': '36_acre',
      'magic bricks': 'magicbricks',
      'housing.com': 'housing',
      'housing': 'housing',
      'facebook': 'facebook',
      'instagram': 'instagram',
      'website': 'website',
      'referral': 'referral',
    };
    const normalizedSource = sourceMap[parsed.source?.toLowerCase() || ''] || parsed.source || 'other';

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        organization_id: organizationId,
        full_name: parsed.fullName,
        phone: parsed.phone,
        email: parsed.email || null,
        source: normalizedSource,
        property_type: parsed.propertyType || null,
        budget_min: parsed.budgetMin || null,
        budget_max: parsed.budgetMax || null,
        preferred_location: parsed.preferredLocation || null,
        notes: parsed.notes || null,
        assigned_agent_id: assignedAgentId,
        status: 'new',
        temperature: 'warm',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from('activities').insert({
      organization_id: organizationId,
      lead_id: lead.id,
      type: 'note',
      title: `Lead received via webhook (${normalizedSource})`,
      description: `New lead: ${parsed.fullName} - ${parsed.phone}`,
    });

    if (assignedAgentId) {
      await supabaseAdmin.from('notifications').insert({
        organization_id: organizationId,
        user_id: assignedAgentId,
        type: 'new_lead',
        title: 'New Lead Assigned',
        message: `New lead from ${normalizedSource}: ${parsed.fullName} (${parsed.phone})`,
        metadata: { lead_id: lead.id },
      });

      const { data: agent } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', assignedAgentId)
        .single();

      if (agent) {
        const callResult = await initiateBridgeCall(lead, agent, organizationId!);
        const callLog = buildCallLog(callResult, lead, agent, organizationId!);

        await supabaseAdmin.from('calls').insert(callLog);

        await supabaseAdmin.from('activities').insert({
          organization_id: organizationId,
          lead_id: lead.id,
          user_id: assignedAgentId,
          type: 'call',
          title: callResult.success ? 'Bridge call initiated' : 'Bridge call failed',
          description: callResult.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      assignedAgent: assignedAgentId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 });
    }
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(request.url);
    const leadId = url.searchParams.get('leadId');
    const agentId = url.searchParams.get('agentId');
    const orgId = url.searchParams.get('orgId');

    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;

    const outcomeMap: Record<string, string> = {
      'completed': 'connected',
      'busy': 'busy',
      'no-answer': 'no_answer',
      'failed': 'failed',
      'canceled': 'failed',
    };

    const outcome = outcomeMap[callStatus] || 'pending';

    if (callSid) {
      const { data: existingCall } = await supabaseAdmin
        .from('calls')
        .select('id')
        .eq('call_sid', callSid)
        .single();

      if (existingCall) {
        await supabaseAdmin
          .from('calls')
          .update({
            status: callStatus,
            duration: callDuration ? parseInt(callDuration) : null,
            recording_url: recordingUrl || null,
            outcome,
            ended_at: ['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(callStatus)
              ? new Date().toISOString()
              : null,
          })
          .eq('id', existingCall.id);
      }
    }

    if (leadId && callStatus === 'completed') {
      await supabaseAdmin
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString(), status: 'contacted' })
        .eq('id', leadId)
        .eq('status', 'new');
    }

    if (leadId && agentId && orgId && callStatus === 'no-answer') {
      await supabaseAdmin.from('followups').insert({
        organization_id: orgId,
        lead_id: leadId,
        agent_id: agentId,
        type: 'call',
        status: 'pending',
        message: 'Call back - no answer on initial call',
        scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      const { data: managers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('organization_id', orgId)
        .eq('role', 'sales_manager');

      if (managers) {
        for (const manager of managers) {
          await supabaseAdmin.from('notifications').insert({
            organization_id: orgId,
            user_id: manager.id,
            type: 'missed_call',
            title: 'Lead Call Not Answered',
            message: `Agent did not answer call for lead. Follow-up created.`,
            metadata: { lead_id: leadId, agent_id: agentId },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Call status webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

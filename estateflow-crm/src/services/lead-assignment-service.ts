import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type AssignmentMode = 'round_robin' | 'manual' | 'least_busy';

export async function assignLeadToAgent(
  organizationId: string,
  mode: AssignmentMode = 'round_robin'
): Promise<string | null> {
  switch (mode) {
    case 'round_robin':
      return roundRobinAssign(organizationId);
    case 'least_busy':
      return leastBusyAssign(organizationId);
    case 'manual':
      return null;
    default:
      return roundRobinAssign(organizationId);
  }
}

async function roundRobinAssign(organizationId: string): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: agents } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId)
    .in('role', ['sales_agent', 'sales_manager'])
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (!agents || agents.length === 0) return null;

  const { data: lastAssigned } = await supabaseAdmin
    .from('leads')
    .select('assigned_agent_id')
    .eq('organization_id', organizationId)
    .not('assigned_agent_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const lastAgentId = lastAssigned?.assigned_agent_id;
  const lastIndex = agents.findIndex(a => a.id === lastAgentId);
  const nextIndex = (lastIndex + 1) % agents.length;

  return agents[nextIndex].id;
}

async function leastBusyAssign(organizationId: string): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: agents } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId)
    .in('role', ['sales_agent', 'sales_manager'])
    .eq('is_active', true);

  if (!agents || agents.length === 0) return null;

  let minCount = Infinity;
  let selectedAgent = agents[0].id;

  for (const agent of agents) {
    const { count } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_agent_id', agent.id)
      .in('status', ['new', 'contacted', 'interested', 'site_visit_scheduled', 'negotiation']);

    const leadCount = count ?? 0;
    if (leadCount < minCount) {
      minCount = leadCount;
      selectedAgent = agent.id;
    }
  }

  return selectedAgent;
}

import { Header } from '@/components/layout/header';
import { getLead, getLeadActivities } from '@/actions/leads';
import { getRecommendedProperties } from '@/actions/properties';
import { LeadDetail } from '@/components/leads/lead-detail';
import { LeadTimeline } from '@/components/leads/lead-timeline';
import { LeadActions } from '@/components/leads/lead-actions';
import { RecommendedProperties } from '@/components/leads/recommended-properties';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  const [activities, recommended] = await Promise.all([
    getLeadActivities(id),
    getRecommendedProperties(lead),
  ]);

  return (
    <>
      <Header title={lead.full_name} />
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <Link href="/leads" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Leads
        </Link>

        <LeadActions lead={lead} />
        <LeadDetail lead={lead} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeadTimeline activities={activities} leadId={id} />
          <RecommendedProperties properties={recommended} leadId={id} />
        </div>
      </div>
    </>
  );
}

import { Header } from '@/components/layout/header';
import { getLeads } from '@/actions/leads';
import { LeadsList } from '@/components/leads/leads-list';
import { LeadFilters } from '@/components/leads/lead-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; temperature?: string; search?: string }>;
}) {
  const params = await searchParams;
  const leads = await getLeads({
    status: params.status,
    source: params.source,
    temperature: params.temperature,
    search: params.search,
  });

  return (
    <>
      <Header title="Leads" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{leads.length} leads</p>
          </div>
          <Link href="/leads/new">
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Add Lead
            </Button>
          </Link>
        </div>

        <LeadFilters />
        <LeadsList leads={leads} />
      </div>
    </>
  );
}

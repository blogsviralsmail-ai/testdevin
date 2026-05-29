import { Header } from '@/components/layout/header';
import { getProperties } from '@/actions/properties';
import { PropertyGrid } from '@/components/properties/property-grid';
import { PropertyFilters } from '@/components/properties/property-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; availability?: string; search?: string }>;
}) {
  const params = await searchParams;
  const properties = await getProperties({
    type: params.type,
    availability: params.availability,
    search: params.search,
  });

  return (
    <>
      <Header title="Properties" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{properties.length} properties</p>
          <Link href="/properties/new">
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Add Property
            </Button>
          </Link>
        </div>

        <PropertyFilters />
        <PropertyGrid properties={properties} />
      </div>
    </>
  );
}

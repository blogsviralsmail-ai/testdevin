import { Header } from '@/components/layout/header';
import { getProperty } from '@/actions/properties';
import { PropertyDetail } from '@/components/properties/property-detail';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  return (
    <>
      <Header title={property.title} />
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <Link href="/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Properties
        </Link>

        <PropertyDetail property={property} />
      </div>
    </>
  );
}

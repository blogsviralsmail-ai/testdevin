'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, BedDouble, Bath } from 'lucide-react';
import { formatCurrency, getLabel, PROPERTY_TYPES, PROPERTY_AVAILABILITY } from '@/lib/constants';
import type { PropertyType, PropertyAvailability } from '@/types';

interface PropertyGridProps {
  properties: {
    id: string;
    title: string;
    location: string;
    property_type: string;
    price: number;
    bedrooms: number | null;
    bathrooms: number | null;
    size: string | null;
    availability: string;
    images?: { id: string; url: string; caption: string | null; is_primary: boolean }[];
  }[];
}

function getAvailabilityVariant(status: PropertyAvailability): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'available': return 'default';
    case 'sold': return 'destructive';
    default: return 'secondary';
  }
}

export function PropertyGrid({ properties }: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No properties found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map((property) => {
        const primaryImage = property.images?.find(i => i.is_primary) || property.images?.[0];
        return (
          <Link key={property.id} href={`/properties/${property.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="aspect-[16/10] bg-muted relative">
                {primaryImage ? (
                  <img
                    src={primaryImage.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Badge
                  variant={getAvailabilityVariant(property.availability as PropertyAvailability)}
                  className="absolute top-2 right-2 text-[10px]"
                >
                  {getLabel(PROPERTY_AVAILABILITY, property.availability as PropertyAvailability)}
                </Badge>
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm truncate">{property.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {property.location}
                </p>
                <p className="text-sm font-bold text-primary mt-2">{formatCurrency(property.price)}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    {getLabel(PROPERTY_TYPES, property.property_type as PropertyType)}
                  </Badge>
                  {property.bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      {property.bedrooms}
                    </span>
                  )}
                  {property.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" />
                      {property.bathrooms}
                    </span>
                  )}
                  {property.size && <span>{property.size}</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

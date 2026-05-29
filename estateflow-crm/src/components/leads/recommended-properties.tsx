'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { formatCurrency, getLabel, PROPERTY_TYPES } from '@/lib/constants';
import Link from 'next/link';
import type { PropertyType } from '@/types';

interface RecommendedPropertiesProps {
  properties: {
    id: string;
    title: string;
    location: string;
    property_type: string;
    price: number;
    bedrooms: number | null;
    images?: { id: string; url: string; is_primary: boolean }[];
  }[];
  leadId: string;
}

export function RecommendedProperties({ properties }: RecommendedPropertiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recommended Properties</CardTitle>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No matching properties found</p>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <div className="flex gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {property.images?.[0] ? (
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{property.title}</p>
                    <p className="text-xs text-muted-foreground">{property.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-primary">{formatCurrency(property.price)}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {getLabel(PROPERTY_TYPES, property.property_type as PropertyType)}
                      </Badge>
                      {property.bedrooms && (
                        <span className="text-[10px] text-muted-foreground">{property.bedrooms} BHK</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

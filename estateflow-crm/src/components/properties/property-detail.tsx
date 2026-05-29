'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, BedDouble, Bath, Maximize, Share2, ExternalLink } from 'lucide-react';
import { formatCurrency, getLabel, PROPERTY_TYPES, PROPERTY_AVAILABILITY, FURNISHING_STATUSES } from '@/lib/constants';
import { updateProperty } from '@/actions/properties';
import { toast } from 'sonner';
import type { PropertyType, PropertyAvailability, FurnishingStatus } from '@/types';

interface PropertyDetailProps {
  property: {
    id: string;
    title: string;
    location: string;
    address: string | null;
    property_type: string;
    price: number;
    size: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    floor: string | null;
    furnishing: string | null;
    availability: string;
    description: string | null;
    amenities: string[];
    owner_name: string | null;
    owner_contact: string | null;
    tags: string[];
    units_available: number | null;
    images?: { id: string; url: string; caption: string | null; is_primary: boolean }[];
    documents?: { id: string; name: string; url: string }[];
  };
}

export function PropertyDetail({ property }: PropertyDetailProps) {
  const shareLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/properties/share/${property.id}`;

  async function handleAvailabilityChange(val: string | null) {
    if (!val) return;
    const result = await updateProperty(property.id, { availability: val as PropertyAvailability });
    if (result.error) toast.error(result.error);
    else toast.success('Availability updated');
  }

  return (
    <div className="space-y-4">
      {property.images && property.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-xl overflow-hidden">
          {property.images.map((img, idx) => (
            <div key={img.id} className={idx === 0 ? 'col-span-2 row-span-2' : ''}>
              <img
                src={img.url}
                alt={img.caption || property.title}
                className="w-full h-full object-cover aspect-video"
              />
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{property.title}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {property.location}{property.address ? ` · ${property.address}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue={property.availability} onValueChange={handleAvailabilityChange}>
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_AVAILABILITY.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{formatCurrency(property.price)}</span>
            {property.units_available && property.units_available > 1 && (
              <span className="text-sm text-muted-foreground">({property.units_available} units)</span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <Badge variant="outline">
              {getLabel(PROPERTY_TYPES, property.property_type as PropertyType)}
            </Badge>
            {property.bedrooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                {property.bedrooms} Bedrooms
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4 text-muted-foreground" />
                {property.bathrooms} Bathrooms
              </span>
            )}
            {property.size && (
              <span className="flex items-center gap-1">
                <Maximize className="h-4 w-4 text-muted-foreground" />
                {property.size}
              </span>
            )}
            {property.floor && <span>Floor: {property.floor}</span>}
            {property.furnishing && (
              <span>{getLabel(FURNISHING_STATUSES, property.furnishing as FurnishingStatus)}</span>
            )}
          </div>

          {property.description && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Description</h3>
              <p className="text-sm text-muted-foreground">{property.description}</p>
            </div>
          )}

          {property.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((amenity, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{amenity}</Badge>
                ))}
              </div>
            </div>
          )}

          {property.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {property.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {(property.owner_name || property.owner_contact) && (
            <div className="pt-3 border-t">
              <h3 className="text-sm font-semibold mb-1">Owner / Developer</h3>
              {property.owner_name && <p className="text-sm">{property.owner_name}</p>}
              {property.owner_contact && (
                <a href={`tel:${property.owner_contact}`} className="text-sm text-primary hover:underline">
                  {property.owner_contact}
                </a>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast.success('Share link copied');
              }}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Copy Link
            </Button>
            <a href={shareLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {property.documents && property.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {property.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {doc.name}
                  <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

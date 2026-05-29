'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PROPERTY_TYPES, FURNISHING_STATUSES } from '@/lib/constants';
import { createProperty } from '@/actions/properties';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createProperty(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/properties');
    }
  }

  return (
    <>
      <Header title="Add Property" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Link href="/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Properties
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>New Property</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input id="title" name="title" required className="h-11" placeholder="e.g. 3BHK Premium Apartment" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" name="location" required className="h-11" placeholder="e.g. Gurgaon" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Input id="address" name="address" className="h-11" placeholder="Full address" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select name="propertyType" defaultValue="apartment">
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input id="price" name="price" type="number" required className="h-11" placeholder="e.g. 7500000" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" name="bedrooms" type="number" className="h-11" placeholder="e.g. 3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" className="h-11" placeholder="e.g. 2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input id="size" name="size" className="h-11" placeholder="e.g. 1500 sq ft" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input id="floor" name="floor" className="h-11" placeholder="e.g. 5th Floor" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="furnishing">Furnishing</Label>
                  <Select name="furnishing">
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {FURNISHING_STATUSES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Property description..." rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input id="amenities" name="amenities" className="h-11" placeholder="Parking, Pool, Gym, Garden" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner/Developer Name</Label>
                  <Input id="ownerName" name="ownerName" className="h-11" placeholder="Owner name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerContact">Owner Contact</Label>
                  <Input id="ownerContact" name="ownerContact" className="h-11" placeholder="Owner phone" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" className="h-11" placeholder="Premium, Ready to Move, Near Metro" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitsAvailable">Units Available</Label>
                <Input id="unitsAvailable" name="unitsAvailable" type="number" className="h-11" placeholder="1" defaultValue="1" />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Creating...' : 'Create Property'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

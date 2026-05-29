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
import { LEAD_SOURCES, PROPERTY_TYPES, LEAD_TEMPERATURES } from '@/lib/constants';
import { createLead } from '@/actions/leads';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createLead(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/leads');
    }
  }

  return (
    <>
      <Header title="Add Lead" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Link href="/leads" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Leads
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>New Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" name="fullName" required className="h-11" placeholder="Enter name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" name="phone" required className="h-11" placeholder="+91 99999 99999" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" className="h-11" placeholder="email@example.com" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Lead Source *</Label>
                  <Select name="source" defaultValue="manual">
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select name="propertyType">
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Budget Min</Label>
                  <Input id="budgetMin" name="budgetMin" type="number" className="h-11" placeholder="e.g. 5000000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Budget Max</Label>
                  <Input id="budgetMax" name="budgetMax" type="number" className="h-11" placeholder="e.g. 10000000" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLocation">Preferred Location</Label>
                <Input id="preferredLocation" name="preferredLocation" className="h-11" placeholder="e.g. Gurgaon" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Lead Temperature</Label>
                <Select name="temperature" defaultValue="warm">
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_TEMPERATURES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Additional notes about the lead..." rows={3} />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Creating...' : 'Create Lead'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

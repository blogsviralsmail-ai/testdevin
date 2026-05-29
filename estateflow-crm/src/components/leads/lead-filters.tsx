'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LEAD_STATUSES, LEAD_SOURCES, LEAD_TEMPERATURES } from '@/lib/constants';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback } from 'react';

export function LeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/leads?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push('/leads');
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          defaultValue={searchParams.get('search') || ''}
          className="pl-9 h-9"
          onChange={(e) => {
            const val = e.target.value;
            if (val.length === 0 || val.length >= 2) {
              updateFilter('search', val);
            }
          }}
        />
      </div>
      <Select
        defaultValue={searchParams.get('status') || 'all'}
        onValueChange={(v) => updateFilter('status', v ?? 'all')}
      >
        <SelectTrigger className="w-full sm:w-[140px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {LEAD_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('source') || 'all'}
        onValueChange={(v) => updateFilter('source', v ?? 'all')}
      >
        <SelectTrigger className="w-full sm:w-[140px] h-9">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {LEAD_SOURCES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('temperature') || 'all'}
        onValueChange={(v) => updateFilter('temperature', v ?? 'all')}
      >
        <SelectTrigger className="w-full sm:w-[120px] h-9">
          <SelectValue placeholder="Temperature" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Temp</SelectItem>
          {LEAD_TEMPERATURES.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

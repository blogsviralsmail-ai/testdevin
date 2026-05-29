'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { checkIn, checkOut } from '@/actions/attendance';
import { calculateWorkHours } from '@/services/attendance-service';
import { ATTENDANCE_STATUSES, getLabel } from '@/lib/constants';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { AttendanceStatus } from '@/types';

interface AttendanceViewProps {
  todayRecords: {
    id: string;
    check_in_time: string;
    check_out_time: string | null;
    status: string;
    notes: string | null;
    user?: { id: string; full_name: string; avatar_url: string | null; role: string } | null;
  }[];
  currentCheckIn: {
    id: string;
    check_in_time: string;
    check_out_time: string | null;
  } | null;
}

export function AttendanceView({ todayRecords, currentCheckIn }: AttendanceViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function getLocation(): Promise<{ latitude: number | null; longitude: number | null }> {
    if (!navigator.geolocation) return { latitude: null, longitude: null };
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function handleCheckIn() {
    setLoading(true);
    const loc = await getLocation();
    const result = await checkIn(loc.latitude, loc.longitude);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Checked in! Status: ${result.status}`);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleCheckOut() {
    setLoading(true);
    const loc = await getLocation();
    const result = await checkOut(loc.latitude, loc.longitude);
    if (result.error) toast.error(result.error);
    else {
      toast.success('Checked out!');
      router.refresh();
    }
    setLoading(false);
  }

  const checkedInCount = todayRecords.filter(r => !r.check_out_time).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-3xl font-bold">{format(new Date(), 'h:mm a')}</p>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>

          <div className="flex gap-3 justify-center mt-6">
            {!currentCheckIn ? (
              <Button size="lg" className="h-12 px-8 bg-green-600 hover:bg-green-700" onClick={handleCheckIn} disabled={loading}>
                <LogIn className="h-5 w-5 mr-2" />
                {loading ? 'Getting location...' : 'Check In'}
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Checked in at {format(new Date(currentCheckIn.check_in_time), 'h:mm a')}
                </p>
                <Button size="lg" className="h-12 px-8 bg-red-600 hover:bg-red-700" onClick={handleCheckOut} disabled={loading}>
                  <LogOut className="h-5 w-5 mr-2" />
                  {loading ? 'Getting location...' : 'Check Out'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
            <Badge variant="outline">{checkedInCount} currently in</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {todayRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No attendance records today</p>
          ) : (
            <div className="space-y-3">
              {todayRecords.map((record) => (
                <div key={record.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {record.user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{record.user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      In: {format(new Date(record.check_in_time), 'h:mm a')}
                      {record.check_out_time && ` · Out: ${format(new Date(record.check_out_time), 'h:mm a')}`}
                      {' · '}{calculateWorkHours(record.check_in_time, record.check_out_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={record.check_out_time ? 'secondary' : 'default'} className="text-[10px]">
                      {record.check_out_time ? 'Done' : 'Active'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {getLabel(ATTENDANCE_STATUSES, record.status as AttendanceStatus)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

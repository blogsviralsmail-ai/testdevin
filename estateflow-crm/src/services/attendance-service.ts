import type { AttendanceStatus } from '@/types';

interface LocationData {
  latitude: number;
  longitude: number;
}

export function determineAttendanceStatus(checkInTime: Date): AttendanceStatus {
  const hour = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  const totalMinutes = hour * 60 + minutes;

  // Before 9:30 AM = present, 9:30-10:00 = late, after 10:00 = half_day
  if (totalMinutes <= 570) return 'present'; // 9:30
  if (totalMinutes <= 600) return 'late'; // 10:00
  return 'half_day';
}

export function calculateWorkHours(checkIn: string, checkOut: string | null): string {
  if (!checkOut) return 'In Progress';
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const hours = Math.floor((end - start) / (1000 * 60 * 60));
  const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export async function getLocation(): Promise<LocationData | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

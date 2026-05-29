import { Header } from '@/components/layout/header';
import { getTodayAttendance, getCurrentCheckIn } from '@/actions/attendance';
import { AttendanceView } from '@/components/attendance/attendance-view';

export default async function AttendancePage() {
  const [todayRecords, currentCheckIn] = await Promise.all([
    getTodayAttendance(),
    getCurrentCheckIn(),
  ]);

  return (
    <>
      <Header title="Attendance" />
      <div className="p-4 md:p-6 space-y-4">
        <AttendanceView todayRecords={todayRecords} currentCheckIn={currentCheckIn} />
      </div>
    </>
  );
}

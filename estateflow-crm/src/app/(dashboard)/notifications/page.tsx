import { Header } from '@/components/layout/header';
import { getNotifications } from '@/actions/notifications';
import { NotificationsList } from '@/components/shared/notifications-list';

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <>
      <Header title="Notifications" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <NotificationsList notifications={notifications} />
      </div>
    </>
  );
}

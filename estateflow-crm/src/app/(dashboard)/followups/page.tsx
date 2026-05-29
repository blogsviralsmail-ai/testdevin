import { Header } from '@/components/layout/header';
import { getFollowUps } from '@/actions/followups';
import { FollowUpsList } from '@/components/followups/followups-list';

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const followups = await getFollowUps({ status: params.status || 'pending' });

  return (
    <>
      <Header title="Follow-ups" />
      <div className="p-4 md:p-6 space-y-4">
        <FollowUpsList followups={followups} />
      </div>
    </>
  );
}

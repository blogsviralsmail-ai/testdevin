import { Header } from '@/components/layout/header';
import { getTeamMembers } from '@/actions/team';
import { getCurrentUser } from '@/actions/auth';
import { TeamView } from '@/components/shared/team-view';

export default async function TeamPage() {
  const [members, currentUser] = await Promise.all([
    getTeamMembers(),
    getCurrentUser(),
  ]);

  return (
    <>
      <Header title="Team" />
      <div className="p-4 md:p-6 space-y-4">
        <TeamView members={members} isAdmin={currentUser?.role === 'admin'} />
      </div>
    </>
  );
}

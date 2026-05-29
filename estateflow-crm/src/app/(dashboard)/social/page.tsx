import { Header } from '@/components/layout/header';
import { getSocialPosts } from '@/actions/social';
import { SocialPostsList } from '@/components/social/social-posts-list';

export default async function SocialPage() {
  const posts = await getSocialPosts();

  return (
    <>
      <Header title="Social Media" />
      <div className="p-4 md:p-6 space-y-4">
        <SocialPostsList posts={posts} />
      </div>
    </>
  );
}

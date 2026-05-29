'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar } from 'lucide-react';
import { SOCIAL_POST_TYPES, SOCIAL_POST_STATUSES, getLabel } from '@/lib/constants';
import { createSocialPost, updateSocialPost } from '@/actions/social';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { SocialPostStatus, SocialPostType } from '@/types';

interface SocialPostsListProps {
  posts: {
    id: string;
    post_type: string;
    caption: string | null;
    status: string;
    scheduled_at: string | null;
    notes: string | null;
    assignee?: { id: string; full_name: string } | null;
  }[];
}

function getStatusVariant(status: SocialPostStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'published': return 'default';
    case 'scheduled': return 'secondary';
    default: return 'outline';
  }
}

export function SocialPostsList({ posts }: SocialPostsListProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    const result = await createSocialPost(formData);
    if (result.error) toast.error(result.error);
    else {
      toast.success('Post created');
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleStatusUpdate(id: string, status: string | null) {
    if (!status) return;
    const result = await updateSocialPost(id, { status });
    if (result.error) toast.error(result.error);
    else {
      toast.success('Status updated');
      router.refresh();
    }
  }

  const grouped = {
    idea: posts.filter(p => p.status === 'idea'),
    draft: posts.filter(p => p.status === 'draft'),
    scheduled: posts.filter(p => p.status === 'scheduled'),
    published: posts.filter(p => p.status === 'published'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{posts.length} posts</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-1" />
                New Post
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Social Post</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Post Type</Label>
                <Select name="postType" defaultValue="instagram_post">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_POST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea name="caption" placeholder="Write your caption..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="idea">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_POST_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input name="scheduledAt" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input name="notes" placeholder="Internal notes..." />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Post'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['idea', 'draft', 'scheduled', 'published'] as const).map((status) => (
          <div key={status} className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {getLabel(SOCIAL_POST_STATUSES, status)}
              <Badge variant="outline" className="text-[10px]">{grouped[status].length}</Badge>
            </h3>
            {grouped[status].map((post) => (
              <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={getStatusVariant(post.status as SocialPostStatus)} className="text-[10px]">
                      {getLabel(SOCIAL_POST_TYPES, post.post_type as SocialPostType)}
                    </Badge>
                    <Select defaultValue={post.status} onValueChange={(v) => handleStatusUpdate(post.id, v)}>
                      <SelectTrigger className="h-6 w-[90px] text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_POST_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {post.caption && (
                    <p className="text-xs line-clamp-3">{post.caption}</p>
                  )}
                  {post.scheduled_at && (
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                  {post.assignee && (
                    <p className="text-[10px] text-muted-foreground mt-1">{post.assignee.full_name}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Phone, Mail, UserCheck, UserX } from 'lucide-react';
import { USER_ROLES, getLabel } from '@/lib/constants';
import { inviteTeamMember } from '@/actions/auth';
import { deactivateTeamMember, activateTeamMember } from '@/actions/team';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types';

interface TeamViewProps {
  members: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
    is_active: boolean;
    avatar_url: string | null;
  }[];
  isAdmin: boolean;
}

export function TeamView({ members, isAdmin }: TeamViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleInvite(formData: FormData) {
    setLoading(true);
    const result = await inviteTeamMember(formData);
    if (result.error) toast.error(result.error);
    else {
      toast.success('Team member added');
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const result = isActive ? await deactivateTeamMember(id) : await activateTeamMember(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(isActive ? 'Member deactivated' : 'Member activated');
      router.refresh();
    }
  }

  const active = members.filter(m => m.is_active);
  const inactive = members.filter(m => !m.is_active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{active.length} active members</p>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="h-9">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Member
                </Button>
              }
            />

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
              </DialogHeader>
              <form action={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input name="fullName" required placeholder="Team member name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" required placeholder="email@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" placeholder="+91 99999 99999" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select name="role" defaultValue="sales_agent">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Member'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {active.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {member.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{member.full_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {member.email}
                    {member.phone && (
                      <>
                        <Phone className="h-3 w-3 ml-2" />
                        {member.phone}
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {getLabel(USER_ROLES, member.role as UserRole)}
                </Badge>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToggleActive(member.id, true)}
                  >
                    <UserX className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inactive.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Inactive Members</h3>
          <div className="space-y-2">
            {inactive.map((member) => (
              <Card key={member.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                      {member.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {getLabel(USER_ROLES, member.role as UserRole)}
                    </Badge>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleToggleActive(member.id, false)}
                      >
                        <UserCheck className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

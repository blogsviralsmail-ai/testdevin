'use client';

import { Bell, Building2, Menu } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2 as BuildingIcon, Clock, CalendarCheck,
  Share2, UserCog, Settings, BarChart3, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/actions/auth';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/properties', label: 'Properties', icon: BuildingIcon },
  { href: '/followups', label: 'Follow-ups', icon: Clock },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/social', label: 'Social Media', icon: Share2 },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Header({ title }: { title?: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex items-center h-14 px-6 border-b">
                <Building2 className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold">EstateFlow</span>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold md:hidden">
            {title || 'EstateFlow'}
          </h1>
          <h1 className="hidden md:block text-lg font-semibold">
            {title || 'Dashboard'}
          </h1>
        </div>

        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}

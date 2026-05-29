'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Building2, Clock, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/followups', label: 'Follow-ups', icon: Clock },
  { href: '/more', label: 'More', icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  const moreRoutes = ['/attendance', '/social', '/team', '/settings', '/reports', '/notifications'];
  const isMoreActive = moreRoutes.some(r => pathname.startsWith(r));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.href === '/more'
            ? isMoreActive
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href === '/more' ? '/attendance' : item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 px-2 rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

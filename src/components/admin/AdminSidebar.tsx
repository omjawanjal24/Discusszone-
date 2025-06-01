
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarClock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Manage Bookings', icon: CalendarClock },
  { href: '/admin/users', label: 'Manage Users', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r p-4 space-y-2 flex flex-col">
      <h2 className="text-lg font-semibold tracking-tight px-2">Admin Menu</h2>
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start",
              pathname === item.href && "font-semibold"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}

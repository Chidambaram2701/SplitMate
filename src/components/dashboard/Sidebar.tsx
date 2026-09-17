// Sidebar Component - Brutalist Design
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Users, DollarSign, CreditCard, Box, AlertTriangle, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: House },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Expenses', href: '/expenses', icon: DollarSign },
  { name: 'Debts', href: '/debts', icon: CreditCard },
  { name: 'Assets', href: '/assets', icon: Box },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="w-72 border-r-4 border-black bg-[#F4F1EA] flex flex-col">
      <div className="p-6 border-b-4 border-black">
        <h1 className="text-3xl font-bold uppercase tracking-tighter">
          RoommateX
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-black mb-4">
          Main
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'brutalPrimary' : 'brutal'}
                fullWidth
                className="justify-start"
              >
                <Icon size={20} className={isActive ? 'text-white' : ''} />
                {item.name}
              </Button>
            </Link>
          );
        })}

        <div className="mt-8 text-[10px] font-bold uppercase tracking-widest border-b-2 border-black mb-4">
          Alerts
        </div>
        <Link href="/notifications">
          <Button variant="brutal" fullWidth className="justify-start">
            <AlertTriangle size={20} />
            Notifications
          </Button>
        </Link>
      </nav>

      <div className="p-4 border-t-4 border-black">
        <Button
          variant="brutalDanger"
          fullWidth
          onClick={handleLogout}
          className="justify-start"
        >
          <LogOut size={20} className="text-white" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

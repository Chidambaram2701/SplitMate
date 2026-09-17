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
    sessionStorage.removeItem('currentHouseId');
    router.push('/auth/login');
  };

  return (
    <div className="w-72 border-r-4 border-black bg-[#F4F1EA] flex flex-col h-full text-black flex-shrink-0">
      <div className="p-6 border-b-4 border-black bg-[#F4F1EA]">
        <Link href="/dashboard" className="block">
          <h1 className="text-3xl font-extrabold uppercase tracking-tighter text-black hover:opacity-80 transition-opacity">
            RoommateX
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mt-1">
            House Finance Terminal
          </p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-[11px] font-bold uppercase tracking-widest border-b-2 border-black pb-1 mb-3 text-black">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="block w-full">
              <Button
                variant={isActive ? 'brutalPrimary' : 'brutal'}
                fullWidth
                className="justify-start gap-3"
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-black'} />
                <span className={isActive ? 'text-white font-bold' : 'text-black font-bold'}>{item.name}</span>
              </Button>
            </Link>
          );
        })}

        <div className="mt-6 text-[11px] font-bold uppercase tracking-widest border-b-2 border-black pb-1 mb-3 text-black">
          Alerts & Activity
        </div>
        <Link href="/notifications" className="block w-full">
          <Button
            variant={pathname === '/notifications' ? 'brutalPrimary' : 'brutal'}
            fullWidth
            className="justify-start gap-3"
          >
            <AlertTriangle size={18} className={pathname === '/notifications' ? 'text-white' : 'text-black'} />
            <span className={pathname === '/notifications' ? 'text-white font-bold' : 'text-black font-bold'}>Notifications</span>
          </Button>
        </Link>
      </nav>

      {/* Raised Sign Out button with mb-12 to prevent overlap with dev indicators */}
      <div className="p-4 border-t-4 border-black bg-[#F4F1EA] pb-10">
        <Button
          variant="brutalDanger"
          fullWidth
          onClick={handleLogout}
          className="justify-center gap-2"
        >
          <LogOut size={18} className="text-white" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}

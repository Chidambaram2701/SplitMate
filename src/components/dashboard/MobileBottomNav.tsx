// MobileBottomNav Component - Fixed Mobile Navigation Bar
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, DollarSign, Plus, CreditCard, Users } from 'lucide-react';

const mobileNavItems = [
  { name: 'Home', href: '/dashboard', icon: House },
  { name: 'Expenses', href: '/expenses', icon: DollarSign },
  { name: 'Add', href: '/expenses/new', icon: Plus, isAddAction: true },
  { name: 'Debts', href: '/debts', icon: CreditCard },
  { name: 'Members', href: '/members', icon: Users },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide mobile nav on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#F4F1EA] border-t-4 border-black px-2 py-1 shadow-[0_-4px_0px_0px_rgba(0,0,0,1)] pb-safe">
      <nav className="flex items-center justify-around h-14">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isAddAction) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center relative -top-3"
              >
                <div className="w-12 h-12 rounded-none bg-[#F5E600] border-2 border-black text-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all">
                  <Plus size={24} className="stroke-[3]" />
                </div>
                <span className="text-[9px] font-extrabold uppercase mt-0.5 tracking-wider text-black">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-12 transition-all ${
                isActive ? 'text-black font-extrabold' : 'text-gray-600 hover:text-black'
              }`}
            >
              <div
                className={`p-1.5 transition-all ${
                  isActive
                    ? 'bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : ''
                }`}
              >
                <Icon size={18} />
              </div>
              <span className={`text-[9px] uppercase tracking-tighter mt-0.5 ${isActive ? 'font-black text-black' : 'font-bold'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

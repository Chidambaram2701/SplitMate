// AppShell Component - Dynamic Layout for Auth vs Dashboard
'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { HouseSwitcher } from '@/components/dashboard/HouseSwitcher';
import { UserProfile } from '@/components/dashboard/UserProfile';
import { ToastContainer } from '@/components/dashboard/ToastContainer';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] text-black font-sans">
        {children}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F1EA] text-black font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b-4 border-black bg-[#F4F1EA] px-6">
          <HouseSwitcher />
          <UserProfile />
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#F4F1EA]">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

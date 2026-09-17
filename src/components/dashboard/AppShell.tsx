// AppShell Component - Mobile Responsive & Desktop Brutalist Layout
'use client';

import { type ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { HouseSwitcher } from '@/components/dashboard/HouseSwitcher';
import { UserProfile } from '@/components/dashboard/UserProfile';
import { ToastContainer } from '@/components/dashboard/ToastContainer';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] text-black font-sans flex items-center justify-center p-4">
        {children}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F1EA] text-black font-sans flex-col md:flex-row">
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Top Header (visible on mobile < md) */}
      <div className="flex md:hidden items-center justify-between border-b-4 border-black bg-[#F4F1EA] px-4 py-3 z-30 flex-shrink-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border-2 border-black bg-white text-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/dashboard" className="block text-center">
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-black">
            RoommateX
          </h1>
        </Link>

        <div className="scale-90 flex-shrink-0">
          <UserProfile />
        </div>
      </div>

      {/* Mobile Drawer Navigation (Slide-over overlay when open) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer sidebar */}
          <div className="relative w-72 max-w-[85vw] bg-[#F4F1EA] h-full shadow-2xl z-50 overflow-y-auto">
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 items-center justify-between border-b-4 border-black bg-[#F4F1EA] px-6 flex-shrink-0">
          <HouseSwitcher />
          <UserProfile />
        </header>

        {/* Mobile House Switcher Bar */}
        <div className="flex md:hidden items-center justify-between border-b-2 border-black bg-[#F4F1EA] px-4 py-2 flex-shrink-0">
          <HouseSwitcher />
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F1EA]">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

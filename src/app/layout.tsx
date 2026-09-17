// Main Application Layout
import { type ReactNode } from 'react';
import { Space_Grotesk } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import '../app/brutalist.css';
import '../app/globals.css';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { HouseSwitcher } from '@/components/dashboard/HouseSwitcher';
import { UserProfile } from '@/components/dashboard/UserProfile';
import { ToastContainer } from '@/components/dashboard/ToastContainer';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata = {
  title: 'RoommateX - House Financial Platform',
  description: 'Shared house financial management for college students',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#F4F1EA] text-black font-sans">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-16 items-center justify-between border-b-4 border-black bg-[#F4F1EA] px-6">
              <HouseSwitcher />
              <UserProfile />
            </header>

            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>

        <ToastContainer />
      </body>
    </html>
  );
}

// Main Application Layout
import { type ReactNode } from 'react';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import '../app/brutalist.css';
import '../app/globals.css';
import { AppShell } from '@/components/dashboard/AppShell';

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
  title: 'SplitMate - House Financial Platform',
  description: 'Shared house financial management and debt settlement for roommates',
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
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#F4F1EA] text-black font-sans" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

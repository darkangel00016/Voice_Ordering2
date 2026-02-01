import React from 'react';
import type { Metadata } from 'next';
import { Inter, Lexend } from 'next/font/google';
import './globals.css';

// --- Font Configuration ---
// Inter for body text (high readability)
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Lexend for headings (designed for reading proficiency, great for kiosks)
const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

// --- Metadata ---
export const metadata: Metadata = {
  title: 'Kiosk Ordering System',
  description: 'Fast and accessible ordering for everyone.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1, // Prevent zooming on touch devices for a native app feel
    userScalable: false,
  },
  themeColor: '#ffffff',
};

/**
 * Root Layout
 * 
 * This component wraps the entire application. It provides:
 * 1. Global Font Variables
 * 2. Global CSS Reset (via globals.css import)
 * 3. A responsive shell optimized for touch targets (Kiosk/Mobile)
 * 4. Accessibility defaults (lang="en")
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable}`}>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        
        {/* 
          Main Application Container 
          - Centered on large screens (simulating a kiosk screen if on desktop)
          - Full width/height on mobile
          - 'isolate' creates a new stacking context
        */}
        <div className="relative flex-grow w-full max-w-md mx-auto bg-white shadow-2xl min-h-screen sm:min-h-[calc(100vh-2rem)] sm:my-4 sm:rounded-3xl overflow-hidden flex flex-col isolate">
          
          {/* Header / Status Bar Area (Optional placeholder for global nav or branding) */}
          <header className="sr-only">
            <h1>Kiosk Ordering App</h1>
          </header>

          {/* Main Content Area */}
          <main className="flex-grow flex flex-col relative z-0 overflow-y-auto scrollbar-hide">
            {children}
          </main>

          {/* 
            Global Footer / Safe Area 
            Useful for persistent bottom navigation or legal links if needed.
            Currently minimal to maximize ordering space.
          */}
          <div id="portal-root" />
        </div>

        {/* 
          Background decoration for desktop view 
          (Visible only when the app container is centered)
        */}
        <div className="fixed inset-0 -z-10 bg-slate-100 hidden sm:block" aria-hidden="true">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
        </div>

      </body>
    </html>
  );
}
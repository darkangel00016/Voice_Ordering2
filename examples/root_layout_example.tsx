import React from 'react';
// In a real Next.js app, the RootLayout is automatically applied by the framework.
// You do not import RootLayout into your pages manually.
// Instead, you create pages that will be injected into the {children} prop of the layout.

// This example simulates a page component located at `app/page.tsx`
// that would be wrapped by the RootLayout defined in the module.

export default function HomePage() {
  return (
    <div className="flex flex-col h-full p-6 space-y-8">
      {/* 
        Header Section
        Uses the Lexend font variable defined in RootLayout (--font-lexend)
        via the Tailwind utility class `font-sans` (assuming tailwind config maps sans to the variable).
        If not mapped, we can use the variable directly or standard classes.
      */}
      <section className="text-center space-y-2 mt-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
          Welcome to QuickOrder
        </h2>
        <p className="text-slate-500 text-lg">
          Touch anywhere to start your order
        </p>
      </section>

      {/* 
        Main Action Area 
        The layout ensures this container is centered on desktop and full-width on mobile.
      */}
      <section className="flex-grow flex items-center justify-center">
        <button 
          className="
            w-64 h-64 rounded-full 
            bg-blue-600 text-white 
            shadow-xl hover:bg-blue-700 active:scale-95 
            transition-all duration-200
            flex flex-col items-center justify-center gap-4
            group
          "
          aria-label="Start Order"
        >
          <span className="text-5xl group-hover:-translate-y-1 transition-transform">🍔</span>
          <span className="text-xl font-semibold">Tap to Start</span>
        </button>
      </section>

      {/* 
        Footer Info
        The layout handles the safe areas and scrolling, so this sits nicely at the bottom
        if content is short, or scrolls if content is long.
      */}
      <footer className="text-center text-sm text-slate-400 pb-4">
        <p>Accessibility Mode Available</p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>System Online</span>
        </div>
      </footer>
    </div>
  );
}

/*
  --- HOW IT WORKS IN NEXT.JS ---

  1. File Structure:
     app/
       layout.tsx  <-- The module provided (RootLayout)
       page.tsx    <-- The component defined above (HomePage)
       globals.css <-- Imported by layout.tsx

  2. Rendering Process:
     Next.js renders:
     <RootLayout>
       <HomePage />
     </RootLayout>

  3. Resulting HTML Structure:
     <html lang="en" class="--font-inter --font-lexend">
       <body class="bg-slate-50 ...">
         <div class="relative flex-grow w-full max-w-md ...">
           <main ...>
             <!-- HomePage Content Here -->
             <div class="flex flex-col h-full ...">
               ...
             </div>
           </main>
           <div id="portal-root" />
         </div>
       </body>
     </html>
*/
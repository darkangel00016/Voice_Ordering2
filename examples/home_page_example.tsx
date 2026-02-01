/**
 * examples/kiosk_app_example.tsx
 * 
 * This example demonstrates how to mount the `OrderKioskPage` within a Next.js
 * application layout. Since `OrderKioskPage` is a top-level page component,
 * usage typically involves placing it within the `app/` directory structure.
 * 
 * This example simulates a root layout wrapper that might provide global styles
 * or context, and then renders the Kiosk page.
 * 
 * Prerequisites:
 * 1. A Next.js 13+ project (App Router).
 * 2. The `OrderKioskPage` component saved at `app/page.tsx` (or similar route).
 * 3. Backend API routes available at `/api/menu`, `/api/conversation`, and `/api/order`.
 */

import React from 'react';
import OrderKioskPage from './OrderKioskPage'; // Assuming the module is in the same directory

// --- Mock Layout Component ---
// In a real Next.js app, this would be `app/layout.tsx`
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="antialiased text-slate-900 bg-white">
      {/* Global Navigation or Header could go here */}
      <nav className="bg-slate-900 text-white p-2 text-xs text-center">
        DEMO MODE: API calls will fail unless backend is running.
      </nav>
      
      {/* Main Content Area */}
      {children}
    </div>
  );
};

/**
 * App Entry Point
 * 
 * This component represents the root of the application where the Kiosk Page
 * is mounted.
 */
export default function App() {
  return (
    <RootLayout>
      {/* 
        The OrderKioskPage handles its own state (conversation, order, menu)
        and side effects (fetching data on mount).
        
        It expects:
        - GET /api/menu
        - POST /api/conversation
        - POST /api/order
      */}
      <OrderKioskPage />
    </RootLayout>
  );
}

// --- Mocking API Responses for Demonstration Purposes ---
// Since this is a standalone example, we can't actually hit the backend.
// In a real browser environment, you would see network errors in the console
// if the backend isn't running.

/*
  Expected API Behavior for OrderKioskPage:

  1. GET /api/menu
     Response: {
       items: [
         { id: '1', name: 'Burger', basePrice: 10.00, ... },
         { id: '2', name: 'Fries', basePrice: 4.00, ... }
       ]
     }

  2. POST /api/conversation
     Request: { message: "I want a burger", state: { ... } }
     Response: {
       reply: "Added a burger. Anything else?",
       state: { ...updatedStateWithBurger... }
     }

  3. POST /api/order
     Request: { items: [...], total: 14.00, ... }
     Response: {
       success: true,
       data: { confirmationId: "12345" }
     }
*/
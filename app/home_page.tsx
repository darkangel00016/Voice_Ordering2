'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MenuItem,
  Order,
  ConversationState,
  ConversationTurn,
  ApiResult
} from '../lib/types';

// Component Imports
import VoiceControls from '../components/VoiceControls';
import TranscriptPanel from '../components/TranscriptPanel';
import OrderSummary from '../components/OrderSummary';
// Initial empty state for the conversation
const INITIAL_STATE: ConversationState = {
  conversationId: '', // Will be generated or assigned by server/client logic
  history: [],
  currentOrder: {
    id: '',
    customerId: 'guest', // Default for kiosk
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  lastUpdated: new Date().toISOString()
};

export default function OrderKioskPage() {
  // --- State Management ---
  
  // Core data state
  const [conversationState, setConversationState] = useState<ConversationState>(INITIAL_STATE);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  
  // UI/Interaction state
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Initialization (GET /api/menu) ---
  
  useEffect(() => {
    // Generate a session ID on mount
    setConversationState(prev => ({
      ...prev,
      conversationId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    // Fetch Menu (Background task to ensure API is alive and potentially cache data)
    const fetchMenu = async () => {
      try {
        const menuUrl = '/api/menu';
        const res = await fetch(menuUrl);
        if (!res.ok) throw new Error('Failed to load menu');
        const data = await res.json();
        if (data.items) setMenu(data.items);
      } catch (err) {
        console.error("Menu fetch error:", err);
        setError("Unable to load menu data. Voice ordering may be limited.");
      }
    };

    fetchMenu();
  }, []);

  // --- 2. Conversation Logic (POST /api/conversation) ---

  const handleUserTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const normalizedText = normalizeNumberWords(text);

    setIsProcessing(true);
    setError(null);

    // Optimistically add user turn to UI
    const userTurn: ConversationTurn = {
      id: `turn_user_${Date.now()}`,
      role: 'user',
      content: normalizedText,
      timestamp: new Date().toISOString()
    };

    setConversationState(prev => ({
      ...prev,
      history: [...prev.history, userTurn]
    }));

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: normalizedText,
          state: conversationState // Send current context
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversation API error');
      }

      // Update local state with server's "truth" (includes updated order and history)
      if (data.state) {
        setConversationState(data.state);
      }

      // Trigger TTS if there is a reply
      if (data.reply) {
        setAssistantResponse(data.reply);
      }

    } catch (err) {
      console.error("Conversation error:", err);
      setError("Sorry, I had trouble processing that. Please try again.");
      setAssistantResponse("I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [conversationState]);

  const normalizeNumberWords = (input: string) => {
    const map: Record<string, string> = {
      un: "1",
      una: "1",
      uno: "1",
      dos: "2",
      tres: "3",
      cuatro: "4",
      cinco: "5",
      seis: "6",
      siete: "7",
      ocho: "8",
      nueve: "9",
      diez: "10",
      once: "11",
      doce: "12",
      trece: "13",
      catorce: "14",
      quince: "15",
      dieciseis: "16",
      diecisiete: "17",
      dieciocho: "18",
      diecinueve: "19",
      veinte: "20",
      veintiuno: "21",
      veintidos: "22",
      veintitres: "23",
      veinticuatro: "24",
      veinticinco: "25",
      veintiseis: "26",
      veintisiete: "27",
      veintiocho: "28",
      veintinueve: "29",
      treinta: "30",
      cuarenta: "40",
      cincuenta: "50",
      sesenta: "60",
      setenta: "70",
      ochenta: "80",
      noventa: "90",
    };

    return input.replace(/\b(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\b/gi, (match) => {
      const key = match.toLowerCase();
      return map[key] || match;
    });
  };

  // --- 3. Order Finalization (POST /api/order) ---

  const handleConfirmOrder = async () => {
    if (conversationState.currentOrder.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsSubmittingOrder(true);
    setError(null);

    try {
      const orderUrl = '/api/order';
      const response = await fetch(orderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationState.currentOrder)
      });

      const result: ApiResult<any> = await response.json();

      if (response.ok && result.success) {
        // Success Flow
        setAssistantResponse("Your order has been placed successfully! Please take your receipt.");
        // In a real app, redirect to a success/status page here
        alert(`Order Confirmed! ID: ${result.data.confirmationId}`);
        
        // Reset for next customer (optional, or navigate away)
        setConversationState({
          ...INITIAL_STATE,
          conversationId: `session_${Date.now()}`
        });
      } else {
        // Handle API specific errors
        throw new Error(result.error?.message || "Order submission failed");
      }
    } catch (err: any) {
      console.error("Order error:", err);
      setError(err.message || "Failed to place order. Please ask for help.");
      setAssistantResponse("I couldn't place the order. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleEditOrder = () => {
    // In a voice-first UI, "Edit" usually means prompting the user to speak changes
    setAssistantResponse("What would you like to change?");
  };

  // --- Render ---

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* Left Column: Conversation Interface */}
      <section className="flex-1 flex flex-col h-[50vh] md:h-screen border-r border-slate-200 relative">
        <header className="p-4 bg-white border-b border-slate-100 shadow-sm z-10">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🎙️</span> Voice Kiosk
          </h1>
          {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-100">
              {error}
            </div>
          )}
        </header>

        {/* Live Transcript */}
        <div className="flex-1 overflow-hidden relative bg-slate-100">
          <TranscriptPanel 
            turns={conversationState.history}
            isListening={isListening}
            isProcessing={isProcessing}
            className="h-full w-full"
          />
        </div>

        {/* Voice Controls (Fixed at bottom of left column on desktop, bottom of screen on mobile) */}
        <div className="p-6 bg-white border-t border-slate-200">
          <VoiceControls
            onTranscript={handleUserTranscript}
            isListening={isListening}
            onListeningChange={setIsListening}
            textToSpeak={assistantResponse}
          />
          <p className="text-center text-xs text-slate-400 mt-3">
            Hold to speak • "Add a burger" • "Remove the fries"
          </p>
        </div>
      </section>

      {/* Right Column: Order Summary */}
      <section className="flex-1 md:max-w-md bg-white h-[50vh] md:h-screen flex flex-col shadow-xl z-20">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Current Order</h2>
          
          <OrderSummary
            order={conversationState.currentOrder}
            onConfirm={handleConfirmOrder}
            onEdit={handleEditOrder}
            isSubmitting={isSubmittingOrder}
            // Pass validation errors if the API returns specific item issues
            validation={undefined} 
          />
        </div>
        
        {/* Fallback / Accessibility Info */}
        <div className="p-4 bg-slate-50 text-xs text-slate-500 border-t border-slate-100">
          <p>
            <strong>Accessibility:</strong> If voice commands are unavailable, 
            please use the touchscreen to modify items in the summary above.
          </p>
        </div>
      </section>

    </main>
  );
}

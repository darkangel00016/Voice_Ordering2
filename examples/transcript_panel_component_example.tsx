import React, { useState, useEffect } from 'react';
import TranscriptPanel from './../components/TranscriptPanel'; // Adjust path as needed
import { ConversationTurn } from '../lib/types'; // Adjust path as needed

/**
 * Example Usage: Live Order Assistant
 * 
 * This example demonstrates how to integrate the TranscriptPanel into a larger
 * application context. It simulates a live conversation flow where:
 * 1. The user speaks (simulated by adding a user message).
 * 2. The system processes the input (showing loading states).
 * 3. The assistant responds (adding a bot message).
 */
const LiveOrderAssistantExample: React.FC = () => {
  // State to manage the conversation history
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  
  // State to manage UI indicators
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to add a new turn to the history
  const addTurn = (role: 'user' | 'assistant', content: string) => {
    const newTurn: ConversationTurn = {
      id: `turn_${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setTurns((prev) => [...prev, newTurn]);
  };

  // Simulation: Start a fake conversation flow
  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];

    const schedule = (fn: () => void, delay: number) => {
      const t = setTimeout(fn, delay);
      timeouts.push(t);
    };

    // 1. Initial Greeting
    schedule(() => {
      addTurn('assistant', "Hi there! I'm ready to take your order. What can I get for you today?");
    }, 500);

    // 2. Simulate User Speaking
    schedule(() => setIsListening(true), 2000);
    
    schedule(() => {
      setIsListening(false);
      addTurn('user', "I'd like a large pepperoni pizza and a coke.");
      setIsProcessing(true); // Start processing immediately after user speaks
    }, 4500);

    // 3. Simulate AI Processing & Response
    schedule(() => {
      setIsProcessing(false);
      addTurn('assistant', "Got it. One large pepperoni pizza and a Coke. Would you like any sides with that?");
    }, 6500);

    // 4. Simulate User Speaking again
    schedule(() => setIsListening(true), 8000);

    schedule(() => {
      setIsListening(false);
      addTurn('user', "No, that's all thanks.");
      setIsProcessing(true);
    }, 10000);

    // 5. Final Confirmation
    schedule(() => {
      setIsProcessing(false);
      addTurn('assistant', "Alright, I've placed your order. It will be ready in about 15 minutes!");
    }, 12000);

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="w-full max-w-md space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">Order Kiosk Demo</h1>
        <p className="text-slate-600">
          Watch the transcript update automatically as the simulated conversation progresses.
        </p>
      </div>

      {/* 
        The TranscriptPanel is constrained by the parent container's height.
        We give it a fixed height here to demonstrate the internal scrolling behavior.
      */}
      <div className="w-full max-w-md h-[500px] shadow-xl">
        <TranscriptPanel 
          turns={turns}
          isListening={isListening}
          isProcessing={isProcessing}
          className="h-full" // Ensure the panel fills the container
        />
      </div>

      {/* Manual Controls for Testing */}
      <div className="flex gap-4">
        <button 
          onClick={() => setTurns([])}
          className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
        >
          Clear History
        </button>
        <button 
          onClick={() => setIsListening(!isListening)}
          className={`px-4 py-2 text-sm border rounded ${
            isListening 
              ? 'bg-red-100 text-red-700 border-red-200' 
              : 'bg-white text-slate-600 border-slate-300'
          }`}
        >
          Toggle Mic
        </button>
      </div>
    </div>
  );
};

export default LiveOrderAssistantExample;
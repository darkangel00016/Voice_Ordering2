/**
 * examples/conversation_flow_example.ts
 * 
 * This example demonstrates how to use the Conversation Engine to:
 * 1. Initialize a new conversation state.
 * 2. Simulate a multi-turn conversation loop.
 * 3. Handle state updates and order status changes.
 * 4. Catch and handle specific conversation errors.
 * 
 * Prerequisites:
 * - Ensure 'lib/conversationEngine.ts' and its dependencies exist.
 * - Run this with a TypeScript runner (e.g., ts-node).
 */

import { 
  advanceConversation, 
  createInitialState, 
  ConversationError 
} from '../lib/conversationEngine'; // Adjust path relative to your file structure

import { ConversationState } from '../lib/types';

/**
 * Simulates a user interacting with the bot.
 * 
 * @param currentState - The current state of the conversation.
 * @param userMessage - The text input from the user.
 * @returns The updated conversation state.
 */
async function simulateTurn(
  currentState: ConversationState, 
  userMessage: string
): Promise<ConversationState> {
  console.log(`\n👤 User: "${userMessage}"`);
  
  try {
    // The core function of the module: takes state + input, returns new state
    const newState = await advanceConversation(currentState, userMessage);
    
    // Extract the latest response from the AI
    const lastTurn = newState.history[newState.history.length - 1];
    
    if (lastTurn.role === 'assistant') {
      console.log(`🤖 Assistant: "${lastTurn.content}"`);
      
      // Check if the engine updated any metadata (e.g., order confirmation)
      if (lastTurn.metadata && lastTurn.metadata.orderStatusChanged) {
        console.log(`   [System Event]: Order status changed to '${lastTurn.metadata.orderStatusChanged}'`);
      }
    }

    return newState;

  } catch (error) {
    // Demonstrate error handling using the exported custom error class
    if (error instanceof ConversationError) {
      console.error(`❌ Conversation Error [${error.code}]: ${error.message}`);
    } else {
      console.error(`❌ Unexpected Error:`, error);
    }
    // Return the old state so the app doesn't crash
    return currentState;
  }
}

async function runConversationDemo() {
  console.log("🚀 Starting Conversation Engine Demo...\n");

  // 1. Initialize State
  // This creates the empty history and pending order structure
  let state = createInitialState("demo_session_123");
  console.log(`Initialized Session: ${state.conversationId}`);
  console.log(`Initial Order Status: ${state.currentOrder.status}`);

  // 2. Turn 1: General Inquiry
  // The AI should respond based on the menu context (fetched internally by the engine)
  state = await simulateTurn(state, "Hi, do you have any vegan options?");

  // 3. Turn 2: Intent to Order
  // The engine processes this, calls the AI, and appends the history
  state = await simulateTurn(state, "Great, I'll take the Vegan Burger.");

  // 4. Turn 3: Triggering Guardrails (Attempting to finalize)
  // The engine's internal logic checks for "confirm" keywords.
  // Since we haven't actually added items to the order object in this mock implementation
  // (the AI text says it did, but the state.items array is likely empty unless we mocked the tool call),
  // the validator inside advanceConversation might block this or allow it depending on mock logic.
  state = await simulateTurn(state, "Please confirm my order.");

  // 5. Inspect Final State
  console.log("\n--- Final Conversation State ---");
  console.log(`History Length: ${state.history.length} turns`);
  console.log(`Order Status: ${state.currentOrder.status}`);
  console.log(`Last Updated: ${state.lastUpdated}`);
}

// Execute the demo
runConversationDemo().catch(err => console.error("Fatal script error:", err));
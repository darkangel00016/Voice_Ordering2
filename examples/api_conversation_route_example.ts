/**
 * examples/client_usage_example.ts
 * 
 * This example demonstrates how a client-side application (e.g., a React component or a script)
 * would consume the POST /api/conversation endpoint defined in the module.
 * 
 * It simulates:
 * 1. Initializing a conversation state locally.
 * 2. Sending a user message to the API.
 * 3. Handling the API response to update local state and display the assistant's reply.
 * 4. Error handling for network or validation issues.
 * 
 * Note: In a real Next.js app, the fetch calls would likely happen inside a React Component,
 * Custom Hook, or Server Action.
 */

import { ConversationState } from "@/lib/types";

// Mock initial state structure matching what the server expects
const initialClientState: ConversationState = {
  conversationId: "client-session-abc-123",
  history: [],
  currentOrder: {
    items: [],
    status: "pending",
    total: 0
  },
  lastUpdated: new Date().toISOString()
};

/**
 * Sends a message to the conversation API.
 * 
 * @param message - The user's input text.
 * @param currentState - The current conversation state object.
 * @returns A promise resolving to the API response data.
 */
async function sendMessageToApi(message: string, currentState: ConversationState) {
  const endpoint = "http://localhost:3000/api/conversation"; // Adjust host as needed

  console.log(`\n📤 Sending to API: "${message}"`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        state: currentState,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("❌ API Call Failed:", error);
    throw error;
  }
}

/**
 * Main execution function to simulate a conversation flow.
 */
async function runClientDemo() {
  // 1. Start with initial state
  let localState = initialClientState;
  console.log("🔹 Client initialized with empty state.");

  // 2. First Interaction: User asks for menu
  try {
    const response1 = await sendMessageToApi("What is on the menu?", localState);
    
    if (response1.reply) {
      console.log(`🤖 Assistant: "${response1.reply}"`);
    }
    
    // Update local state with the state returned by the server
    // This is crucial because the server maintains the 'truth' of the conversation history
    localState = response1.state;

  } catch (e) {
    console.log("Skipping to next turn due to error...");
  }

  // 3. Second Interaction: User places an order
  try {
    // We pass the *updated* localState from the previous turn
    const response2 = await sendMessageToApi("I'll have the Caesar Salad.", localState);

    if (response2.reply) {
      console.log(`🤖 Assistant: "${response2.reply}"`);
    }

    localState = response2.state;
    
    // Check if the server updated the order details in the state
    const itemCount = localState.currentOrder.items.length;
    console.log(`🛒 Client State Order Items: ${itemCount}`);

  } catch (e) {
    console.log("Skipping to next turn due to error...");
  }

  // 4. Error Handling Example: Sending invalid data
  try {
    console.log("\n🔸 Testing Error Handling (Empty Message)...");
    await sendMessageToApi("", localState);
  } catch (error: any) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
}

// Run the simulation
if (require.main === module) {
  runClientDemo();
}
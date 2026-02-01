/**
 * examples/aiInteractionExample.ts
 * 
 * This script demonstrates how to use the AI Client adapter to generate
 * responses for a restaurant ordering assistant.
 * 
 * It simulates a conversation history and handles the asynchronous response.
 */

import { generateAssistantReply } from '../lib/aiClient';
import { ConversationInput, ConversationTurn } from '../lib/types';

// Mocking the environment for this example execution
// In a real app, these are set in .env files
process.env.AI_API_KEY = 'sk-mock-key-for-example';
process.env.AI_MODEL = 'gpt-4-turbo';

async function runConversationExample() {
  console.log("🤖 Initializing AI Conversation Example...\n");

  // 1. Define the conversation history
  // This represents the context the AI needs to understand the current request.
  const history: ConversationTurn[] = [
    {
      id: 'turn_1',
      role: 'user',
      content: 'Hi, do you have any vegan options?',
      timestamp: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 'turn_2',
      role: 'assistant',
      content: 'Yes! We have a Vegan Burger and a Quinoa Salad. Would you like to hear more about either?',
      timestamp: new Date(Date.now() - 30000).toISOString()
    }
  ];

  // 2. Define the new user message
  const newMessage = "How much is the burger?";

  // 3. Construct the input payload
  const input: ConversationInput = {
    history,
    newMessage
  };

  console.log(`👤 User: "${newMessage}"`);
  console.log("⏳ Waiting for AI response...");

  try {
    // 4. Call the AI Client adapter
    // This function handles the API handshake, system prompting, and error normalization.
    const responseTurn: ConversationTurn = await generateAssistantReply(input);

    // 5. Handle the successful response
    console.log(`\n🤖 Assistant: "${responseTurn.content}"`);
    console.log(`   [Metadata: ID=${responseTurn.id}, Time=${responseTurn.timestamp}]`);

  } catch (error: any) {
    // 6. Handle potential errors (e.g., API downtime, rate limits)
    console.error("\n❌ Failed to get response from AI:");
    console.error(`   ${error.message}`);
    
    // Example fallback logic
    console.log("   -> Falling back to hardcoded menu link.");
  }
}

// Execute the example
runConversationExample().catch(console.error);
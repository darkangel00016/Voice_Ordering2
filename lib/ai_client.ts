/**
 * lib/aiClient.ts
 * 
 * Thin adapter for calling an external LLM provider.
 * Encapsulates model calls, prompt construction, and error handling.
 */

import { config } from './env_config';
import { 
  ConversationTurn, 
  ConversationInput 
} from './types'; // Adjust path based on your project structure

/**
 * System prompt that defines the AI's persona and safety boundaries.
 * In a production system, this might be loaded from a file or CMS.
 */
const SYSTEM_PROMPT = `
You are a helpful, polite, and efficient restaurant ordering assistant.
Your goal is to help customers browse the menu and place orders.
SAFETY RULES:
1. Do not discuss topics outside of food, the menu, or the restaurant.
2. Do not ask for credit card numbers directly; tell the user they will pay at checkout.
3. If the user asks for an item not on the menu, politely decline.
4. Keep responses concise.
`.trim();

/**
 * Generates a reply from the AI assistant based on the conversation history.
 * 
 * @param input - The current conversation context including history and the latest user message.
 * @returns A Promise resolving to the assistant's response as a ConversationTurn.
 * @throws Error if the external API call fails or returns an invalid response.
 */
export async function generateAssistantReply(input: ConversationInput): Promise<ConversationTurn> {
  const { history, newMessage, menuSummary } = input;

  // 1. Construct the payload for the vendor-agnostic API
  // We map our internal ConversationTurn types to a standard "messages" format
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(menuSummary
      ? [
          {
            role: 'system',
            content: `MENU CONTEXT:\n${menuSummary}`,
          },
        ]
      : []),
    ...history.map(turn => ({
      role: turn.role,
      content: turn.content
    })),
    { role: 'user', content: newMessage }
  ];

  const payload = {
    model: config.aiModel, // Sourced from env config
    messages: messages,
    temperature: 0.7,
    max_tokens: 500
  };

  try {
    // 2. Call the external LLM provider
    // Note: We use the generic fetch API here to remain vendor-agnostic.
    // The URL is assumed to be a standard chat completions endpoint (e.g., OpenAI compatible).
    // If a specific vendor URL isn't in config, we assume a proxy or direct URL.
    // For this implementation, we'll assume the config might have an endpoint or we default to a standard one.
    const apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions'; 

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.aiApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI Provider Error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    // 3. Parse the response
    // We assume a standard OpenAI-like response shape for this adapter.
    // { choices: [ { message: { content: "..." } } ] }
    const assistantContent = data.choices?.[0]?.message?.content;

    if (!assistantContent) {
      throw new Error('AI Provider returned an empty or malformed response.');
    }

    // 4. Construct and return the ConversationTurn
    const assistantTurn: ConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
      metadata: {
        // We could parse the content here to extract structured data (like suggested items)
        // if the LLM was instructed to output JSON, but for now we leave it generic.
      }
    };

    return assistantTurn;

  } catch (error: any) {
    // Normalize error handling
    console.error('Error in generateAssistantReply:', error);
    
    // We re-throw a clean error or return a fallback depending on business logic.
    // Here we throw so the UI layer can decide how to show the error (e.g., toast notification).
    throw new Error(error.message || 'Failed to generate AI response');
  }
}

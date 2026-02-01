// lib/conversationEngine.ts

import { 
  ConversationState, 
  ConversationTurn, 
  MenuItem, 
  Order, 
  OrderItem, 
  OrderStatus,
  ApiResult 
} from './types';

import { generateAssistantReply } from './ai_client';
import { validateOrder } from './order_validator';
import { fetchMenu } from './menu_client';

/**
 * Custom error class for conversation processing failures.
 */
export class ConversationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ConversationError';
  }
}

/**
 * Orchestrates the conversation flow.
 * 1. Updates history with user input.
 * 2. Checks for specific intent triggers (e.g., "place order").
 * 3. Calls AI to generate a response.
 * 4. Validates any potential order modifications against the menu.
 * 5. Returns the updated state.
 * 
 * @param state - The current snapshot of the conversation and order.
 * @param userText - The raw text input from the user.
 * @returns A Promise resolving to the new ConversationState.
 */
export async function advanceConversation(
  state: ConversationState, 
  userText: string
): Promise<ConversationState> {
  
  // 1. Append User Turn
  const userTurn: ConversationTurn = {
    id: `turn_${Date.now()}_user`,
    role: 'user',
    content: userText,
    timestamp: new Date().toISOString()
  };

  const updatedHistory = [...state.history, userTurn];
  
  // 2. Fetch Menu (needed for context and validation)
  let menu: MenuItem[] = [];
  try {
    menu = await fetchMenu();
  } catch (error) {
    // Fallback or rethrow depending on severity. 
    // Here we log and proceed, though AI might hallucinate without menu context.
    console.error("Warning: Could not fetch menu for conversation context.", error);
  }

  // 3. Determine System Context & Guardrails
  // We inject the current order status and menu summary into the system prompt context implicitly
  // via the AI client (assuming the AI client handles prompt engineering based on history).
  // However, we can also perform deterministic checks here.

  let nextOrderState = { ...state.currentOrder };
  let aiResponseContent = "";
  let metadata: Record<string, any> = {};

  try {
    // Opportunistically add menu items based on the user's text.
    const orderUpdate = addItemFromText(userText, menu, nextOrderState);
    nextOrderState = orderUpdate.order;
    if (orderUpdate.addedItem) {
      metadata.itemAdded = orderUpdate.addedItem.name;
    }

    // 4. Call AI Client
    // We pass the full history. The AI is expected to return natural text 
    // and potentially structured data (tool calls) if configured. 
    // For this implementation, we assume the AI returns text, and we parse intent 
    // or rely on a specific structured response format if the prompt requires it.
    
    // Note: In a more advanced setup, we would pass 'functions' or 'tools' to the LLM 
    // to let it explicitly call 'addToCart'. Here, we simulate a text-based flow 
    // where the AI confirms actions verbally, or we parse specific keywords.
    
    const aiTurn = await generateAssistantReply({
      history: updatedHistory,
      newMessage: userText,
      menuSummary: buildMenuSummary(menu)
    });

    aiResponseContent = aiTurn.content;
    
    // 5. Post-Processing / Guardrails
    // Example: If the AI says "I've added X to your order", we should ideally 
    // have a mechanism to actually update the state. 
    // Since the prompt requirements emphasize "ordering-only guardrails", 
    // we will simulate a basic intent parser here to demonstrate state mutation.
    
    // *Hypothetical Intent Parsing Logic*
    // In a real production app, the AI would return a JSON function call.
    // Here, we check if the AI *thinks* it added something, or if the user explicitly asked to finalize.
    
    if (state.currentOrder.status === 'pending' && /confirm|place order/i.test(userText)) {
      // Guardrail: Validate order before finalizing
      const validation = validateOrder(state.currentOrder, menu);
      
      if (validation.isValid) {
        nextOrderState.status = 'confirmed';
        metadata.orderStatusChanged = 'confirmed';
        // Override AI response to be authoritative if needed, or append confirmation
        // aiResponseContent += " (System: Order validated and confirmed.)";
      } else {
        // Guardrail triggered: Order is invalid
        aiResponseContent = "I can't place the order yet. " + 
          validation.errors.map(e => e.message).join(" ");
      }
    }

  } catch (error: any) {
    console.error("AI Generation failed:", error);
    throw new ConversationError("Failed to generate response.", "AI_SERVICE_ERROR");
  }

  // 6. Construct Assistant Turn
  const assistantTurn: ConversationTurn = {
    id: `turn_${Date.now()}_ai`,
    role: 'assistant',
    content: aiResponseContent,
    timestamp: new Date().toISOString(),
    metadata: metadata
  };

  // 7. Return New State
  return {
    conversationId: state.conversationId,
    history: [...updatedHistory, assistantTurn],
    currentOrder: nextOrderState,
    lastUpdated: new Date().toISOString()
  };
}

function addItemFromText(
  userText: string,
  menu: MenuItem[],
  order: Order
): { order: Order; addedItem?: OrderItem } {
  if (!menu.length) {
    return { order };
  }

  const normalizedText = userText.toLowerCase();
  const matchedMenuItem = menu.find((item) =>
    matchesMenuItem(normalizedText, item.name)
  );

  if (!matchedMenuItem) {
    return { order };
  }

  const quantity = extractQuantity(normalizedText, matchedMenuItem.name);

  const existingItem = order.items.find(
    (item) => item.menuItemId === matchedMenuItem.id && item.selectedModifiers.length === 0
  );

  let newItem: OrderItem | null = null;
  if (!existingItem) {
    newItem = {
      id: `line_${Date.now()}`,
      menuItemId: matchedMenuItem.id,
      name: matchedMenuItem.name,
      quantity,
      unitPrice: matchedMenuItem.basePrice,
      selectedModifiers: [],
    };
  }

  const updatedItems = existingItem
    ? order.items.map((item) =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
    : [...order.items, newItem!];

  const taxRate = order.subtotal > 0 ? order.tax / order.subtotal : 0;
  const subtotal = updatedItems.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );
  const tax = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return {
    order: {
      ...order,
      items: updatedItems,
      subtotal,
      tax,
      total,
      updatedAt: new Date().toISOString(),
    },
    addedItem: newItem || existingItem,
  };
}

function matchesMenuItem(normalizedText: string, itemName: string): boolean {
  const normalizedName = itemName.toLowerCase();
  if (normalizedText.includes(normalizedName)) {
    return true;
  }

  const nameTokens = normalizedName.split(/[^a-z0-9]+/).filter(Boolean);
  return nameTokens.some((token) => token.length >= 3 && normalizedText.includes(token));
}

function extractQuantity(normalizedText: string, itemName: string): number {
  const wordNumbers: Record<string, number> = {
    un: 1,
    una: 1,
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciseis: 16,
    diecisiete: 17,
    dieciocho: 18,
    diecinueve: 19,
    veinte: 20,
    veintiuno: 21,
    veintidos: 22,
    veintitres: 23,
    veinticuatro: 24,
    veinticinco: 25,
    veintiseis: 26,
    veintisiete: 27,
    veintiocho: 28,
    veintinueve: 29,
    treinta: 30,
    cuarenta: 40,
    cincuenta: 50,
    sesenta: 60,
    setenta: 70,
    ochenta: 80,
    noventa: 90,
  };

  const escapedName = itemName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");

  if (escapedName) {
    const beforeName = new RegExp(`\\b(\\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\\s*(?:x)?\\s*${escapedName}\\b`);
    const afterName = new RegExp(`\\b${escapedName}\\s*(?:x)?\\s*(\\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\\b`);
    const matchBefore = normalizedText.match(beforeName);
    const matchAfter = normalizedText.match(afterName);
    const match = matchBefore?.[1] || matchAfter?.[1];
    if (match) {
      const parsed = Number(match);
      return Number.isFinite(parsed) ? Math.max(1, parsed) : wordNumbers[match] || 1;
    }
  }

  const textTokens = normalizedText.split(/[^a-z0-9]+/).filter(Boolean);
  const nameTokens = itemName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const index = textTokens.findIndex((token) => nameTokens.includes(token));
  if (index >= 0) {
    const windowStart = Math.max(0, index - 3);
    const windowEnd = Math.min(textTokens.length, index + 4);
    for (let i = windowStart; i < windowEnd; i += 1) {
      const token = textTokens[i];
      if (/^\d+$/.test(token)) {
        return Math.max(1, Number(token));
      }
      if (wordNumbers[token]) {
        return wordNumbers[token];
      }
    }
  }

  return 1;
}

function buildMenuSummary(menu: MenuItem[]): string {
  if (!menu.length) return "";

  const grouped = new Map<string, string[]>();
  for (const item of menu) {
    const category = item.category || "Other";
    const entry = `${item.name} ($${item.basePrice.toFixed(2)})`;
    const list = grouped.get(category) || [];
    if (list.length < 6) {
      list.push(entry);
      grouped.set(category, list);
    }
  }

  return Array.from(grouped.entries())
    .map(([category, items]) => `${category}: ${items.join(", ")}`)
    .join("\n");
}

/**
 * Helper to initialize a fresh conversation state.
 */
export function createInitialState(conversationId?: string): ConversationState {
  return {
    conversationId: conversationId || `conv_${Date.now()}`,
    history: [],
    currentOrder: {
      id: `ord_${Date.now()}`,
      customerId: 'guest', // Default
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
}

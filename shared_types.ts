/**
 * lib/types.ts
 *
 * Defines core domain types for the menu, ordering system, and conversation flow.
 * These types are shared across the frontend and API routes to ensure data consistency.
 */

// --- Menu Types ---

/**
 * Represents a specific customization choice for a menu item (e.g., "Extra Cheese", "Soy Milk").
 */
export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: number; // Can be 0 or negative
  isAvailable: boolean;
}

/**
 * Represents a group of modifiers (e.g., "Milk Selection", "Toppings").
 */
export interface ModifierGroup {
  id: string;
  name: string;
  minSelection: number; // e.g., 1 for required choice
  maxSelection: number; // e.g., 1 for single choice
  options: ModifierOption[];
}

/**
 * Represents a product available for purchase.
 */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  modifierGroups: ModifierGroup[];
}

// --- Order Types ---

/**
 * Represents a single item within an order, including specific configurations.
 */
export interface OrderItem {
  id: string; // Unique ID for this specific line item (not the MenuItem ID)
  menuItemId: string;
  name: string; // Snapshot of name at time of order
  quantity: number;
  unitPrice: number; // Snapshot of price at time of order (base + modifiers)
  selectedModifiers: {
    groupId: string;
    optionId: string;
    name: string; // Snapshot
    priceAdjustment: number; // Snapshot
  }[];
  specialInstructions?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

/**
 * Represents a full customer order.
 */
export interface Order {
  id: string;
  customerId?: string; // Optional for guest checkout
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

// --- Conversation / AI Types ---

export type SenderRole = 'user' | 'assistant' | 'system';

/**
 * Represents a single turn in a chat conversation.
 */
export interface ConversationTurn {
  id: string;
  role: SenderRole;
  content: string;
  timestamp: string; // ISO 8601 date string
  metadata?: Record<string, unknown>; // For storing context like detected intents or order IDs
}

// --- API Request/Response Shapes ---

/**
 * Standard API Response wrapper for successful data retrieval.
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Standard API Error Response wrapper.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Union type for API responses to enforce checking success status.
 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

// --- Specific API Payloads ---

export interface CreateOrderRequest {
  items: {
    menuItemId: string;
    quantity: number;
    selectedModifiers?: { groupId: string; optionId: string }[];
    specialInstructions?: string;
  }[];
  customerId?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
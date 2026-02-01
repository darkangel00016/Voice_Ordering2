import {
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  ConversationTurn,
  ApiResult,
  CreateOrderRequest
} from './lib/types'; // Adjust path as needed

/**
 * Example 1: Defining a Menu Item with Modifiers
 * This demonstrates how to structure a product with customization options.
 */
const latte: MenuItem = {
  id: "item_123",
  name: "Vanilla Latte",
  description: "Espresso with steamed milk and vanilla syrup",
  basePrice: 4.50,
  category: "Beverages",
  isAvailable: true,
  modifierGroups: [
    {
      id: "mod_group_milk",
      name: "Milk Selection",
      minSelection: 1, // Required
      maxSelection: 1, // Single choice
      options: [
        { id: "opt_whole", name: "Whole Milk", priceAdjustment: 0, isAvailable: true },
        { id: "opt_oat", name: "Oat Milk", priceAdjustment: 0.75, isAvailable: true }
      ]
    }
  ]
};

/**
 * Example 2: Creating a Client-Side Order Request
 * This is the payload a frontend would send to the API to create an order.
 */
const newOrderRequest: CreateOrderRequest = {
  customerId: "cust_999",
  items: [
    {
      menuItemId: latte.id,
      quantity: 2,
      selectedModifiers: [
        { groupId: "mod_group_milk", optionId: "opt_oat" }
      ],
      specialInstructions: "Extra hot, please."
    }
  ]
};

/**
 * Example 3: Constructing a Full Order Object (Server-Side)
 * This simulates how the backend might transform the request into a stored Order record.
 */
function createOrderRecord(request: CreateOrderRequest, menuItems: MenuItem[]): Order {
  // In a real app, you would look up items from a DB. Here we simulate it.
  const itemDef = menuItems.find(i => i.id === request.items[0].menuItemId)!;
  
  // Calculate line item details
  const orderItem: OrderItem = {
    id: "line_item_1",
    menuItemId: itemDef.id,
    name: itemDef.name, // Snapshotting the name
    quantity: request.items[0].quantity,
    unitPrice: 5.25, // Base (4.50) + Oat Milk (0.75)
    selectedModifiers: [
      {
        groupId: "mod_group_milk",
        optionId: "opt_oat",
        name: "Oat Milk",
        priceAdjustment: 0.75
      }
    ],
    specialInstructions: request.items[0].specialInstructions
  };

  const subtotal = orderItem.unitPrice * orderItem.quantity;
  const tax = subtotal * 0.08;

  return {
    id: "order_555",
    customerId: request.customerId,
    items: [orderItem],
    subtotal: subtotal,
    tax: tax,
    total: subtotal + tax,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

const finalOrder = createOrderRecord(newOrderRequest, [latte]);

/**
 * Example 4: Typing an API Response
 * Demonstrates using the discriminated union ApiResult<T> for type safety.
 */
function handleApiResponse(response: ApiResult<Order>) {
  if (response.success) {
    // TypeScript knows 'response.data' is an Order here
    console.log(`Order confirmed! Total: $${response.data.total.toFixed(2)}`);
  } else {
    // TypeScript knows 'response.error' exists here
    console.error(`Failed: ${response.error.message} (Code: ${response.error.code})`);
  }
}

// Simulate a success response
handleApiResponse({
  success: true,
  data: finalOrder
});

// Simulate a chat log entry
const chatLog: ConversationTurn = {
  id: "turn_1",
  role: "assistant",
  content: "I've added 2 Vanilla Lattes with Oat Milk to your cart.",
  timestamp: new Date().toISOString(),
  metadata: {
    relatedOrderId: finalOrder.id
  }
};

console.log("Chat Log:", chatLog);
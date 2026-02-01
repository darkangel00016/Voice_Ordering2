/**
 * example_usage.ts
 * 
 * This example demonstrates how a client application (e.g., a frontend checkout page)
 * would interact with the POST /api/order endpoint defined in the module.
 * 
 * It simulates:
 * 1. Constructing a valid order payload.
 * 2. Sending the payload via fetch().
 * 3. Handling success (200), validation errors (400), and server errors (500/502).
 * 
 * Note: In a real Next.js app, this code would likely live in a React component
 * or a utility function like `services/orderService.ts`.
 */

import { Order, OrderItem } from "@/lib/types";

// --- 1. Define the API Endpoint URL ---
// In development, this is usually http://localhost:3000/api/order
const API_URL = "http://localhost:3000/api/order";

// --- 2. Helper to Create a Mock Order Payload ---
function createCheckoutPayload(): Partial<Order> {
  return {
    id: `ord_${Date.now()}`,
    customerId: "cust_12345",
    // The client sends the items they want.
    // Note: Prices sent by client are often ignored/recalculated by the server for security,
    // but we include them here for completeness of the type.
    items: [
      {
        id: "line_1",
        menuItemId: "burger_classic",
        name: "Classic Burger",
        quantity: 1,
        unitPrice: 10.00,
        selectedModifiers: [
          { groupId: "cheese_group", optionId: "cheddar" } // Adds $1.00
        ]
      } as OrderItem,
      {
        id: "line_2",
        menuItemId: "fries_side",
        name: "French Fries",
        quantity: 2,
        unitPrice: 4.00,
        selectedModifiers: []
      } as OrderItem
    ],
    // Initial status is usually pending until confirmed
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// --- 3. Function to Submit Order ---
async function submitOrderToApi(order: Partial<Order>) {
  console.log(`\n🚀 Submitting Order ${order.id}...`);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    const result = await response.json();

    // Handle HTTP Status Codes
    if (response.ok) {
      // Status 200: Success
      console.log("✅ Success!");
      console.log("   Message:", result.message);
      console.log("   Confirmation ID:", result.data.confirmationId);
      console.log("   Wait Time:", result.data.estimatedWaitTimeMinutes, "mins");
    } else {
      // Status 4xx or 5xx: Error
      console.error(`❌ Error (${response.status}):`, result.error);
      
      if (response.status === 400 && result.details) {
        // Validation errors (e.g., item unavailable, invalid modifiers)
        console.error("   Validation Details:");
        result.details.forEach((err: any) => {
          console.error(`   - [${err.code}] ${err.message}`);
        });
      } else if (result.message) {
        // Upstream errors (e.g., payment declined)
        console.error("   Reason:", result.message);
      }
    }
  } catch (networkError) {
    console.error("💥 Network Error:", networkError);
  }
}

// --- 4. Run Scenarios ---

async function runExamples() {
  // Scenario A: Valid Order
  const validOrder = createCheckoutPayload();
  await submitOrderToApi(validOrder);

  // Scenario B: Invalid Order (Empty Items)
  const emptyOrder = { ...createCheckoutPayload(), items: [] };
  await submitOrderToApi(emptyOrder);

  // Scenario C: Invalid Order (Malformed JSON simulation)
  // Note: We can't easily simulate malformed JSON with fetch+JSON.stringify, 
  // but the server handles it.
}

// Execute
runExamples();
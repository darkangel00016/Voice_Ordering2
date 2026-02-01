/**
 * example_usage.ts
 *
 * This script demonstrates how to use the orderSubmissionClient to submit
 * a finalized order to an external POS or Kitchen API.
 *
 * It covers:
 * 1. Constructing a valid Order object.
 * 2. Calling the submitOrder function.
 * 3. Handling the structured SubmissionResult (Success vs. Failure).
 */

import { submitOrder, SubmissionResult } from './lib/orderSubmissionClient';
import { Order, OrderStatus } from './lib/types';

// --- 1. Setup Mock Data ---

/**
 * Helper to create a realistic Order object.
 * In a real application, this would come from your database or cart state.
 */
function createMockOrder(): Order {
  return {
    id: `ord_${Date.now()}`,
    customerId: 'cust_888',
    status: 'pending' as OrderStatus,
    items: [
      {
        id: 'line_1',
        menuItemId: 'item_burger',
        name: 'Cheeseburger',
        quantity: 2,
        unitPrice: 12.50,
        selectedModifiers: [],
        specialInstructions: 'No onions'
      },
      {
        id: 'line_2',
        menuItemId: 'item_fries',
        name: 'Large Fries',
        quantity: 1,
        unitPrice: 4.00,
        selectedModifiers: []
      }
    ],
    subtotal: 29.00,
    tax: 2.32,
    total: 31.32,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// --- 2. Execution Logic ---

async function processOrder() {
  console.log('🛒 Preparing order for submission...');
  
  const myOrder = createMockOrder();
  console.log(`   Order ID: ${myOrder.id}`);
  console.log(`   Total: $${myOrder.total.toFixed(2)}`);

  console.log('\n🚀 Submitting to Kitchen API...');

  // Call the module function
  // This handles retries automatically for 5xx errors or network glitches
  const result: SubmissionResult = await submitOrder(myOrder);

  // --- 3. Handle Result ---

  if (result.success) {
    // TypeScript narrows 'result' to the success shape here
    console.log('✅ Order Submitted Successfully!');
    console.log(`   Confirmation ID: ${result.data.confirmationId}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Est. Wait Time: ${result.data.estimatedWaitTimeMinutes} mins`);
    
    // Logic to update local database status would go here
    // updateOrderStatus(myOrder.id, 'confirmed');
  } else {
    // TypeScript narrows 'result' to the failure shape here
    console.error('❌ Order Submission Failed');
    console.error(`   Error Code: ${result.error.code}`);
    console.error(`   Message: ${result.error.message}`);
    
    if (result.error.details) {
      console.error('   Details:', JSON.stringify(result.error.details, null, 2));
    }

    // Logic to alert user or queue for manual review would go here
  }
}

// Run the example
processOrder().catch(err => console.error('Unexpected fatal error:', err));
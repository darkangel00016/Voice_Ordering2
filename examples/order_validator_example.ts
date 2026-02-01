import { validateOrder, ValidationResult } from './lib/orderValidator'; // Adjust path to your module
import { MenuItem, Order, OrderItem } from './lib/types'; // Adjust path to your types

// --- 1. Setup Mock Data (Menu) ---

const menu: MenuItem[] = [
  {
    id: 'burger_classic',
    name: 'Classic Burger',
    description: 'Beef patty with lettuce and tomato',
    basePrice: 10.00,
    category: 'Main',
    isAvailable: true,
    modifierGroups: [
      {
        id: 'cheese_group',
        name: 'Cheese Selection',
        minSelection: 0,
        maxSelection: 1,
        options: [
          { id: 'cheddar', name: 'Cheddar', priceAdjustment: 1.00, isAvailable: true },
          { id: 'swiss', name: 'Swiss', priceAdjustment: 1.50, isAvailable: true }
        ]
      }
    ]
  },
  {
    id: 'fries_side',
    name: 'French Fries',
    description: 'Crispy salted fries',
    basePrice: 4.00,
    category: 'Sides',
    isAvailable: false, // Note: This item is unavailable
    modifierGroups: []
  }
];

// --- 2. Create Order Scenarios ---

// Scenario A: A valid order with modifiers
const validOrder: Order = {
  id: 'ord_001',
  customerId: 'cust_A',
  items: [
    {
      id: 'item_1',
      menuItemId: 'burger_classic',
      quantity: 2,
      // Client sends raw selections; price will be recalculated by validator
      unitPrice: 0, 
      selectedModifiers: [
        { groupId: 'cheese_group', optionId: 'cheddar' } 
      ]
    } as OrderItem
  ],
  subtotal: 0, tax: 0, total: 0, // Placeholders
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Scenario B: An invalid order (unavailable item + invalid modifier count)
const invalidOrder: Order = {
  id: 'ord_002',
  customerId: 'cust_B',
  items: [
    {
      id: 'item_2',
      menuItemId: 'fries_side', // Unavailable item
      quantity: 1,
      unitPrice: 0,
      selectedModifiers: []
    } as OrderItem,
    {
      id: 'item_3',
      menuItemId: 'burger_classic',
      quantity: 1,
      unitPrice: 0,
      selectedModifiers: [
        // Too many selections (max is 1)
        { groupId: 'cheese_group', optionId: 'cheddar' },
        { groupId: 'cheese_group', optionId: 'swiss' }
      ]
    } as OrderItem
  ],
  subtotal: 0, tax: 0, total: 0,
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// --- 3. Run Validation ---

console.log('--- Validating Scenario A (Success) ---');
const resultA: ValidationResult = validateOrder(validOrder, menu);

if (resultA.isValid) {
  console.log('✅ Order is valid.');
  console.log('Validated Total:', resultA.validatedOrder.total); 
  // Calculation: (10.00 Base + 1.00 Cheddar) * 2 Qty = 22.00 Subtotal
  // Tax (8%): 1.76 -> Total: 23.76
  console.log('First Item Name:', resultA.validatedOrder.items[0].name);
} else {
  console.error('❌ Validation failed:', resultA.errors);
}

console.log('\n--- Validating Scenario B (Failure) ---');
const resultB: ValidationResult = validateOrder(invalidOrder, menu);

if (!resultB.isValid) {
  console.log('❌ Order is invalid as expected.');
  resultB.errors.forEach(err => {
    console.log(`   [${err.code}] ${err.message} (Item ID: ${err.itemId})`);
  });
  // Expected Output:
  // [ITEM_UNAVAILABLE] Item 'French Fries' is currently unavailable.
  // [MODIFIER_INVALID] Too many selections for 'Cheese Selection'. Max allowed: 1.
}
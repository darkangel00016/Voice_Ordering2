import React, { useState } from 'react';
import { OrderSummary } from './components/OrderSummary'; // Adjust path as needed
import { Order, ValidationResult } from './lib/types';

// Mock data for the example
const mockOrder: Order = {
  id: 'ord_123',
  customerId: 'cust_abc',
  items: [
    {
      id: 'item_1',
      menuItemId: 'menu_burger',
      name: 'Classic Burger',
      quantity: 2,
      unitPrice: 12.50,
      selectedModifiers: [
        { groupId: 'g1', optionId: 'o1', name: 'Cheese', priceAdjustment: 1.00 }
      ],
      specialInstructions: 'No onions'
    },
    {
      id: 'item_2',
      menuItemId: 'menu_fries',
      name: 'French Fries',
      quantity: 1,
      unitPrice: 4.00
    }
  ],
  subtotal: 29.00,
  tax: 2.32,
  total: 31.32,
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const CheckoutPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | undefined>(undefined);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Order confirmed:', mockOrder.id);
      setIsSubmitting(false);
      alert('Order placed successfully!');
    }, 2000);
  };

  const handleEdit = () => {
    console.log('User requested to edit the order');
    // Logic to navigate back to menu or open edit modal
  };

  // Example: Trigger a validation error for demonstration
  const simulateError = () => {
    setValidation({
      isValid: false,
      errors: [{ code: 'MIN_ORDER', message: 'Minimum order amount is $35.00' }]
    });
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      
      <button 
        onClick={simulateError}
        className="text-sm text-blue-600 underline mb-2"
      >
        (Click to simulate validation error)
      </button>

      <OrderSummary
        order={mockOrder}
        validation={validation}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default CheckoutPage;
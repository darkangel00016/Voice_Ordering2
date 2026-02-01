import React from 'react';
import { Order, OrderItem, ValidationResult } from '../lib/types';

interface OrderSummaryProps {
  /** The current order object to display */
  order: Order;
  /** Optional validation result to show errors or warnings */
  validation?: ValidationResult;
  /** Callback when the user confirms the order */
  onConfirm: () => void;
  /** Callback when the user wants to modify the order */
  onEdit: () => void;
  /** Optional loading state for the confirm action */
  isSubmitting?: boolean;
}

/**
 * OrderSummary
 * 
 * Displays a detailed breakdown of the current order, including:
 * - List of items with quantities and prices
 * - Selected modifiers and special instructions
 * - Subtotal, tax, and total calculations
 * - Validation errors if the order is incomplete
 * 
 * Accessibility:
 * - Uses semantic HTML (dl, ul, li) for lists.
 * - Uses aria-live regions for validation errors.
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  order,
  validation,
  onConfirm,
  onEdit,
  isSubmitting = false
}) => {
  const hasErrors = validation && !validation.isValid;

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
        Order Summary
      </h2>

      {/* Validation Feedback */}
      {hasErrors && (
        <div 
          role="alert" 
          className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded"
        >
          <p className="font-semibold">Please correct the following:</p>
          <ul className="list-disc list-inside text-sm mt-1">
            {validation.errors.map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Order Items List */}
      <div className="space-y-4 mb-6">
        {order.items.length === 0 ? (
          <p className="text-gray-500 italic text-center py-4">Your cart is empty.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <OrderItemRow 
                key={item.id} 
                item={item} 
                formatCurrency={formatCurrency} 
              />
            ))}
          </ul>
        )}
      </div>

      {/* Totals Section */}
      {order.items.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2 mt-2">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onEdit}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
          aria-label="Edit order items"
        >
          Edit Order
        </button>
        <button
          onClick={onConfirm}
          disabled={hasErrors || order.items.length === 0 || isSubmitting}
          className={`flex-1 px-4 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            hasErrors ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
          aria-label="Confirm and submit order"
        >
          {isSubmitting ? 'Processing...' : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
};

/**
 * Sub-component for rendering individual line items
 */
const OrderItemRow: React.FC<{ 
  item: OrderItem; 
  formatCurrency: (n: number) => string 
}> = ({ item, formatCurrency }) => {
  const itemTotal = item.unitPrice * item.quantity;

  return (
    <li className="py-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-900">
            <span className="text-gray-500 mr-2">{item.quantity}x</span>
            {item.name}
          </div>
          
          {/* Modifiers */}
          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
            <ul className="text-xs text-gray-500 mt-1 ml-6 space-y-0.5">
              {item.selectedModifiers.map((mod, idx) => (
                <li key={`${mod.groupId}-${mod.optionId}-${idx}`}>
                  + {mod.name} 
                  {mod.priceAdjustment > 0 && ` (${formatCurrency(mod.priceAdjustment)})`}
                </li>
              ))}
            </ul>
          )}

          {/* Special Instructions */}
          {item.specialInstructions && (
            <p className="text-xs text-gray-500 italic mt-1 ml-6">
              Note: "{item.specialInstructions}"
            </p>
          )}
        </div>
        
        <div className="text-gray-700 font-medium text-sm">
          {formatCurrency(itemTotal)}
        </div>
      </div>
    </li>
  );
};

export default OrderSummary;
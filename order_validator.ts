import {
  MenuItem,
  Order,
  OrderItem,
  ModifierGroup,
  ModifierOption
} from './types'; // Adjust path to match your project structure

/**
 * Represents a single validation issue found within an order.
 */
export interface ValidationError {
  code: 'ITEM_NOT_FOUND' | 'ITEM_UNAVAILABLE' | 'MODIFIER_REQUIRED' | 'MODIFIER_INVALID' | 'PRICE_MISMATCH';
  message: string;
  itemId?: string; // The ID of the line item in the order
  menuItemId?: string; // The ID of the menu item definition
  details?: Record<string, any>;
}

/**
 * The result of a validation operation.
 * If valid is true, the `validatedOrder` contains the normalized order with recalculated prices.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validatedOrder: Order;
}

/**
 * Validates an Order against the current Menu.
 * 
 * This function:
 * 1. Checks if items exist and are available.
 * 2. Validates modifier constraints (min/max selections).
 * 3. Recalculates unit prices, subtotals, and totals to prevent client-side tampering.
 * 4. Returns a normalized Order object if valid, or a list of errors if not.
 * 
 * @param order - The incoming order object to validate.
 * @param menu - The list of available menu items.
 * @returns ValidationResult containing success status, errors, and the processed order.
 */
export function validateOrder(order: Order, menu: MenuItem[]): ValidationResult {
  const errors: ValidationError[] = [];
  const validatedItems: OrderItem[] = [];
  
  let calculatedSubtotal = 0;

  // 1. Iterate through every item in the order
  for (const item of order.items) {
    const menuDef = menu.find(m => m.id === item.menuItemId);

    // Check: Item Existence
    if (!menuDef) {
      errors.push({
        code: 'ITEM_NOT_FOUND',
        message: `Menu item with ID '${item.menuItemId}' not found.`,
        itemId: item.id,
        menuItemId: item.menuItemId
      });
      continue; // Cannot proceed with this item
    }

    // Check: Item Availability
    if (!menuDef.isAvailable) {
      errors.push({
        code: 'ITEM_UNAVAILABLE',
        message: `Item '${menuDef.name}' is currently unavailable.`,
        itemId: item.id,
        menuItemId: item.menuItemId
      });
      // We continue processing to find other errors, but this order is invalid.
    }

    // 2. Validate Modifiers and Calculate Unit Price
    let currentUnitPrice = menuDef.basePrice;
    const validatedModifiers: any[] = []; // We rebuild the modifiers list to ensure data integrity

    // Map of modifier group ID to the actual selections made by the user
    const userSelectionsByGroup = new Map<string, string[]>();

    // Pre-process user selections for easier counting
    if (item.selectedModifiers) {
      for (const mod of item.selectedModifiers) {
        const existing = userSelectionsByGroup.get(mod.groupId) || [];
        existing.push(mod.optionId);
        userSelectionsByGroup.set(mod.groupId, existing);
      }
    }

    // Iterate through the Menu Definition's modifier groups to check constraints
    if (menuDef.modifierGroups) {
      for (const group of menuDef.modifierGroups) {
        const userSelectedOptionIds = userSelectionsByGroup.get(group.id) || [];
        
        // Check: Min Selections (Required fields)
        if (userSelectedOptionIds.length < group.minSelection) {
          errors.push({
            code: 'MODIFIER_REQUIRED',
            message: `Selection required for '${group.name}'.`,
            itemId: item.id,
            menuItemId: item.menuItemId,
            details: { groupId: group.id, required: group.minSelection, provided: userSelectedOptionIds.length }
          });
        }

        // Check: Max Selections
        if (userSelectedOptionIds.length > group.maxSelection) {
          errors.push({
            code: 'MODIFIER_INVALID',
            message: `Too many selections for '${group.name}'. Max allowed: ${group.maxSelection}.`,
            itemId: item.id,
            menuItemId: item.menuItemId,
            details: { groupId: group.id, max: group.maxSelection, provided: userSelectedOptionIds.length }
          });
        }

        // Validate specific options and add to price
        for (const optionId of userSelectedOptionIds) {
          const optionDef = group.options.find(o => o.id === optionId);

          if (!optionDef) {
            errors.push({
              code: 'MODIFIER_INVALID',
              message: `Invalid option ID '${optionId}' for group '${group.name}'.`,
              itemId: item.id,
              menuItemId: item.menuItemId
            });
            continue;
          }

          if (!optionDef.isAvailable) {
             errors.push({
              code: 'MODIFIER_INVALID',
              message: `Option '${optionDef.name}' is currently unavailable.`,
              itemId: item.id,
              menuItemId: item.menuItemId
            });
          }

          // Add to unit price calculation
          currentUnitPrice += optionDef.priceAdjustment;

          // Reconstruct the modifier object for the validated order
          validatedModifiers.push({
            groupId: group.id,
            optionId: optionDef.id,
            name: optionDef.name,
            priceAdjustment: optionDef.priceAdjustment
          });
        }
      }
    }

    // 3. Construct Validated Item
    // We use the calculated price, not the price sent by the client
    const validatedItem: OrderItem = {
      ...item,
      name: menuDef.name, // Ensure name matches DB
      unitPrice: currentUnitPrice,
      selectedModifiers: validatedModifiers
    };

    validatedItems.push(validatedItem);
    calculatedSubtotal += (validatedItem.unitPrice * validatedItem.quantity);
  }

  // 4. Final Totals Calculation
  // Note: Tax logic is simplified here. In production, inject a tax calculator strategy.
  const TAX_RATE = 0.08; 
  const calculatedTax = calculatedSubtotal * TAX_RATE;
  const calculatedTotal = calculatedSubtotal + calculatedTax;

  // 5. Construct Final Object
  const validatedOrder: Order = {
    ...order,
    items: validatedItems,
    subtotal: Number(calculatedSubtotal.toFixed(2)),
    tax: Number(calculatedTax.toFixed(2)),
    total: Number(calculatedTotal.toFixed(2)),
    updatedAt: new Date().toISOString()
  };

  return {
    isValid: errors.length === 0,
    errors,
    validatedOrder
  };
}
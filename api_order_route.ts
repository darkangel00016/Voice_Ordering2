import { NextRequest, NextResponse } from "next/server";
import { validateOrder } from "@/lib/orderValidator";
import { submitOrder } from "@/lib/orderSubmissionClient";
import { Order, MenuItem } from "@/lib/types";

// Mock Menu Data Source
// In a real application, this would be fetched from a database or CMS
const CURRENT_MENU: MenuItem[] = [
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
    isAvailable: true,
    modifierGroups: []
  }
];

/**
 * POST handler for /api/order
 * 
 * Workflow:
 * 1. Parse JSON body.
 * 2. Validate order against current menu (availability, prices, modifiers).
 * 3. If invalid, return 400 with validation errors.
 * 4. If valid, submit to external order system.
 * 5. Return success (200) or upstream error (502).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse Request Body
    let body: Partial<Order>;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Basic structural check before deep validation
    if (!body || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain a non-empty 'items' array." },
        { status: 400 }
      );
    }

    // 2. Validate Order Logic
    // We cast body to Order here because validateOrder handles the deep checks
    const validationResult = validateOrder(body as Order, CURRENT_MENU);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: "Order validation failed",
          details: validationResult.errors
        },
        { status: 400 }
      );
    }

    // 3. Submit to External System
    // Use the sanitized/recalculated order from the validator to ensure data integrity
    const submissionResult = await submitOrder(validationResult.validatedOrder);

    if (submissionResult.success) {
      return NextResponse.json(
        {
          message: "Order submitted successfully",
          data: submissionResult.data
        },
        { status: 200 }
      );
    } else {
      // Handle upstream errors (e.g., payment failed, kitchen offline)
      // We map the internal error code to an HTTP status
      const status = submissionResult.error.code === 'PAYMENT_DECLINED' ? 402 : 502;
      
      return NextResponse.json(
        {
          error: "Order submission failed",
          code: submissionResult.error.code,
          message: submissionResult.error.message,
          details: submissionResult.error.details
        },
        { status: status }
      );
    }

  } catch (error) {
    console.error("Unexpected API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
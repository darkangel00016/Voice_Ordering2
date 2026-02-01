import { NextRequest, NextResponse } from "next/server";
import { advanceConversation, ConversationError } from "@/lib/conversationEngine";
import { ConversationState } from "@/lib/types";

/**
 * Request body schema for the conversation endpoint.
 */
interface ConversationRequest {
  message: string;
  state: ConversationState;
}

/**
 * Response schema for the conversation endpoint.
 */
interface ConversationResponse {
  state: ConversationState;
  reply: string | null;
  error?: string;
}

/**
 * POST /api/conversation
 * 
 * Advances the conversation state based on user input.
 * 
 * Expects JSON body:
 * {
 *   "message": "User's text input",
 *   "state": { ...current ConversationState object... }
 * }
 * 
 * Returns JSON:
 * {
 *   "state": { ...updated ConversationState object... },
 *   "reply": "Assistant's text response"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ConversationResponse>> {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { state: {} as ConversationState, reply: null, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { message, state } = body as ConversationRequest;

    // Basic input validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { state: state || ({} as ConversationState), reply: null, error: "Message field is required and must be a string." },
        { status: 400 }
      );
    }

    if (!state || typeof state !== 'object' || !Array.isArray(state.history)) {
      return NextResponse.json(
        { state: state || ({} as ConversationState), reply: null, error: "Valid conversation state object is required." },
        { status: 400 }
      );
    }

    // 2. Advance the conversation using the engine
    const updatedState = await advanceConversation(state, message.trim());

    // 3. Extract the assistant's latest reply
    // The engine appends the assistant's response to the history
    const lastTurn = updatedState.history[updatedState.history.length - 1];
    const reply = lastTurn?.role === 'assistant' ? lastTurn.content : null;

    // 4. Return success response
    return NextResponse.json({
      state: updatedState,
      reply: reply
    }, { status: 200 });

  } catch (error) {
    console.error("API Error in /api/conversation:", error);

    // Handle known domain errors
    if (error instanceof ConversationError) {
      // Depending on the error code, we might want to return 400 or 422
      // For now, we treat engine validation failures as 400 Bad Request
      return NextResponse.json(
        { 
          state: {} as ConversationState, // In a real app, might want to return the original state here if available
          reply: null, 
          error: error.message 
        },
        { status: 400 }
      );
    }

    // Handle unexpected server errors
    return NextResponse.json(
      { 
        state: {} as ConversationState, 
        reply: null, 
        error: "Internal Server Error" 
      },
      { status: 500 }
    );
  }
}
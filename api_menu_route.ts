import { NextRequest, NextResponse } from "next/server";
import { fetchMenu, MenuFetchError } from "@/lib/menuClient";

/**
 * GET /api/menu
 * 
 * Retrieves the current menu items.
 * Proxies the request to the internal menu client which handles caching and upstream API calls.
 * 
 * Responses:
 * - 200 OK: Returns { items: MenuItem[] }
 * - 500 Internal Server Error: Returns { error: string, code: string }
 * - 503 Service Unavailable: Returns { error: string, code: string } for network issues
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Fetch menu data using the shared client
    // This handles caching and upstream communication internally
    const items = await fetchMenu();

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("API Route - Menu Fetch Failed:", error);

    // Handle known typed errors from the menu client
    if (error instanceof MenuFetchError) {
      const status = mapErrorToStatus(error.code);
      
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code 
        },
        { status }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      { 
        error: "An unexpected error occurred while retrieving the menu.",
        code: "INTERNAL_SERVER_ERROR" 
      },
      { status: 500 }
    );
  }
}

/**
 * Maps internal error codes to appropriate HTTP status codes.
 */
function mapErrorToStatus(code: string): number {
  switch (code) {
    case 'NETWORK_ERROR':
      return 503; // Service Unavailable - likely temporary connectivity issue
    case 'HTTP_ERROR':
      return 502; // Bad Gateway - upstream server returned an error
    case 'PARSE_ERROR':
      return 500; // Internal Server Error - data corruption or schema mismatch
    case 'VALIDATION_ERROR':
      return 500; // Internal Server Error - data invalid
    default:
      return 500;
  }
}
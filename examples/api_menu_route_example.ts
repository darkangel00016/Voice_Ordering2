/**
 * examples/consume_menu_api.ts
 * 
 * This example demonstrates how a client application (like a frontend component or external service)
 * would consume the API route defined in 'app/api/menu/route.ts'.
 * 
 * Since the module provided is a Next.js Route Handler, it runs on the server.
 * This example simulates a client making a fetch request to that endpoint.
 * 
 * Prerequisites:
 * - The Next.js server must be running (usually at http://localhost:3000)
 * - The route handler must be placed at 'app/api/menu/route.ts'
 */

// Define the expected shape of the response based on the API documentation
interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  // ... other fields
}

interface MenuApiResponse {
  items?: MenuItem[];
  error?: string;
  code?: string;
}

/**
 * Simulates a client-side function fetching the menu.
 * 
 * @param baseUrl - The base URL of the Next.js application (e.g., 'http://localhost:3000')
 */
async function getMenuFromApi(baseUrl: string = 'http://localhost:3000') {
  const endpoint = `${baseUrl}/api/menu`;
  console.log(`
Fetching menu from: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: MenuApiResponse = await response.json();

    if (!response.ok) {
      // Handle HTTP errors (non-2xx responses)
      // The API returns specific error codes (e.g., NETWORK_ERROR, HTTP_ERROR) in the body
      console.error(`
❌ API Error: ${response.status} ${response.statusText}`);
      console.error(`   Code: ${data.code}`);
      console.error(`   Message: ${data.error}`);
      return;
    }

    // Handle Success (200 OK)
    if (data.items) {
      console.log(`
✅ Success! Received ${data.items.length} menu items.`);
      data.items.forEach(item => {
        console.log(`   - ${item.name} ($${item.basePrice})`);
      });
    } else {
      console.warn('⚠️ Received 200 OK but no items found.');
    }

  } catch (error) {
    // Handle network errors (e.g., server down, DNS issues)
    console.error('❌ Network Error: Failed to reach the API endpoint.');
    console.error('   Ensure the Next.js server is running.');
    if (error instanceof Error) {
      console.error(`   Details: ${error.message}`);
    }
  }
}

// --- Usage Example ---

// 1. Ensure your Next.js app is running locally
// 2. Run this script (e.g., using ts-node)

if (require.main === module) {
  (async () => {
    console.log("--- Menu API Consumer Example ---");
    
    // Example: Successful fetch
    await getMenuFromApi();

    // Note: To test error handling, you would need to simulate server conditions
    // (e.g., stop the server, or mock the internal 'fetchMenu' to throw errors)
  })();
}
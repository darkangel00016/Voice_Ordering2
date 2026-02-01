/**
 * examples/menu_usage_example.ts
 * 
 * This example demonstrates how to use the Menu Client module to:
 * 1. Fetch menu data (triggering a network request or cache hit).
 * 2. Handle specific error types (Network vs API errors).
 * 3. Force refresh the cache.
 * 
 * Prerequisites:
 * - Ensure 'lib/types.ts' and 'lib/env.ts' exist as per the module dependencies.
 * - Run this with a TypeScript runner (e.g., ts-node).
 */

import { 
  fetchMenu, 
  clearMenuCache, 
  MenuFetchError, 
  fetchMockMenu 
} from '../lib/menuClient'; // Adjust path relative to your file structure

import { MenuItem } from '../lib/types';

/**
 * Helper to display menu items in the console.
 */
function printMenu(items: MenuItem[]) {
  console.log(`\n--- Menu (${items.length} items) ---`);
  items.forEach(item => {
    console.log(`[${item.id}] ${item.name} - $${item.basePrice.toFixed(2)}`);
    if (item.modifierGroups.length > 0) {
      console.log(`   Modifiers: ${item.modifierGroups.map(g => g.name).join(', ')}`);
    }
  });
  console.log('-----------------------------\n');
}

async function runMenuExample() {
  console.log('🚀 Starting Menu Client Example...');

  // --- Scenario 1: Basic Fetch (Cold Cache) ---
  try {
    console.log('1. Fetching menu (Cold Cache)...');
    // This will trigger the actual API call (or mock if configured)
    const items = await fetchMenu();
    printMenu(items);
  } catch (error) {
    handleError(error);
  }

  // --- Scenario 2: Fetching again (Hot Cache) ---
  try {
    console.log('2. Fetching menu again (Should be instant/cached)...');
    const start = Date.now();
    
    const cachedItems = await fetchMenu();
    
    const duration = Date.now() - start;
    console.log(`   Retrieved ${cachedItems.length} items in ${duration}ms.`);
  } catch (error) {
    handleError(error);
  }

  // --- Scenario 3: Forcing a Refresh ---
  try {
    console.log('3. Clearing cache and re-fetching...');
    clearMenuCache();
    
    const refreshedItems = await fetchMenu();
    console.log(`   Refreshed menu successfully. Count: ${refreshedItems.length}`);
  } catch (error) {
    handleError(error);
  }

  // --- Scenario 4: Using the Mock Fallback (Development Mode) ---
  // Useful if the backend isn't ready yet.
  try {
    console.log('4. Fetching explicit mock data...');
    const mockItems = await fetchMockMenu();
    printMenu(mockItems);
  } catch (error) {
    console.error('Mock fetch failed:', error);
  }
}

/**
 * Centralized error handling logic demonstrating how to use the custom error class.
 */
function handleError(error: unknown) {
  if (error instanceof MenuFetchError) {
    console.error(`❌ Menu Error [${error.code}]: ${error.message}`);
    
    // Specific handling based on error code
    if (error.code === 'NETWORK_ERROR') {
      console.warn('   -> Please check your internet connection.');
    } else if (error.code === 'HTTP_ERROR') {
      console.warn('   -> The server returned a bad status. Check API configuration.');
    }
    
    if (error.originalError) {
      console.error('   -> Original cause:', error.originalError);
    }
  } else {
    console.error('❌ Unexpected System Error:', error);
  }
}

// Execute the example
runMenuExample().catch(err => console.error('Fatal script error:', err));
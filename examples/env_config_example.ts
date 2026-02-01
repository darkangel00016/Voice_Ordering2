/**
 * Example usage of the Configuration Module.
 * 
 * This script demonstrates how to import the validated configuration
 * and handle potential startup errors if environment variables are missing.
 */

// 1. Setup: Simulate environment variables BEFORE importing the config module.
// In a real app, you would use `dotenv` or set these in your shell/deployment.
process.env.MENU_API_BASE_URL = 'https://api.restaurant.com/v1/menu';
process.env.ORDER_SUBMISSION_URL = 'https://api.restaurant.com/v1/orders';
process.env.AI_API_KEY = 'sk-12345-secret-key';
// AI_MODEL is optional, so we can omit it or set it.
process.env.AI_MODEL = 'gpt-4-turbo'; 

// 2. Import the config singleton.
// CRITICAL: This import will THROW an error immediately if required env vars are missing.
import { config } from '../lib/env';

async function startApplication() {
  try {
    console.log('🚀 Starting application...');

    // 3. Use the typed configuration values safely.
    console.log(`Connecting to Menu API at: ${config.menuApiBaseUrl}`);
    
    // Example: Using the optional value with a fallback
    const model = config.aiModel || 'gpt-3.5-default';
    console.log(`Initializing AI Service with model: ${model}`);

    // Simulate an API call using the config
    await simulateExternalCall(config.orderSubmissionUrl);

  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

async function simulateExternalCall(url: string) {
  console.log(`Sending data to ${url}...`);
  // ... implementation details
}

startApplication();
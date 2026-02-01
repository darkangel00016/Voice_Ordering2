/**
 * Configuration Module
 * 
 * Responsible for loading and validating environment variables required for
 * external integrations (Menu, Order, AI).
 */

export interface AppConfig {
  menuApiBaseUrl: string;
  orderSubmissionUrl: string;
  apiKey: string;
  aiApiKey: string;
  aiModel?: string;
}

/**
 * Validates that a specific environment variable exists.
 * Throws a descriptive error if the variable is missing or empty.
 * 
 * @param key - The name of the environment variable to check.
 * @returns The value of the environment variable.
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Configuration Error: Missing required environment variable "${key}".`);
  }
  return value;
}

/**
 * Retrieves an optional environment variable.
 * 
 * @param key - The name of the environment variable to check.
 * @returns The value of the environment variable or undefined.
 */
function getOptionalEnv(key: string): string | undefined {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    return undefined;
  }
  return value;
}

/**
 * Loads and validates the application configuration.
 * This function should be called early in the application lifecycle.
 */
function loadConfig(): AppConfig {
  return {
    menuApiBaseUrl: getRequiredEnv('MENU_API_URL'),
    orderSubmissionUrl: getRequiredEnv('ORDER_SUBMISSION_URL'),
    apiKey: getRequiredEnv('API_KEY'),
    aiApiKey: getRequiredEnv('AI_API_KEY'),
    aiModel: getOptionalEnv('AI_MODEL'),
  };
}

// Export a singleton configuration object.
// This ensures validation runs immediately when this module is imported.
export const config: AppConfig = loadConfig();

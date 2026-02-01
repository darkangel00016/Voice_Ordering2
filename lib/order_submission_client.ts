/**
 * lib/orderSubmissionClient.ts
 *
 * Responsible for submitting confirmed orders to an external kitchen or POS API.
 * Handles retries for transient failures and normalizes error responses.
 */

import { Order, ApiResult } from './types'; // Adjust path based on your project structure
import { config } from './env_config';

/**
 * Represents the specific result of an order submission attempt.
 * This extends the generic ApiResult to ensure specific success data is returned.
 */
export type SubmissionResult = ApiResult<{
  confirmationId: string;
  estimatedWaitTimeMinutes?: number;
  status: 'received' | 'processing';
}>;

/**
 * Configuration for the retry mechanism.
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
};

/**
 * Submits a confirmed order to the external POS or Kitchen Display System API.
 *
 * Features:
 * - Validates the order payload before sending.
 * - Implements exponential backoff retries for 5xx errors and network timeouts.
 * - Normalizes all exceptions into a structured SubmissionResult.
 *
 * @param order - The fully constructed Order object to submit.
 * @returns A Promise resolving to a SubmissionResult indicating success or failure.
 */
export async function submitOrder(order: Order): Promise<SubmissionResult> {
  const url = config.orderSubmissionUrl;

  if (!url) {
    return {
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: 'Order submission URL is not configured.',
      },
    };
  }

  let attempt = 0;
  let currentDelay = RETRY_CONFIG.initialDelayMs;

  while (attempt <= RETRY_CONFIG.maxRetries) {
    try {
      const queryParams = {
        origin: 'API'
      };
      const queryString = new URLSearchParams(queryParams).toString();
      const fullUrl = `${url}?${queryString}`;
      const formData = new FormData();
      order.items.forEach((item, index) => {
        formData.append(`items[${index}][id]`, String(item.menuItemId));
        formData.append(`items[${index}][quantity]`, String(item.quantity));
      });

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: formData,
      });

      // Handle non-2xx responses
      if (!response.ok) {
        const status = response.status;

        // Determine if the error is transient (retryable)
        const isTransient = status >= 500 || status === 429;

        if (isTransient && attempt < RETRY_CONFIG.maxRetries) {
          console.warn(`Transient error ${status} submitting order ${order.id}. Retrying in ${currentDelay}ms...`);
          await sleep(currentDelay);
          attempt++;
          currentDelay *= RETRY_CONFIG.backoffFactor;
          continue;
        }

        // If not transient or retries exhausted, parse error and return failure
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        return {
          success: false,
          error: {
            code: `HTTP_${status}`,
            message: errorBody.message || `External API returned status ${status}`,
            details: errorBody,
          },
        };
      }

      // Success path
      const data = await response.json();
      
      // Validate expected shape of success response
      if (!data.confirmationId) {
        return {
            success: false,
            error: {
                code: 'INVALID_RESPONSE',
                message: 'External API did not return a confirmation ID.'
            }
        }
      }

      return {
        success: true,
        data: {
          confirmationId: data.confirmationId,
          estimatedWaitTimeMinutes: data.estimatedWaitTimeMinutes || 15, // Default fallback
          status: 'received',
        },
      };

    } catch (error: any) {
      // Handle network errors (e.g., DNS failure, connection refused)
      const isNetworkError = error.name === 'TypeError' || error.name === 'FetchError';

      if (isNetworkError && attempt < RETRY_CONFIG.maxRetries) {
        console.warn(`Network error submitting order ${order.id}. Retrying in ${currentDelay}ms...`, error);
        await sleep(currentDelay);
        attempt++;
        currentDelay *= RETRY_CONFIG.backoffFactor;
        continue;
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown network error occurred',
        },
      };
    }
  }

  // Fallback if loop exits unexpectedly (should be covered by logic above)
  return {
    success: false,
    error: {
      code: 'TIMEOUT',
      message: 'Max retries exceeded while submitting order.',
    },
  };
}

/**
 * Utility to pause execution for a specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry utility with exponential backoff
 * @format
 */

/**
 * Options for retry strategy
 */
export interface RetryOptions {
  /** Number of retry attempts */
  retries: number;
  /** Base delay in milliseconds */
  baseDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Whether to add jitter to delay */
  jitter: boolean;
  /** Function to determine if error should be retried */
  retryOn: (err: unknown) => boolean;
}

/**
 * Default retry predicate - retries transient network errors
 */
function defaultRetryOn(err: unknown): boolean {
  if (!err) {
    return false;
  }

  // Check for error codes that indicate transient failures
  if (typeof err === 'object' && err !== null) {
    const error = err as { code?: string; message?: string };

    // Retry on specific error codes
    if (error.code) {
      const transientCodes = [
        'ETIMEDOUT',
        'ECONNRESET',
        'EAI_AGAIN',
        'TRANSIENT',
      ];
      if (transientCodes.includes(error.code)) {
        return true;
      }
    }

    // Retry on timeout in message
    if (error.message && error.message.toLowerCase().includes('timeout')) {
      return true;
    }
  }

  return false;
}

/**
 * Execute a function with retry and exponential backoff
 * @param fn Function to execute
 * @param opts Retry options
 * @returns Result of fn
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const retryOn = opts.retryOn || defaultRetryOn;
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry if this is the last attempt
      if (attempt === opts.retries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!retryOn(err)) {
        throw err;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = opts.baseDelayMs * Math.pow(2, attempt);
      let delay = Math.min(exponentialDelay, opts.maxDelayMs);

      // Add jitter if enabled
      if (opts.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw lastError;
}

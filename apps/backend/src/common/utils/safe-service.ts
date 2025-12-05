import { AppError } from '../errors/app-error';

/**
 * Wrapper for service functions that automatically catches and wraps errors
 * @param fn - Async function to execute
 * @param errorMessage - Optional custom error message
 * @param errorCode - Optional custom error code
 */
export async function safeService<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
  errorCode?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Wrap in AppError
    const message =
      errorMessage ||
      (error instanceof Error ? error.message : 'Internal service error');
    const code = errorCode || 'SERVICE_FAIL';

    throw new AppError(message, 500, code, error);
  }
}

/**
 * Wrapper for service functions with custom error handling
 */
export async function safeServiceWithError<T>(
  fn: () => Promise<T>,
  errorHandler: (error: unknown) => AppError
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw errorHandler(error);
  }
}



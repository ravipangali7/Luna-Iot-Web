/**
 * Utility functions for handling API errors and displaying them to users
 */

export interface ApiError {
  response?: {
    data?: {
      data?: Record<string, string[]>;
      message?: string;
    };
  };
}

/**
 * Extracts and formats error messages from API responses
 * @param err - The error object from catch block
 * @returns Formatted error message string
 */
export const getErrorMessage = (err: unknown): string => {
  const error = err as ApiError;
  
  // Check for field-specific validation errors
  if (error.response?.data?.data) {
    const fieldErrors = error.response.data.data;
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    return errorMessages;
  }
  
  // Return general error message
  return error.response?.data?.message || 'An unexpected error occurred';
};

/**
 * Checks if the error contains field-specific validation errors
 * @param err - The error object from catch block
 * @returns True if error contains field validation errors
 */
export const hasValidationErrors = (err: unknown): boolean => {
  const error = err as ApiError;
  return !!(error.response?.data?.data);
};

/**
 * Gets the error title based on error type
 * @param err - The error object from catch block
 * @returns Appropriate error title
 */
export const getErrorTitle = (err: unknown): string => {
  return hasValidationErrors(err) ? 'Validation Error' : 'Error';
};

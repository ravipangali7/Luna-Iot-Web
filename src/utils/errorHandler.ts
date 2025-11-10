/**
 * Utility functions for handling API errors and displaying them to users
 */

export interface ApiError {
  response?: {
    status?: number;
    data?: {
      data?: Record<string, string[]>;
      message?: string;
      error?: string;
    };
  };
  request?: unknown;
  message?: string;
}

/**
 * Extracts and formats error messages from API responses
 * @param err - The error object from catch block (typically an axios error)
 * @returns Formatted error message string
 */
export const getErrorMessage = (err: unknown): string => {
  // Type guard to check if it's an axios-like error
  const isAxiosError = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null;
  };

  if (!isAxiosError(err)) {
    // If it's a regular Error object, return its message
    if (err instanceof Error) {
      return err.message;
    }
    return 'An unexpected error occurred';
  }

  // Server responded with error status (4xx, 5xx)
  if (err.response) {
    const responseData = err.response.data;
    
    // Check for field-specific validation errors (e.g., { data: { publicKey: ["error message"] } })
    if (responseData?.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
      const fieldErrors = responseData.data as Record<string, string[]>;
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, messages]) => {
          // Format field name to be more readable (e.g., "publicKey" -> "Public Key")
          const formattedField = field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
          const messagesList = Array.isArray(messages) ? messages.join(', ') : String(messages);
          return `${formattedField}: ${messagesList}`;
        })
        .join('\n');
      
      // If we have field errors, return them; otherwise fall through to general message
      if (errorMessages.trim()) {
        return errorMessages;
      }
    }
    
    // Return general error message from response
    if (responseData?.message) {
      return responseData.message;
    }
    
    if (responseData?.error) {
      return responseData.error;
    }
    
    // If we have a status code but no message, provide a generic one
    const status = err.response.status;
    if (typeof status === 'number') {
      if (status >= 400 && status < 500) {
        return `Client error: Request failed with status code ${status}`;
      } else if (status >= 500) {
        return `Server error: Request failed with status code ${status}`;
      }
    }
  }
  
  // Request was made but no response received (network error)
  if (err.request) {
    return 'Network error: Unable to connect to server. Please check your internet connection.';
  }
  
  // Other error cases
  if (err.message) {
    // If it's an axios error message like "Request failed with status code 400",
    // we should have caught it above, but if not, try to provide context
    if (err.message.includes('status code')) {
      return err.message;
    }
    return err.message;
  }
  
  return 'An unexpected error occurred';
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

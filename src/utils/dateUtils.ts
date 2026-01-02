/**
 * Date formatting utilities
 */

/**
 * Format expiry date as relative time remaining
 * Smart format: months if >30 days, days if <30 days, hours if <1 day
 * 
 * @param expiryDate - Expiry date string (ISO format or date string)
 * @returns Formatted string like "X months left", "X days left", "X hours left", or "Expired"
 */
export const formatExpiryTimeRemaining = (expiryDate: string | null | undefined): string => {
  if (!expiryDate) {
    return 'N/A';
  }

  try {
    const expiry = new Date(expiryDate);
    const now = new Date();

    // Check if date is valid
    if (isNaN(expiry.getTime())) {
      return 'Invalid date';
    }

    const diffInSeconds = Math.floor((expiry.getTime() - now.getTime()) / 1000);

    // If already expired
    if (diffInSeconds < 0) {
      return 'Expired';
    }

    // Calculate time units
    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);

    // Smart formatting based on time remaining
    if (days >= 30) {
      // More than 30 days - show in months and days
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      
      if (remainingDays > 0) {
        return `${months} month${months !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''} left`;
      } else {
        return `${months} month${months !== 1 ? 's' : ''} left`;
      }
    } else if (days > 0) {
      // Less than 30 days - show in days
      return `${days} day${days !== 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      // Less than 1 day - show in hours
      return `${hours} hour${hours !== 1 ? 's' : ''} left`;
    } else if (minutes > 0) {
      // Less than 1 hour - show in minutes
      return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
    } else {
      // Less than 1 minute
      return 'Expiring soon';
    }
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format MB expiry date as "y, m, d, h left to expire"
 * Shows years, months, days, and hours remaining
 * 
 * @param expiryDate - Expiry date string (ISO format or date string)
 * @returns Formatted string like "1y, 2m, 5d, 3h left to expire" or "Expired"
 */
export const formatMbExpiryTimeRemaining = (expiryDate: string | null | undefined): string => {
  if (!expiryDate) {
    return 'N/A';
  }

  try {
    const expiry = new Date(expiryDate);
    const now = new Date();

    // Check if date is valid
    if (isNaN(expiry.getTime())) {
      return 'Invalid date';
    }

    const diffInSeconds = Math.floor((expiry.getTime() - now.getTime()) / 1000);

    // If already expired
    if (diffInSeconds < 0) {
      return 'Expired';
    }

    // Calculate time units
    const years = Math.floor(diffInSeconds / (365 * 24 * 3600));
    const months = Math.floor((diffInSeconds % (365 * 24 * 3600)) / (30 * 24 * 3600));
    const days = Math.floor((diffInSeconds % (30 * 24 * 3600)) / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);

    // Build formatted string
    const parts: string[] = [];
    
    if (years > 0) {
      parts.push(`${years}${years === 1 ? 'y' : 'y'}`);
    }
    if (months > 0) {
      parts.push(`${months}${months === 1 ? 'm' : 'm'}`);
    }
    if (days > 0) {
      parts.push(`${days}${days === 1 ? 'd' : 'd'}`);
    }
    if (hours > 0 || parts.length === 0) {
      parts.push(`${hours}${hours === 1 ? 'h' : 'h'}`);
    }

    if (parts.length === 0) {
      return 'Expiring soon';
    }

    return `${parts.join(', ')} left to expire`;
  } catch (error) {
    return 'Invalid date';
  }
};

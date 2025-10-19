/**
 * Coordinate utility functions
 * Handles coordinate precision and validation
 */

/**
 * Rounds a coordinate value to the specified number of decimal places
 * @param value - The coordinate value to round
 * @param decimalPlaces - Number of decimal places (default: 8)
 * @returns Rounded coordinate value
 */
export const roundCoordinate = (value: number, decimalPlaces: number = 8): number => {
  if (isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return Math.round(value * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
};

/**
 * Validates if a latitude value is within valid range (-90 to 90)
 * @param latitude - Latitude value to validate
 * @returns True if valid, false otherwise
 */
export const isValidLatitude = (latitude: number): boolean => {
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

/**
 * Validates if a longitude value is within valid range (-180 to 180)
 * @param longitude - Longitude value to validate
 * @returns True if valid, false otherwise
 */
export const isValidLongitude = (longitude: number): boolean => {
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

/**
 * Validates and rounds coordinates
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @param decimalPlaces - Number of decimal places (default: 8)
 * @returns Object with validated and rounded coordinates
 */
export const validateAndRoundCoordinates = (
  latitude: number, 
  longitude: number, 
  decimalPlaces: number = 8
): { latitude: number; longitude: number; isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!isValidLatitude(latitude)) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }
  
  if (!isValidLongitude(longitude)) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }
  
  const roundedLatitude = roundCoordinate(latitude, decimalPlaces);
  const roundedLongitude = roundCoordinate(longitude, decimalPlaces);
  
  return {
    latitude: roundedLatitude,
    longitude: roundedLongitude,
    isValid: errors.length === 0,
    errors
  };
};

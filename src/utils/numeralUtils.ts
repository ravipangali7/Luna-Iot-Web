/**
 * Utility functions for normalizing between Nepali (Devanagari) and English numerals.
 * Enables bidirectional search functionality.
 */

// Numeral mapping: English -> Nepali
const ENGLISH_TO_NEPALI: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

// Numeral mapping: Nepali -> English
const NEPALI_TO_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(ENGLISH_TO_NEPALI).map(([key, value]) => [value, key])
);

/**
 * Convert Nepali numerals to English numerals in the given text.
 * 
 * @param text - Input string that may contain Nepali numerals
 * @returns String with Nepali numerals converted to English numerals
 * 
 * @example
 * normalizeToEnglish("६७८९") // Returns "6789"
 */
export function normalizeToEnglish(text: string): string {
  if (!text) {
    return text;
  }

  return text
    .split('')
    .map((char) => NEPALI_TO_ENGLISH[char] || char)
    .join('');
}

/**
 * Convert English numerals to Nepali numerals in the given text.
 * 
 * @param text - Input string that may contain English numerals
 * @returns String with English numerals converted to Nepali numerals
 * 
 * @example
 * normalizeToNepali("6789") // Returns "६७८९"
 */
export function normalizeToNepali(text: string): string {
  if (!text) {
    return text;
  }

  return text
    .split('')
    .map((char) => ENGLISH_TO_NEPALI[char] || char)
    .join('');
}

/**
 * Generate both English and Nepali normalized versions of the input text.
 * This enables bidirectional search - searching with either numeral system
 * will find matches regardless of which system is used in stored data.
 * 
 * @param text - Input string that may contain numerals in either system
 * @returns Tuple of [englishNormalized, nepaliNormalized] versions
 * 
 * @example
 * normalizeNumeralsBidirectional("6789") // Returns ["6789", "६७८९"]
 * normalizeNumeralsBidirectional("६७८९") // Returns ["6789", "६७८९"]
 */
export function normalizeNumeralsBidirectional(text: string): [string, string] {
  if (!text) {
    return [text, text];
  }

  const englishVersion = normalizeToEnglish(text);
  const nepaliVersion = normalizeToNepali(text);

  return [englishVersion, nepaliVersion];
}

/**
 * Get all search variants for a given text (original, English normalized, Nepali normalized).
 * Useful for building search queries that match regardless of numeral system used.
 * 
 * @param text - Input search query
 * @returns Array of search variants (original, english, nepali)
 * 
 * @example
 * getSearchVariants("6789") // Returns ["6789", "6789", "६७८९"]
 * getSearchVariants("६७८९") // Returns ["६७८९", "6789", "६७८९"]
 */
export function getSearchVariants(text: string): string[] {
  if (!text) {
    return [text];
  }

  const [englishVersion, nepaliVersion] = normalizeNumeralsBidirectional(text);

  // Return unique variants
  const variants = new Set([text, englishVersion, nepaliVersion]);
  return Array.from(variants);
}


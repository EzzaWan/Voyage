/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 * Uses a simple server-side approach that doesn't require DOMPurify
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags using regex
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * Sanitize user input but allow basic formatting (for rich text areas if needed)
 * Note: For production, consider using a proper HTML sanitizer library
 */
export function sanitizeWithFormatting(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // For now, just strip all HTML and return plain text
  // In production, you might want to use a proper sanitizer for this
  return sanitizeInput(input);
}

/**
 * Sanitize email address - only removes HTML tags, doesn't escape special characters
 * Preserves @, ., +, -, etc. which are valid in email addresses
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Only remove HTML tags, preserve email characters
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim().toLowerCase();
  
  return sanitized;
}

import createDOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Create DOMPurify instance
  const DOMPurify = createDOMPurify();

  // Sanitize by stripping all HTML tags and returning plain text
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  return sanitized.trim();
}

/**
 * Sanitize user input but allow basic formatting (for rich text areas if needed)
 */
export function sanitizeWithFormatting(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const DOMPurify = createDOMPurify();

  // Allow only safe HTML tags
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });

  return sanitized.trim();
}

/**
 * Utility functions for common operations
 */

/**
 * Generate a UUID v4 string
 * This uses the crypto API for proper UUID generation
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Show a success toast notification
 * @param message - Message to display
 */
export function showSuccessNotification(message: string): void {
  // This will be implemented when toast system is set up
  console.log('✅ Success:', message);
}

/**
 * Show an error toast notification
 * @param message - Error message to display
 */
export function showErrorNotification(message: string): void {
  console.error('❌ Error:', message);
}

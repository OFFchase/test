/**
 * Generate a unique-ish id. Uses crypto.randomUUID when available
 * (secure contexts only — https, localhost) and falls back to a
 * Math.random-based RFC4122 v4 string otherwise. Good enough for
 * client-side React keys.
 */
export function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

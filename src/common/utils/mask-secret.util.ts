/**
 * Masks a secret value, revealing only the last 4 characters.
 *
 * @example
 * maskSecret('sk_live_abc123xyz456') // '••••••••x456'
 * maskSecret('short')                // '••••••••hort'
 * maskSecret('ab')                   // '••••••••ab'
 * maskSecret('')                     // '••••••••'
 */
export function maskSecret(value: string): string {
  const MASK = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'; // 8 bullet chars
  const VISIBLE_CHARS = 4;

  if (value.length <= VISIBLE_CHARS) {
    return `${MASK}${value}`;
  }

  return `${MASK}${value.slice(-VISIBLE_CHARS)}`;
}

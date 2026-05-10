/**
 * Generates a URL-safe slug from a given string.
 *
 * Converts to lowercase, replaces spaces and special characters with hyphens,
 * collapses consecutive hyphens, and trims leading/trailing hyphens.
 *
 * @example
 * generateSlug('Hello World!')  // 'hello-world'
 * generateSlug('My  Cool--App') // 'my-cool-app'
 * generateSlug('café & résumé') // 'caf-r-sum'
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')    // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

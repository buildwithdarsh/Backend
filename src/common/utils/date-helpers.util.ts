/**
 * Returns the start of the day (00:00:00.000) for the given date.
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Returns the end of the day (23:59:59.999) for the given date.
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Adds the specified number of days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds the specified number of minutes to a date.
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Adds the specified number of hours to a date.
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Returns whether the given date is in the past.
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Returns whether the given date is in the future.
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Returns the difference between two dates in milliseconds.
 */
export function diffMs(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime());
}

/**
 * Returns the difference between two dates in seconds.
 */
export function diffSeconds(a: Date, b: Date): number {
  return Math.floor(diffMs(a, b) / 1000);
}

/**
 * Returns the difference between two dates in minutes.
 */
export function diffMinutes(a: Date, b: Date): number {
  return Math.floor(diffMs(a, b) / (1000 * 60));
}

/**
 * Builds a Prisma-compatible date range filter object.
 * Useful for filtering records between two optional date boundaries.
 *
 * @example
 * const filter = buildDateFilter('2024-01-01', '2024-12-31');
 * // { gte: Date, lte: Date }
 */
export function buildDateFilter(
  startDate?: string,
  endDate?: string,
): { gte?: Date; lte?: Date } | undefined {
  if (!startDate && !endDate) {
    return undefined;
  }

  const filter: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    filter.gte = startOfDay(new Date(startDate));
  }
  if (endDate) {
    filter.lte = endOfDay(new Date(endDate));
  }

  return filter;
}

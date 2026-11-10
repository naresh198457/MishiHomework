// Local calendar date as YYYY-MM-DD (not UTC), so "today" matches the child's day.
export const localDate = (d: Date = new Date()): string => d.toLocaleDateString("en-CA");

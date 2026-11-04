import { MIN_MINUTE, MAX_MINUTE, type Interval } from "@/lib/availability";
import { parseIntegerInput, clampToRange, type ParsedNumber } from "@/lib/parse";

export interface IntervalField {
  start: string;
  end: string;
}

export type BookingsParseResult =
  | { ok: true; bookings: Interval[] }
  | { ok: false; errors: string[] };

export type RequestParseResult =
  | { ok: true; start: number; end: number }
  | { ok: false; errors: string[] };

function parseMinute(raw: string, label: string): ParsedNumber {
  return clampToRange(parseIntegerInput(raw), MIN_MINUTE, MAX_MINUTE, label);
}

// Format checks only. The booking rules themselves are applied by checkAvailability.
export function parseBookingFields(fields: IntervalField[]): BookingsParseResult {
  const errors: string[] = [];
  const bookings: Interval[] = [];

  fields.forEach((row, i) => {
    const start = parseMinute(row.start, `Booking ${i + 1} start`);
    const end = parseMinute(row.end, `Booking ${i + 1} end`);
    if (!start.ok || start.value === null) {
      errors.push(`Booking ${i + 1} start: ${start.error}`);
      return;
    }
    if (!end.ok || end.value === null) {
      errors.push(`Booking ${i + 1} end: ${end.error}`);
      return;
    }
    if (start.value >= end.value) {
      errors.push(`Booking ${i + 1}: start (${start.value}) must be less than end (${end.value}).`);
      return;
    }
    bookings.push({ start: start.value, end: end.value });
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, bookings };
}

export function parseRequestTimes(startRaw: string, endRaw: string): RequestParseResult {
  const start = parseMinute(startRaw, "Start");
  const end = parseMinute(endRaw, "End");
  const errors: string[] = [];
  if (!start.ok || start.value === null) errors.push(`Start: ${start.error}`);
  if (!end.ok || end.value === null) errors.push(`End: ${end.error}`);

  if (start.value === null || end.value === null) return { ok: false, errors };
  return { ok: true, start: start.value, end: end.value };
}

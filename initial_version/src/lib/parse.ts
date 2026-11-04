// Shared parsing/validation helpers for numeric minute inputs.
// We never silently round fractional inputs or treat empty input as zero.

export interface ParsedNumber {
  ok: boolean;
  value: number | null;
  error: string | null;
}

// Parse a string field into an integer number.
// - Empty string -> error (we do NOT coerce to 0).
// - Non-numeric / fractional -> error (we do NOT round).
export function parseIntegerInput(raw: string): ParsedNumber {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, value: null, error: "This field is required." };
  }
  // Allow an optional leading sign and digits only (no decimals, no exponent).
  if (!/^[+-]?\d+$/.test(trimmed)) {
    return { ok: false, value: null, error: "Enter a whole number (no decimals)." };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return { ok: false, value: null, error: "Number is too large." };
  }
  if (Math.floor(n) !== n) {
    return { ok: false, value: null, error: "Enter a whole number (no decimals)." };
  }
  return { ok: true, value: n, error: null };
}

export function clampToRange(
  parsed: ParsedNumber,
  min: number,
  max: number,
  label: string,
): ParsedNumber {
  if (!parsed.ok || parsed.value === null) return parsed;
  if (parsed.value < min || parsed.value > max) {
    return {
      ok: false,
      value: null,
      error: `${label} must be between ${min} and ${max} (inclusive).`,
    };
  }
  return parsed;
}

// Format minutes-after-midnight as a friendly 24h HH:MM string for display.
export function formatTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 1440) return "--:--";
  const m = Math.round(minutes);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

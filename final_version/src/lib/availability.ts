// Pure availability-checking logic for a single room.
// No side effects, no mutation of inputs. Easy to inspect and unit-test.

export interface Interval {
  start: number; // integer minutes after midnight (0..1440)
  end: number;   // integer minutes after midnight (0..1440)
}

export interface AvailabilityInput {
  now: number;            // integer minutes after midnight (demo "current time")
  blocked: boolean;       // room-level block flag
  existing: Interval[];   // existing bookings (treated as read-only)
  candidateStart: number; // proposed start (integer minutes after midnight)
  candidateEnd: number;   // proposed end (integer minutes after midnight)
}

export type AvailabilityStatus = "available" | "unavailable";

export interface AvailabilityResult {
  status: AvailabilityStatus;
  reasons: string[]; // human-readable list of why it is unavailable (empty when available)
}

export const MIN_MINUTE = 0;
export const MAX_MINUTE = 1440;
export const MAX_DURATION = 120; // AC2: <= 120, exactly 120 allowed

function isInteger(value: number): boolean {
  return Number.isFinite(value) && Math.floor(value) === value;
}

// Overlap test (AC4): touching endpoints are allowed, so strict inequalities.
// Two intervals [s1,e1) and [s2,e2) overlap iff s1 < e2 && s2 < e1.
function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

// Pure check. Never mutates `existing` or any input field.
export function checkAvailability(input: AvailabilityInput): AvailabilityResult {
  const { now, blocked, existing, candidateStart, candidateEnd } = input;
  const reasons: string[] = [];

  // --- Input sanity (demo-data + candidate should already be validated upstream,
  //     but we still guard so the core rules are enforced here too). ---

  if (!isInteger(now) || now < MIN_MINUTE || now > MAX_MINUTE) {
    reasons.push(`Demo "now" (${now}) must be an integer between ${MIN_MINUTE} and ${MAX_MINUTE}.`);
  }

  // AC1: start and end are integer minutes after midnight, 0 <= start < end <= 1440.
  if (!isInteger(candidateStart) || candidateStart < MIN_MINUTE || candidateStart > MAX_MINUTE) {
    reasons.push(`Start (${candidateStart}) must be an integer between ${MIN_MINUTE} and ${MAX_MINUTE}.`);
  }
  if (!isInteger(candidateEnd) || candidateEnd < MIN_MINUTE || candidateEnd > MAX_MINUTE) {
    reasons.push(`End (${candidateEnd}) must be an integer between ${MIN_MINUTE} and ${MAX_MINUTE}.`);
  }

  if (
    isInteger(candidateStart) && isInteger(candidateEnd) &&
    candidateStart >= candidateEnd
  ) {
    reasons.push(`Start (${candidateStart}) must be strictly less than end (${candidateEnd}).`);
  }

  // AC1 (continued): start must be strictly after now.
  if (
    isInteger(candidateStart) && isInteger(now) &&
    now >= MIN_MINUTE && now <= MAX_MINUTE &&
    candidateStart >= MIN_MINUTE && candidateStart <= MAX_MINUTE &&
    candidateStart <= now
  ) {
    reasons.push(`Start (${candidateStart}) must be strictly after now (${now}).`);
  }

  // AC2: duration must be <= 120 minutes. Exactly 120 is allowed.
  if (
    isInteger(candidateStart) && isInteger(candidateEnd) &&
    candidateStart < candidateEnd
  ) {
    const duration = candidateEnd - candidateStart;
    if (duration > MAX_DURATION) {
      reasons.push(`Duration (${duration} min) exceeds the ${MAX_DURATION}-minute maximum.`);
    }
  }

  // AC3: reject every request when the room is blocked.
  if (blocked) {
    reasons.push("The room is currently blocked. Availability requests are rejected while it is blocked.");
  }

  // AC4: reject overlap with any existing booking. Touching endpoints are allowed.
  if (
    isInteger(candidateStart) && isInteger(candidateEnd) &&
    candidateStart < candidateEnd
  ) {
    for (let i = 0; i < existing.length; i++) {
      const b = existing[i];
      // Defensively validate each existing interval shape too.
      if (!isInteger(b.start) || !isInteger(b.end) || b.start >= b.end) {
        reasons.push(`Existing booking #${i + 1} is malformed.`);
        continue;
      }
      if (overlaps({ start: candidateStart, end: candidateEnd }, b)) {
        reasons.push(
          `Overlaps existing booking [${b.start}, ${b.end}] (minutes after midnight).`,
        );
      }
    }
  }

  return reasons.length === 0
    ? { status: "available", reasons: [] }
    : { status: "unavailable", reasons };
}

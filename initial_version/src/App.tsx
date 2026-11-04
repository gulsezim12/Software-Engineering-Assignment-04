import { useMemo, useState } from "react";
import {
  Clock,
  DoorClosed,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Info,
  CalendarClock,
} from "lucide-react";
import {
  checkAvailability,
  type Interval,
  type AvailabilityResult,
  MIN_MINUTE,
  MAX_MINUTE,
} from "@/lib/availability";
import { parseIntegerInput, clampToRange, formatTime } from "@/lib/parse";

const ROOM_NAME = "Study Room A";

// --- Default demo data (per assignment) ---
const DEFAULT_NOW = 540; // 09:00
const DEFAULT_BLOCKED = false;
const DEFAULT_EXISTING: Interval[] = [{ start: 600, end: 660 }]; // 10:00 - 11:00

// Single empty interval row template for the demo-data editor.
const EMPTY_INTERVAL: { start: string; end: string } = { start: "", end: "" };

interface IntervalField {
  start: string;
  end: string;
}

export default function App() {
  // --- Candidate request inputs (string state so empty stays empty, not 0) ---
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");

  // --- Demo-data panel state ---
  const [nowStr, setNowStr] = useState(String(DEFAULT_NOW));
  const [blocked, setBlocked] = useState(DEFAULT_BLOCKED);
  const [intervalFields, setIntervalFields] = useState<IntervalField[]>(
    DEFAULT_EXISTING.map((i) => ({ start: String(i.start), end: String(i.end) })),
  );

  // --- Result of the last check (never mutates existing bookings) ---
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  // Validation errors that block running the check (candidate + demo data).
  const [candidateErrors, setCandidateErrors] = useState<string[]>([]);
  const [demoErrors, setDemoErrors] = useState<string[]>([]);

  // Parse + validate demo data on every render (cheap, pure).
  const demoState = useMemo(
    () => buildDemoState(nowStr, blocked, intervalFields),
    [nowStr, blocked, intervalFields],
  );

  function handleAddInterval() {
    setIntervalFields((prev) => [...prev, { ...EMPTY_INTERVAL }]);
  }

  function handleRemoveInterval(index: number) {
    setIntervalFields((prev) => prev.filter((_, i) => i !== index));
  }

  function handleIntervalChange(index: number, field: "start" | "end", value: string) {
    setIntervalFields((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function handleResetDemo() {
    setNowStr(String(DEFAULT_NOW));
    setBlocked(DEFAULT_BLOCKED);
    setIntervalFields(DEFAULT_EXISTING.map((i) => ({ start: String(i.start), end: String(i.end) })));
    setResult(null);
    setCandidateErrors([]);
    setDemoErrors([]);
  }

  function handleCheck() {
    setCandidateErrors([]);
    setDemoErrors([]);

    // 1) Validate demo data first. If invalid, do not run the check.
    if (!demoState.ok) {
      setDemoErrors(demoState.errors);
      setResult(null);
      return;
    }

    // 2) Validate candidate input format only (empty, fractional, out of range).
    //    AC logic (start < end, start > now, duration <= 120, blocked, overlap)
    //    is delegated to checkAvailability to avoid duplicated rules drifting.
    const startParsed = clampToRange(
      parseIntegerInput(startStr),
      MIN_MINUTE,
      MAX_MINUTE,
      "Start",
    );
    const endParsed = clampToRange(
      parseIntegerInput(endStr),
      MIN_MINUTE,
      MAX_MINUTE,
      "End",
    );

    const errors: string[] = [];
    if (!startParsed.ok) errors.push(`Start: ${startParsed.error}`);
    if (!endParsed.ok) errors.push(`End: ${endParsed.error}`);

    if (errors.length > 0) {
      setCandidateErrors(errors);
      setResult(null);
      return;
    }

    // 3) Run the pure check. Existing bookings are passed by value (never mutated).
    const computed = checkAvailability({
      now: demoState.now,
      blocked: demoState.blocked,
      existing: demoState.existing,
      candidateStart: startParsed.value as number,
      candidateEnd: endParsed.value as number,
    });
    setResult(computed);
  }

  const existingForDisplay = demoState.ok ? demoState.existing : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <DoorClosed className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Smart Campus Room Availability
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Check whether a room is free for a proposed time. This tool does not make bookings.
              </p>
            </div>
          </div>
        </header>

        {/* Room status card */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Selected room
              </p>
              <h2 className="mt-1 text-xl font-bold">{ROOM_NAME}</h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                blocked
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {blocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {blocked ? "Blocked" : "Open"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock className="h-3.5 w-3.5" /> Current demo time (now)
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {demoState.ok ? `${demoState.now} min` : "— min"}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {demoState.ok ? `(${formatTime(demoState.now)})` : ""}
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" /> Existing bookings
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {existingForDisplay.length}
              </p>
            </div>
          </div>

          {existingForDisplay.length > 0 && (
            <ul className="mt-4 space-y-2">
              {existingForDisplay.map((b, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-700">Booking #{i + 1}</span>
                  <span className="tabular-nums text-slate-600">
                    {b.start}–{b.end} min{" "}
                    <span className="text-slate-400">
                      ({formatTime(b.start)}–{formatTime(b.end)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Candidate request */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-bold">Check a time</h3>
          <p className="mt-1 text-sm text-slate-600">
            Enter times in <strong>minutes after midnight</strong> (0 to 1440, whole numbers only).
            End can be 1440. Maximum duration is 120 minutes.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Start (minutes after midnight)"
              value={startStr}
              onChange={setStartStr}
              placeholder="e.g. 540"
            />
            <NumberField
              label="End (minutes after midnight)"
              value={endStr}
              onChange={setEndStr}
              placeholder="e.g. 600"
            />
          </div>

          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="flex items-center gap-1.5 font-medium text-slate-700">
              <Info className="h-3.5 w-3.5" /> Quick reference
            </p>
            <ul className="mt-1.5 space-y-0.5">
              <li>00:00 = 0 min · 09:00 = 540 min · 12:00 = 720 min</li>
              <li>17:00 = 1020 min · 24:00 (end of day) = 1440 min</li>
            </ul>
          </div>

          {candidateErrors.length > 0 && (
            <ErrorList title="Please fix these issues:" errors={candidateErrors} />
          )}

          <button
            type="button"
            onClick={handleCheck}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4" />
            Check Availability
          </button>
        </section>

        {/* Result */}
        {result && (
          <section
            className={`mb-6 rounded-2xl border p-5 shadow-sm sm:p-6 ${
              result.status === "available"
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.status === "available" ? (
                <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 flex-shrink-0 text-rose-600" />
              )}
              <div>
                <p
                  className={`text-lg font-bold ${
                    result.status === "available" ? "text-emerald-800" : "text-rose-800"
                  }`}
                >
                  {result.status === "available" ? "Available" : "Unavailable"}
                </p>
                {result.status === "available" ? (
                  <p className="mt-1 text-sm text-emerald-800/80">
                    Study Room A is free for the requested time. No booking has been made.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-rose-800">
                    {result.reasons.map((r, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span aria-hidden>•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Demo data panel */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-bold text-amber-900">Fictional data panel</h3>
          </div>
          <p className="mt-1 text-sm text-amber-900/80">
            Adjust the demo conditions to test the availability rules. These values are fictional
            and are never sent anywhere.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="now (minutes after midnight, 0–1440)"
              value={nowStr}
              onChange={setNowStr}
              placeholder="e.g. 540"
            />
            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                <span className="text-sm font-medium text-slate-700">
                  Room blocked (reject all requests)
                </span>
                <input
                  type="checkbox"
                  checked={blocked}
                  onChange={(e) => setBlocked(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Existing bookings</p>
              <button
                type="button"
                onClick={handleAddInterval}
                className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                + Add booking
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {intervalFields.length === 0 && (
                <p className="rounded-lg bg-white/60 px-3 py-2 text-xs text-slate-500">
                  No existing bookings.
                </p>
              )}
              {intervalFields.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-lg bg-white p-2 ring-1 ring-inset ring-slate-200"
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.start}
                    onChange={(e) => handleIntervalChange(i, "start", e.target.value)}
                    placeholder="start"
                    aria-label={`Existing booking ${i + 1} start`}
                    className="w-full rounded-md border-0 px-2 py-1.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.end}
                    onChange={(e) => handleIntervalChange(i, "end", e.target.value)}
                    placeholder="end"
                    aria-label={`Existing booking ${i + 1} end`}
                    className="w-full rounded-md border-0 px-2 py-1.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInterval(i)}
                    aria-label={`Remove booking ${i + 1}`}
                    className="rounded-md px-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {demoErrors.length > 0 && <ErrorList title="Demo data is invalid:" errors={demoErrors} />}

          <button
            type="button"
            onClick={handleResetDemo}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            Reset to default demo data
          </button>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Fictional data only · Availability check only · No bookings are created or saved.
        </footer>
      </div>
    </div>
  );
}

// --- Small presentational helpers ---

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-xl border-0 px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );
}

function ErrorList({ title, errors }: { title: string; errors: string[] }) {
  return (
    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-rose-800">
        <AlertTriangle className="h-4 w-4" /> {title}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-rose-700">
        {errors.map((e, i) => (
          <li key={i} className="flex gap-1.5">
            <span aria-hidden>•</span>
            <span>{e}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Demo-data assembly + validation (pure) ---
interface BuiltDemo {
  ok: boolean;
  now: number;
  blocked: boolean;
  existing: Interval[];
  errors: string[];
}

function buildDemoState(nowRaw: string, blocked: boolean, intervals: IntervalField[]): BuiltDemo {
  const errors: string[] = [];

  const nowParsed = clampToRange(parseIntegerInput(nowRaw), MIN_MINUTE, MAX_MINUTE, "now");
  if (!nowParsed.ok || nowParsed.value === null) {
    errors.push(`now: ${nowParsed.error}`);
  }

  const existing: Interval[] = [];
  intervals.forEach((row, i) => {
    const sParsed = clampToRange(parseIntegerInput(row.start), MIN_MINUTE, MAX_MINUTE, `Booking ${i + 1} start`);
    const eParsed = clampToRange(parseIntegerInput(row.end), MIN_MINUTE, MAX_MINUTE, `Booking ${i + 1} end`);
    if (!sParsed.ok || sParsed.value === null) {
      errors.push(`Booking ${i + 1} start: ${sParsed.error}`);
      return;
    }
    if (!eParsed.ok || eParsed.value === null) {
      errors.push(`Booking ${i + 1} end: ${eParsed.error}`);
      return;
    }
    if (sParsed.value >= eParsed.value) {
      errors.push(`Booking ${i + 1}: start (${sParsed.value}) must be less than end (${eParsed.value}).`);
      return;
    }
    existing.push({ start: sParsed.value, end: eParsed.value });
  });

  if (errors.length > 0) {
    return { ok: false, now: 0, blocked: false, existing: [], errors };
  }
  return { ok: true, now: nowParsed.value as number, blocked, existing, errors: [] };
}

// `blocked` is threaded through from the component's checkbox state above;
// buildDemoState focuses on numeric validation and is kept pure w.r.t. intervals.

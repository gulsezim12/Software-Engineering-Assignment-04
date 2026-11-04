import { useMemo, useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  CalendarClock,
} from "lucide-react";
import {
  checkAvailability,
  type Interval,
  type AvailabilityResult,
} from "@/lib/availability";
import { formatTime } from "@/lib/parse";
import {
  parseBookingFields,
  parseRequestTimes,
  type IntervalField,
} from "@/lib/bookingValidation";
import { FIXED_NOW, type Room } from "@/lib/rooms";
import { StatusBadge } from "@/components/RoomBadges";

const EMPTY_INTERVAL: IntervalField = { start: "", end: "" };

function toIntervalFields(bookings: Interval[]): IntervalField[] {
  return bookings.map((i) => ({ start: String(i.start), end: String(i.end) }));
}

// Mounted with `key={room.id}` so switching rooms discards the previous result and inputs.
export default function RoomChecker({ room }: { room: Room }) {
  const now = FIXED_NOW;

  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");

  // Working copy of the room's blocked flag and bookings, initialised from the catalog.
  const [blocked, setBlocked] = useState(room.blocked);
  const [intervalFields, setIntervalFields] = useState<IntervalField[]>(
    toIntervalFields(room.bookings),
  );

  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [candidateErrors, setCandidateErrors] = useState<string[]>([]);
  const [demoErrors, setDemoErrors] = useState<string[]>([]);

  const bookingsParse = useMemo(() => parseBookingFields(intervalFields), [intervalFields]);

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
    setBlocked(room.blocked);
    setIntervalFields(toIntervalFields(room.bookings));
    setResult(null);
    setCandidateErrors([]);
    setDemoErrors([]);
  }

  function handleCheck() {
    setCandidateErrors([]);
    setDemoErrors([]);

    if (!bookingsParse.ok) {
      setDemoErrors(bookingsParse.errors);
      setResult(null);
      return;
    }

    const request = parseRequestTimes(startStr, endStr);
    if (!request.ok) {
      setCandidateErrors(request.errors);
      setResult(null);
      return;
    }

    setResult(
      checkAvailability({
        now,
        blocked,
        existing: bookingsParse.bookings,
        candidateStart: request.start,
        candidateEnd: request.end,
      }),
    );
  }

  const existingForDisplay = bookingsParse.ok ? bookingsParse.bookings : [];

  return (
    <>
      {/* Selected room status card */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Selected room
            </p>
            <h2 className="mt-1 text-xl font-bold">{room.name}</h2>
          </div>
          <StatusBadge blocked={blocked} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" /> Current time (fixed)
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {now} min
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({formatTime(now)})
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
        <h3 className="text-lg font-bold">Check a time for {room.name}</h3>
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
                  {room.name} is free for the requested time. No booking has been made.
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
      <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-bold text-amber-900">Fictional data panel — {room.name}</h3>
        </div>
        <p className="mt-1 text-sm text-amber-900/80">
          Adjust the demo conditions for this room to test the availability rules. These values are
          fictional, are never sent anywhere, and reset when you switch rooms. The current time stays
          fixed at {now} min ({formatTime(now)}).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/70 px-3 py-2.5">
            <span className="text-sm font-medium text-slate-700">now (fixed)</span>
            <p className="mt-0.5 text-sm tabular-nums text-slate-500">
              {now} min ({formatTime(now)})
            </p>
          </div>
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
          Reset to {room.name} catalog data
        </button>
      </section>
    </>
  );
}

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

import { useMemo, useState } from "react";
import { DoorClosed, Users, MousePointerClick } from "lucide-react";
import RoomChecker from "@/components/RoomChecker";
import { getEquipmentIcon } from "@/lib/equipmentIcons";
import { ROOMS, EQUIPMENT_OPTIONS } from "@/lib/rooms";
import { filterRooms, toMinCapacity } from "@/lib/roomFilter";
import { StatusBadge } from "@/components/RoomBadges";

export default function App() {
  const [attendeesStr, setAttendeesStr] = useState("");
  const [requiredEquipment, setRequiredEquipment] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleRooms = useMemo(
    () => filterRooms(ROOMS, toMinCapacity(attendeesStr), requiredEquipment),
    [attendeesStr, requiredEquipment],
  );
  const selectedRoom = visibleRooms.find((r) => r.id === selectedId) ?? null;

  // Clears the selection if the new filters hide the selected room.
  function applyFilters(nextAttendees: string, nextEquipment: string[]) {
    setAttendeesStr(nextAttendees);
    setRequiredEquipment(nextEquipment);
    const stillVisible = filterRooms(ROOMS, toMinCapacity(nextAttendees), nextEquipment);
    if (selectedId !== null && !stillVisible.some((r) => r.id === selectedId)) {
      setSelectedId(null);
    }
  }

  function toggleEquipment(eq: string) {
    applyFilters(
      attendeesStr,
      requiredEquipment.includes(eq)
        ? requiredEquipment.filter((x) => x !== eq)
        : [...requiredEquipment, eq],
    );
  }

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
                Browse fictional study rooms and check whether one is free for a proposed time. This tool does not make bookings.
              </p>
            </div>
          </div>
        </header>

        {/* Room catalog */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Room catalog
          </h2>

          {/* Filters */}
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Minimum attendees</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={attendeesStr}
                  onChange={(e) => applyFilters(e.target.value, requiredEquipment)}
                  placeholder="e.g. 5"
                  className="mt-1 block w-full rounded-xl border-0 px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Shows only rooms with capacity for at least this many people.
                </span>
              </label>
              <div>
                <span className="text-sm font-medium text-slate-700">Required equipment</span>
                <p className="mt-1 text-xs text-slate-500">
                  A room must contain every selected item to be shown.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const Icon = getEquipmentIcon(eq);
                    const active = requiredEquipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {visibleRooms.length} of {ROOMS.length} rooms
              </p>
              {(attendeesStr !== "" || requiredEquipment.length > 0) && (
                <button
                  type="button"
                  onClick={() => applyFilters("", [])}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleRooms.map((room) => {
              const isSelected = room.id === selectedId;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedId(room.id)}
                  aria-pressed={isSelected}
                  className={`rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold">{room.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">ID {room.id}</p>
                    </div>
                    <StatusBadge blocked={room.blocked} compact />
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Capacity {room.capacity}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {room.equipment.map((eq) => {
                      const Icon = getEquipmentIcon(eq);
                      return (
                        <span
                          key={eq}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                        >
                          <Icon className="h-3 w-3" />
                          {eq}
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          {visibleRooms.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              No rooms match the selected filters. Try lowering the attendee count or removing some equipment.
            </div>
          )}
        </section>

        {selectedRoom ? (
          <RoomChecker key={selectedRoom.id} room={selectedRoom} />
        ) : (
          visibleRooms.length > 0 && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
              <MousePointerClick className="h-5 w-5 flex-shrink-0 text-slate-400" />
              Select a room above to check its availability.
            </div>
          )
        )}

        <footer className="mt-8 text-center text-xs text-slate-400">
          Fictional data only · Availability check only · No bookings are created or saved.
        </footer>
      </div>
    </div>
  );
}

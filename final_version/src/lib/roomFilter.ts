import { parseIntegerInput } from "@/lib/parse";
import type { Room } from "@/lib/rooms";

// Empty or invalid attendee input means "no minimum".
export function toMinCapacity(raw: string): number {
  const parsed = parseIntegerInput(raw);
  return parsed.ok && parsed.value !== null ? parsed.value : 0;
}

// F1: capacity must be >= requested attendees. F2: room must contain ALL required equipment.
export function filterRooms(rooms: Room[], minCapacity: number, equipment: string[]): Room[] {
  return rooms.filter(
    (room) =>
      room.capacity >= minCapacity && equipment.every((eq) => room.equipment.includes(eq)),
  );
}

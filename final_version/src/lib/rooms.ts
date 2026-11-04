import type { Interval } from "@/lib/availability";

// Fixed "current time" for the fictional campus (09:00).
export const FIXED_NOW = 540;

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  blocked: boolean;
  bookings: Interval[];
}

// Fictional local room catalog — no database, no API.
export const ROOMS: Room[] = [
  {
    id: "A",
    name: "Room A",
    capacity: 4,
    equipment: ["Wi-Fi", "Whiteboard"],
    blocked: false,
    bookings: [{ start: 600, end: 660 }],
  },
  {
    id: "B",
    name: "Room B",
    capacity: 8,
    equipment: ["Wi-Fi", "Projector"],
    blocked: false,
    bookings: [{ start: 720, end: 780 }],
  },
  {
    id: "C",
    name: "Room C",
    capacity: 12,
    equipment: ["Wi-Fi", "Projector", "Whiteboard"],
    blocked: false,
    bookings: [],
  },
  {
    id: "D",
    name: "Room D",
    capacity: 6,
    equipment: ["Wi-Fi", "Whiteboard"],
    blocked: true,
    bookings: [],
  },
];

// Union of all equipment labels across the catalog, in catalog order.
export const EQUIPMENT_OPTIONS: string[] = Array.from(
  new Set(ROOMS.flatMap((r) => r.equipment)),
);


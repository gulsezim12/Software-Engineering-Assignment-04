
import { describe, it, expect } from 'vitest';
import { checkAvailability } from './lib/availability';
import { filterRooms, toMinCapacity } from './lib/roomFilter';
import { FIXED_NOW, ROOMS } from './lib/rooms';
import { parseRequestTimes } from './lib/bookingValidation';

const roomA = ROOMS.find((room) => room.id === 'A')!;
const roomB = ROOMS.find((room) => room.id === 'B')!;
const roomC = ROOMS.find((room) => room.id === 'C')!;
const roomD = ROOMS.find((room) => room.id === 'D')!;

function checkRoom(
  room: typeof roomA,
  start: number,
  end: number
) {
  return checkAvailability({
    now: FIXED_NOW,
    blocked: room.blocked,
    existing: room.bookings,
    candidateStart: start,
    candidateEnd: end,
  });
}

describe('AC1 - Time validation', () => {
  it('01 - accepts valid future time', () => {
    expect(checkRoom(roomC, 600, 660).status)
      .toBe('available');
  });

  it('02 - rejects start equal to current time', () => {
    expect(checkRoom(roomC, 540, 600).status)
      .toBe('unavailable');
  });

  it('03 - rejects negative start time', () => {
    expect(checkRoom(roomC, -1, 600).status)
      .toBe('unavailable');
  });

  it('04 - rejects end greater than 1440', () => {
    expect(checkRoom(roomC, 1380, 1441).status)
      .toBe('unavailable');
  });

  it('05 - rejects start equal to end', () => {
    expect(checkRoom(roomC, 600, 600).status)
      .toBe('unavailable');
  });
});

describe('AC2 - Booking duration', () => {
  it('06 - accepts exactly 120 minutes', () => {
    expect(checkRoom(roomC, 720, 840).status)
      .toBe('available');
  });

  it('07 - rejects 121 minutes', () => {
    expect(checkRoom(roomC, 720, 841).status)
      .toBe('unavailable');
  });
});

describe('AC3 - Blocked rooms', () => {
  it('08 - rejects a blocked room', () => {
    expect(checkRoom(roomD, 600, 660).status)
      .toBe('unavailable');
  });
});

describe('AC4 - Booking overlaps', () => {
  it('09 - allows touching booking endpoints', () => {
    expect(checkRoom(roomA, 660, 720).status)
      .toBe('available');
  });

  it('10 - rejects overlapping bookings', () => {
    expect(checkRoom(roomA, 630, 690).status)
      .toBe('unavailable');
  });

  it('11 - rejects exactly the same booking time', () => {
    expect(checkRoom(roomA, 600, 660).status)
      .toBe('unavailable');
  });
});

describe('AC5 - Data immutability', () => {
  it('12 - does not modify existing bookings', () => {
    const before = JSON.stringify(roomA.bookings);
    checkRoom(roomA, 600, 660);
    expect(JSON.stringify(roomA.bookings)).toBe(before);
  });
});

describe('F1 - Capacity filtering', () => {
  it('13 - accepts exact capacity', () => {
    const result = filterRooms(ROOMS, 8, []);
    expect(result.some((room) => room.id === 'B'))
      .toBe(true);
  });

  it('14 - excludes insufficient capacity', () => {
    const result = filterRooms(ROOMS, 9, []);
    expect(result.some((room) => room.id === 'B'))
      .toBe(false);
  });

  it('15 - returns B and C for eight attendees', () => {
    const result = filterRooms(ROOMS, 8, []);
    expect(result.map((room) => room.id))
      .toEqual(['B', 'C']);
  });
});

describe('F2 - Equipment filtering', () => {
  it('16 - finds rooms with a projector', () => {
    const result = filterRooms(ROOMS, 0, ['Projector']);
    expect(result.map((room) => room.id))
      .toEqual(['B', 'C']);
  });

  it('17 - requires all selected equipment', () => {
    const result = filterRooms(
      ROOMS, 0, ['Projector', 'Whiteboard']
    );
    expect(result.map((room) => room.id))
      .toEqual(['C']);
  });

  it('18 - rejects missing equipment', () => {
    const result = filterRooms(ROOMS, 0, ['Microphone']);
    expect(result).toEqual([]);
  });
});

describe('F3 and F4 - Blocked room and empty state', () => {
  it('19 - blocked room never becomes available', () => {
    expect(checkRoom(roomD, 660, 720).status)
      .toBe('unavailable');
  });

  it('20 - returns empty list when capacity is too high', () => {
    expect(filterRooms(ROOMS, 20, [])).toEqual([]);
  });
});

describe('Room-specific availability integration', () => {
  it('21 - same time has different results for A and B', () => {
    expect(checkRoom(roomA, 600, 660).status)
      .toBe('unavailable');
    expect(checkRoom(roomB, 600, 660).status)
      .toBe('available');
  });

  it('22 - checks selected room with matching filters', () => {
    const matching = filterRooms(
      ROOMS, 8, ['Projector', 'Whiteboard']
    );
    expect(matching).toHaveLength(1);
    expect(matching[0].id).toBe('C');

    expect(checkRoom(matching[0], 600, 660).status)
      .toBe('available');
  });
});

describe('Input parsing', () => {
  it('23 - parses valid time input', () => {
    expect(parseRequestTimes('600', '660'))
      .toEqual({ ok: true, start: 600, end: 660 });
  });

  it('24 - rejects decimal time input', () => {
    expect(parseRequestTimes('600.5', '660').ok)
      .toBe(false);
  });

  it('25 - converts empty capacity to zero', () => {
    expect(toMinCapacity('')).toBe(0);
  });
});

import { fromZonedTime } from "date-fns-tz";
import { BOOKING_RULES, BUSINESS } from "../lib/constants";
import { computeEndAt, parseTimeToMinutes } from "../utils/date";
import {
  buildAvailableSlotsForDay,
  isStartAllowedInSegment,
} from "../services/availability-slots";

const TZ = BUSINESS.timezone;
const DATE = "2026-11-10"; // Tuesday
const AFTERNOON = { openTime: "13:00", closeTime: "20:00" };
const MORNING = { openTime: "09:00", closeTime: "12:00" };
const EARLIEST = new Date("2000-01-01T00:00:00.000Z");

function zoned(timeHm: string) {
  return fromZonedTime(`${DATE}T${timeHm}:00`, TZ);
}

function labels(slots: { label: string }[]) {
  return slots.map((s) => s.label);
}

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function assert(condition: unknown, message: string) {
  if (!condition) fail(message);
}

const previous = { startAt: zoned("18:30"), endAt: zoned("19:15") };
const hours = [MORNING, AFTERNOON];

const cut45 = buildAvailableSlotsForDay({
  dateYmd: DATE,
  durationMinutes: 45,
  hours,
  appointments: [previous],
  blockedHours: [],
  bufferMinutes: BOOKING_RULES.bufferMinutes,
  slotIntervalMinutes: BOOKING_RULES.slotIntervalMinutes,
  earliestAllowed: EARLIEST,
});

const cut1915 = cut45.find((s) => s.label === "19:15");
if (!cut1915) {
  fail("45-min cut should offer 19:15 after a 18:30–19:15 appointment");
}
assert(
  new Date(cut1915.endAt).getTime() === zoned("20:00").getTime(),
  "45-min cut starting 19:15 should end at 20:00",
);
assert(
  !labels(cut45).includes("19:30"),
  "19:30 exceeds the latest start even for a service that fits before 20:15",
);
assert(
  !labels(cut45).includes("18:30"),
  "18:30 should be blocked by the previous appointment",
);

const cut60 = buildAvailableSlotsForDay({
  dateYmd: DATE,
  durationMinutes: 60,
  hours,
  appointments: [previous],
  blockedHours: [],
  bufferMinutes: 0,
  slotIntervalMinutes: 30,
  earliestAllowed: EARLIEST,
});
const hour1915 = cut60.find((s) => s.label === "19:15");
if (!hour1915) {
  fail("60-min service should still be offered at 19:15");
}
assert(
  new Date(hour1915.endAt).getTime() === zoned("20:15").getTime(),
  "60-min service starting 19:15 should end at 20:15 past close",
);

assert(!labels(cut60).includes("19:30"), "a 60-minute service at 19:30 ends too late");

const shortCutInput = {
  dateYmd: DATE,
  durationMinutes: 10,
  hours,
  appointments: [previous, { startAt: zoned("19:30"), endAt: zoned("19:45") }],
  blockedHours: [],
  bufferMinutes: 0,
  slotIntervalMinutes: 30,
  earliestAllowed: EARLIEST,
};
const shortCut = buildAvailableSlotsForDay(shortCutInput);
assert(shortCut.some((slot) => slot.label === "19:15" && slot.endAt === zoned("19:25").toISOString()),
  "a short service should fill the 19:15–19:30 gap");
assert(!labels(shortCut).includes("19:45"), "even a short service must start by 19:15");
const emptySlots = labels(buildAvailableSlotsForDay({
  ...shortCutInput,
  appointments: [],
  slotIntervalMinutes: 15,
}));
assert(emptySlots.at(-1) === "19:00", "regular starts must stop at 19:00");

const afterHour = buildAvailableSlotsForDay({
  ...shortCutInput,
  appointments: [{ startAt: zoned("18:30"), endAt: zoned("19:30") }],
});
assert(labels(afterHour).at(-1) === "18:00", "no later slot after the 18:30–19:30 booking");

assert(
  !labels(buildAvailableSlotsForDay({ ...shortCutInput, durationMinutes: 61, appointments: [previous] })).includes("19:15"),
  "a service ending at 20:16 must not be offered at 19:15",
);
assert(!labels(shortCut).includes("20:00"), "appointments must start before closing");

assert(!isStartAllowedInSegment({
  startMinutes: parseTimeToMinutes("18:30"),
  durationMinutes: 45,
  segmentOpen: parseTimeToMinutes("13:00"),
  segmentClose: parseTimeToMinutes("19:00"),
  isLastSegment: true,
}), "an early closure should be respected");

const overlapAppt = buildAvailableSlotsForDay({
  dateYmd: DATE,
  durationMinutes: 45,
  hours,
  appointments: [
    previous,
    { startAt: zoned("19:15"), endAt: zoned("20:00") },
  ],
  blockedHours: [],
  bufferMinutes: 0,
  slotIntervalMinutes: 30,
  earliestAllowed: EARLIEST,
});
assert(
  !labels(overlapAppt).includes("19:15"),
  "overlapping appointment should block 19:15",
);

const overlapBlock = buildAvailableSlotsForDay({
  dateYmd: DATE,
  durationMinutes: 45,
  hours,
  appointments: [previous],
  blockedHours: [{ startAt: zoned("19:15"), endAt: zoned("19:45") }],
  bufferMinutes: 0,
  slotIntervalMinutes: 30,
  earliestAllowed: EARLIEST,
});
assert(
  !labels(overlapBlock).includes("19:15"),
  "overlapping blocked hour should block 19:15",
);

const lunch = isStartAllowedInSegment({
  startMinutes: parseTimeToMinutes("11:30"),
  durationMinutes: 45,
  segmentOpen: parseTimeToMinutes("09:00"),
  segmentClose: parseTimeToMinutes("12:00"),
  isLastSegment: false,
});
assert(!lunch, "morning slot that would run into lunch must be rejected");

const bufferSlots = buildAvailableSlotsForDay({
  dateYmd: DATE,
  durationMinutes: 45,
  hours,
  appointments: [previous],
  blockedHours: [],
  bufferMinutes: 15,
  slotIntervalMinutes: 30,
  earliestAllowed: EARLIEST,
});
assert(
  !labels(bufferSlots).includes("19:15"),
  "configured rest buffer after the previous appointment should keep 19:15 occupied",
);

const endAt = computeEndAt(zoned("19:15"), 45);
assert(
  endAt.getTime() === zoned("20:00").getTime(),
  "validation endAt for 19:15 + 45 min should be 20:00",
);

console.log("All availability checks passed.");

export const BUSINESS = {
  name: "COELI BARBER CLUB",
  phoneDisplay: "+506 7193-6588",
  phoneE164: "+50671936588",
  whatsappNumber: "50671936588",
    mapsUrl: "https://maps.app.goo.gl/pHUVWPaKvmfoYpyJ7?g_st=ic",
  address:
    "100 mts este de la Plaza de Buenos Aires, Barrio Buenos Aires, Santa Cruz, Guanacaste",
  timezone: "America/Costa_Rica",
  currency: "CRC",
  currencySymbol: "₡",
} as const;

export const BOOKING_RULES = {
  bufferMinutes: 0,
  slotIntervalMinutes: 30,
  lastAppointmentStartTime: "19:00",
  openTime: "09:00",
  closeTime: "20:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
  workDays: [1, 2, 3, 4, 5, 6] as const, // Mon–Sat
} as const;

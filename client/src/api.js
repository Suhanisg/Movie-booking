const BASE = import.meta.env.VITE_API_URL;

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Server se connect nahi ho paa raha. Internet check karo.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Kuch gadbad ho gayi");
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const getSeats = () => request("/api/seats");
export const holdSeats = (seats) =>
  request("/api/seats/hold", { method: "POST", body: JSON.stringify({ seats }) });
export const releaseSeats = (holdToken) =>
  request("/api/seats/release", { method: "POST", body: JSON.stringify({ holdToken }) });
export const createBooking = (payload) =>
  request("/api/bookings", { method: "POST", body: JSON.stringify(payload) });

// ---- Admin ----
const adminHeaders = (key) => ({
  "Content-Type": "application/json",
  "x-admin-key": key,
});
export const adminGetBookings = (key) =>
  request("/api/admin/bookings", { headers: adminHeaders(key) });
export const adminCancelTicket = (key, bookingId, seat) =>
  request(`/api/admin/bookings/${bookingId}/seats/${seat}/cancel`, {
    method: "POST",
    headers: adminHeaders(key),
  });
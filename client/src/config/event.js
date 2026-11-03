// Event ki details yahin se badlengi
export const EVENT = {
  organizer: "Shri Agarwal Parishad",
  organizerWing: "Matra Shakti",
  cinemaName: "DD Cinema",
  movieName: "Ramayan",
  date: "19 November 2026",
  time: "3:40 PM",
  venue: "DD Cinema",
  bookingOpen: true,
};
// Seat layout yahin se badlega (rows, aur aisle ke dono taraf kitni seats)
export const SEAT_LAYOUT = {
  rows: ["B", "C", "D", "E"],
  leftSeats: 11,
  rightSeats: 9,
};

export const TOTAL_SEATS =
  SEAT_LAYOUT.rows.length * (SEAT_LAYOUT.leftSeats + SEAT_LAYOUT.rightSeats);

  // Builds seat ids like B01...E20, split into left and right blocks
export function getSeatRows() {
  const pad = (n) => String(n).padStart(2, "0");

  return SEAT_LAYOUT.rows.map((row) => ({
    row,
    left: Array.from(
      { length: SEAT_LAYOUT.leftSeats },
      (_, i) => `${row}${pad(i + 1)}`
    ),
    right: Array.from(
      { length: SEAT_LAYOUT.rightSeats },
      (_, i) => `${row}${pad(SEAT_LAYOUT.leftSeats + i + 1)}`
    ),
  }));
}
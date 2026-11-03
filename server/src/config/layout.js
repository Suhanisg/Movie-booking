export const LAYOUT = { rows: ["B", "C", "D", "E"], perRow: 20 };

export const ALL_SEATS = LAYOUT.rows.flatMap((row) =>
  Array.from({ length: LAYOUT.perRow }, (_, i) =>
    `${row}${String(i + 1).padStart(2, "0")}`
  )
);
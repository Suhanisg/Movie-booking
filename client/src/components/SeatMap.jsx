import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { getSeatRows, SEAT_LAYOUT } from "../config/event";

// 1 = poora map screen mein fit, bade numbers = zoom in
const ZOOMS = [1, 1.5, 2, 2.6];
const AISLE = 16;
const LABEL = 22;

export default function SeatMap({ booked, held, selected, onToggle }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(320);
  // phone par pehle se thoda zoom, taaki seats badi dikhein
  const [zoomIdx, setZoomIdx] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 480 ? 1 : 0
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rows = getSeatRows();
  const perRow = SEAT_LAYOUT.leftSeats + SEAT_LAYOUT.rightSeats;

  // Row letters scroll area ke bahar hain, isliye width se LABEL minus nahi karna
  const fitCell = Math.max(12, Math.floor((width - AISLE) / perRow));
  const cellW = Math.round(fitCell * ZOOMS[zoomIdx]);
  const cellH = Math.round(cellW * 1.2);
  const rowWidth = AISLE + cellW * perRow;
  const pad = cellW >= 24 ? 2 : 1;
  const fontSize = Math.max(8, Math.min(14, Math.round(cellW * 0.42)));

  const renderSeat = (id) => {
    const isBooked = booked.includes(id);
    const isHeld = held.includes(id);
    const isSelected = selected.includes(id);

    // Available = transparent + border + number. Baaki sab fill hote hain.
    let style = "border-seat-free bg-transparent text-seat-free";
    if (isBooked) style = "border-seat-booked bg-seat-booked text-white";
    else if (isHeld) style = "border-[#cdbfb2] bg-[#cdbfb2] text-white";
    else if (isSelected)
      style = "border-seat-picked bg-seat-picked text-white shadow-md";

    return (
      <button
        key={id}
        type="button"
        disabled={isBooked || isHeld}
        onClick={() => onToggle(id)}
        aria-label={`Seat ${id}`}
        aria-pressed={isSelected}
        style={{ width: cellW, height: cellH, padding: pad }}
        className="flex shrink-0 items-center justify-center disabled:cursor-not-allowed"
      >
        <span
          className={`flex h-full w-full items-center justify-center rounded-md border-[1.5px] font-semibold leading-none transition-colors duration-150 ${style}`}
          style={{ fontSize }}
        >
          {id.slice(1)}
        </span>
      </button>
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <p className="text-xs leading-snug text-ink-soft">
          Tap + to zoom in, fir left-right scroll karo.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            disabled={zoomIdx === 0}
            aria-label="Zoom out"
            className="rounded-xl border border-line bg-card p-2 text-ink active:scale-95 disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setZoomIdx((i) => Math.min(ZOOMS.length - 1, i + 1))
            }
            disabled={zoomIdx === ZOOMS.length - 1}
            aria-label="Zoom in"
            className="rounded-xl border border-line bg-card p-2 text-ink active:scale-95 disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Fixed row letters: slide nahi honge */}
        <div className="shrink-0" style={{ width: LABEL }}>
          {rows.map(({ row }) => (
            <div
              key={row}
              className="mb-1.5 flex items-center text-xs font-semibold text-ink-soft"
              style={{ height: cellH }}
            >
              {row}
            </div>
          ))}
        </div>

        {/* Sirf seats scroll hongi */}
        <div
          ref={wrapRef}
          className="no-scrollbar min-w-0 flex-1 overflow-x-auto pb-3"
          style={{ touchAction: "pan-x pinch-zoom" }}
        >
          <div className="mx-auto" style={{ width: rowWidth }}>
            {/* Seat rows: B upar, E screen ke sabse paas */}
            {rows.map(({ row, left, right }) => (
              <div key={row} className="mb-1.5 flex items-center">
                <div className="flex">{left.map(renderSeat)}</div>
                <div className="shrink-0" style={{ width: AISLE }} />
                <div className="flex">{right.map(renderSeat)}</div>
              </div>
            ))}

            {/* Curved cinema screen */}
            <div className="mt-5">
              <svg
                viewBox="0 0 200 30"
                preserveAspectRatio="none"
                style={{ width: rowWidth, height: 28 }}
                role="img"
                aria-label="Cinema screen"
              >
                <path
                  d="M6 6 Q100 30 194 6"
                  fill="none"
                  stroke="#c9a27e"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-center text-[10px] tracking-[0.3em] text-ink-soft">
                SCREEN THIS WAY
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
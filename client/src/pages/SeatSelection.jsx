import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Loader2 } from "lucide-react";
import SeatMap from "../components/SeatMap";
import { EVENT, TOTAL_SEATS } from "../config/event";
import { getSeats, holdSeats } from "../api";
import Onboarding, { SEAT_TOUR, hasSeenTour } from "./Onboarding";

const POLL_MS = 10000; // har 10 second mein seats refresh

function Chip({ label, value, color }) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-card py-2 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-ink-soft">{label}</p>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}

export default function SeatSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [booked, setBooked] = useState([]);
  const [held, setHeld] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState("");
  // Pehli baar aane par instructions dikhao
  const [showTour, setShowTour] = useState(() => !hasSeenTour(SEAT_TOUR));

  const available = TOTAL_SEATS - booked.length - held.length;

  const loadSeats = useCallback(async () => {
    try {
      const data = await getSeats();
      setBooked(data.booked);
      setHeld(data.held);
      // Jo seat kisi aur ne le li, usse apni selection se hata do
      const taken = new Set([...data.booked, ...data.held]);
      setSelected((prev) => {
        const next = prev.filter((id) => !taken.has(id));
        if (next.length !== prev.length) {
          setError("Kuch seats kisi aur ne le li, unhe hata diya gaya hai.");
        }
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeats();
    const timer = setInterval(loadSeats, POLL_MS);
    return () => clearInterval(timer);
  }, [loadSeats]);

  const toggleSeat = (id) => {
    setError("");
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id].sort()
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0 || holding) return;
    setHolding(true);
    setError("");
    try {
      const { holdToken, expiresAt, seats } = await holdSeats(selected);
      navigate("/details", { state: { seats, holdToken, expiresAt } });
    } catch (err) {
      setError(err.message);
      loadSeats(); // taaki latest booked/held dikhe
    } finally {
      setHolding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-32 pt-5">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back"
          className="rounded-xl border border-line bg-card p-2 text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-ink">Choose your seats</h1>
          <p className="text-xs text-ink-soft">
            {EVENT.movieName} · {EVENT.cinemaName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTour(true)}
          aria-label="Instructions dekhein"
          className="ml-auto rounded-xl border border-line bg-card p-2 text-ink-soft"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex gap-2" data-tour="counts">
        <Chip label="Total" value={TOTAL_SEATS} color="text-ink" />
        <Chip label="Available" value={available} color="text-[#5f9a6b]" />
        <Chip label="Booked" value={booked.length} color="text-[#c0564b]" />
        <Chip label="Selected" value={selected.length} color="text-[#4a77a3]" />
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-[#c0564b]/30 bg-[#c0564b]/10 px-3 py-2 text-sm text-[#c0564b]">
          {error}
        </p>
      )}

      <div className="mt-5 rounded-3xl border border-line bg-card p-3" data-tour="map">
        <SeatMap
          booked={booked}
          held={held}
          selected={selected}
          onToggle={toggleSeat}
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2" data-tour="legend">
        <LegendItem color="border-2 border-seat-free" label="Available" />
        <LegendItem color="bg-seat-picked" label="Selected" />
        <LegendItem color="bg-seat-booked" label="Booked" />
        <LegendItem color="bg-[#cdbfb2]" label="Held for a moment" />
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card" data-tour="bar">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            {selected.length === 0 ? (
              <p className="text-sm text-ink-soft">Tap a green seat to select it</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink">
                  {selected.length} {selected.length === 1 ? "seat" : "seats"}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {selected.join(", ")}
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={selected.length === 0 || holding}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-brand px-6 py-3 font-semibold text-card transition active:scale-95 disabled:opacity-40"
          >
            {holding && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue
          </button>
        </div>
      </div>

      {showTour && <Onboarding tour={SEAT_TOUR} onClose={() => setShowTour(false)} />}
    </div>
  );
}
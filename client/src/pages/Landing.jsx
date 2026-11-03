import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Ticket } from "lucide-react";
import { EVENT, TOTAL_SEATS } from "../config/event";
import { getSeats } from "../api";
import Onboarding, { LANDING_TOUR, hasSeenTour } from "./Onboarding";
import posterImg from "../assets/ramayan-movie.jpg";

function Stat({ label, value, color }) {
  return (
    <div className="flex-1 rounded-2xl border border-line bg-card py-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

function Detail({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-brand" />
      <span className="text-sm text-ink">{text}</span>
    </div>
  );
}

export default function Landing() {
  // null = abhi load ho raha hai (ya server se error aaya)
  const [booked, setBooked] = useState(null);
  // Pehli baar aane par instructions dikhao
  const [showTour, setShowTour] = useState(() => !hasSeenTour(LANDING_TOUR));
  // true = button se khola gaya, isliye turant dikhao (wait nahi)
  const [openNow, setOpenNow] = useState(false);

  const reopenTour = () => {
    setOpenNow(true);
    setShowTour(true);
  };

  const closeTour = () => {
    setShowTour(false);
    setOpenNow(false);
  };

  useEffect(() => {
    let cancelled = false;
    getSeats()
      .then((data) => !cancelled && setBooked(data.booked.length))
      .catch(() => {}); // landing par error dikhane ki zaroorat nahi, "-" dikhega
    return () => {
      cancelled = true;
    };
  }, []);

  const available = booked === null ? "-" : TOTAL_SEATS - booked;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      {/* Organizer name */}
      <div className="text-center">
        <h2 className="text-2xl font-bold leading-tight text-brand">
          {EVENT.organizer}
        </h2>
        <div className="mx-auto mt-2 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gold" />
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
            {EVENT.organizerWing}
          </p>
          <span className="h-px w-10 bg-gold" />
        </div>
      </div>

      {/* Movie poster */}
      <div className="mt-6 overflow-hidden rounded-3xl shadow-xl shadow-[#b5694a]/20">
        <img
          src={posterImg}
          alt={`${EVENT.movieName} poster`}
          className="block w-full object-cover"
        />
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        An exclusive screening for our Ladies Club. Choose your favourite seats.
      </p>

      <div className="mt-5 space-y-3" data-tour="details">
        <Detail icon={CalendarDays} text={EVENT.date} />
        <Detail icon={Clock} text={EVENT.time} />
        <Detail icon={MapPin} text={EVENT.venue} />
      </div>

      <div className="mt-5 flex gap-3" data-tour="stats">
        <Stat label="Total" value={TOTAL_SEATS} color="text-ink" />
        <Stat label="Available" value={available} color="text-[#5f9a6b]" />
        <Stat label="Booked" value={booked ?? "-"} color="text-[#c0564b]" />
      </div>

      <div className="mt-auto pt-8">
        {EVENT.bookingOpen ? (
          <Link
            to="/seats"
            data-tour="book"
            className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-lg font-semibold text-card shadow-lg shadow-brand/25 transition active:scale-95 active:bg-brand-dark"
          >
            <Ticket className="h-5 w-5" />
            Book Your Seats
          </Link>
        ) : (
          <div className="rounded-2xl border border-line bg-card py-4 text-center text-ink-soft">
            Booking is currently closed
          </div>
        )}

        <button
          type="button"
          onClick={reopenTour}
          className="mt-4 block w-full text-center text-xs text-ink-soft underline"
        >
          Instructions dobara dekhein
        </button>
      </div>

      {showTour && (
        <Onboarding
          tour={LANDING_TOUR}
          delayMs={openNow ? 0 : undefined}
          onClose={closeTour}
        />
      )}
    </div>
  );
}
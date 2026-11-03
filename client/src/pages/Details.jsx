import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Timer } from "lucide-react";
import { EVENT } from "../config/event";
import { createBooking, releaseSeats } from "../api";
import Onboarding, { DETAILS_TOUR, hasSeenTour } from "./Onboarding";

const isValidMobile = (m) => /^[6-9]\d{9}$/.test(m);

const formatTime = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export default function Details() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const seats = state?.seats;
  const holdToken = state?.holdToken;
  const expiresAt = state?.expiresAt ? new Date(state.expiresAt).getTime() : 0;

  // Saare hooks early return se PEHLE rakhe hain (React ka rule)
  const [people, setPeople] = useState(() =>
    (seats || []).map((seat) => ({ seat, name: "", mobile: "" }))
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [now, setNow] = useState(Date.now());
  // Pehli baar aane par instructions dikhao
  const [showTour, setShowTour] = useState(() => !hasSeenTour(DETAILS_TOUR));

  const remaining = expiresAt - now;
  const expired = Boolean(holdToken) && remaining <= 0;

  // Countdown: har second update
  useEffect(() => {
    if (!holdToken) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [holdToken]);

  // Time khatam ho gaya to seats page par bhej do
  useEffect(() => {
    if (expired) navigate("/seats", { replace: true });
  }, [expired, navigate]);

  // seats ya holdToken nahi aaya (direct URL khola) to wapas bhejo
  if (!seats || seats.length === 0 || !holdToken) {
    return <Navigate to="/seats" replace />;
  }

  const update = (index, field, value) => {
    setServerError("");
    setPeople((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // har mobile kitni baar aaya
  const mobileCount = people.reduce((acc, p) => {
    if (p.mobile) acc[p.mobile] = (acc[p.mobile] || 0) + 1;
    return acc;
  }, {});

  const getErrors = (p) => {
    const e = {};
    if (p.name.trim().length < 2) e.name = "Naam likho";
    if (!isValidMobile(p.mobile)) e.mobile = "Sahi 10 digit mobile number likho";
    else if (mobileCount[p.mobile] > 1)
      e.mobile = "Ye number kisi aur seat par bhi hai. Har seat ka alag number chahiye";
    return e;
  };

  const allValid = people.every((p) => Object.keys(getErrors(p)).length === 0);

  const handleConfirm = async () => {
    setSubmitted(true);
    if (!allValid || submitting) return;

    setSubmitting(true);
    setServerError("");
    try {
      const booking = await createBooking({
        holdToken,
        people: people.map((p) => ({
          seat: p.seat,
          name: p.name.trim(),
          mobile: p.mobile,
        })),
      });
      // Ticket page ko wahi shape milti hai jo pehle thi
      navigate("/ticket", {
        state: { bookingId: booking.bookingId, people: booking.people },
        replace: true,
      });
    } catch (err) {
      if (err.code === "HOLD_EXPIRED") {
        navigate("/seats", { replace: true });
      } else {
        setServerError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Back dabane par hold chhod do taaki seats turant free ho jaayein
  const handleBack = async () => {
    try {
      await releaseSeats(holdToken);
    } catch {
      // release fail ho to bhi aage badho, hold apne aap expire ho jaayegi
    }
    navigate("/seats");
  };

  const inputClass = (hasError) =>
    `w-full rounded-xl border bg-white/60 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand ${
      hasError ? "border-seat-booked" : "border-line"
    }`;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-32 pt-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="rounded-xl border border-line bg-card p-2 text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-ink">Guest details</h1>
          <p className="truncate text-xs text-ink-soft">
            {EVENT.movieName} · {EVENT.cinemaName}
          </p>
        </div>
        <div
          data-tour="timer"
          className={`flex shrink-0 items-center gap-1 rounded-xl border border-line bg-card px-2.5 py-1.5 text-xs font-semibold ${
            remaining <= 60000 ? "text-seat-booked" : "text-ink"
          }`}
        >
          <Timer className="h-4 w-4" />
          {formatTime(remaining)}
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-line bg-card px-3 py-2 text-xs leading-relaxed text-ink-soft">
        Har seat ke liye usi vyakti ka <b>naam</b> aur <b>mobile number</b>{" "}
        bharein, jiski seat book ki ja rahi hai. Ek mobile number sirf ek seat
        par use ho sakta hai. Seats sirf upar diye time tak aapke liye hold
        hain.
      </p>

      <button
        type="button"
        onClick={() => setShowTour(true)}
        className="mt-2 self-start text-xs text-ink-soft underline"
      >
        Instructions dobara dekhein
      </button>

      <div className="mt-4 space-y-4">
        {people.map((p, i) => {
          const errors = getErrors(p);
          const showErr = submitted;
          return (
            <div
              key={p.seat}
              data-tour={i === 0 ? "guest" : undefined}
              className="rounded-2xl border border-line bg-card p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Guest {i + 1}</p>
                <span className="rounded-lg bg-seat-picked px-3 py-1 text-xs font-bold text-white">
                  Seat {p.seat}
                </span>
              </div>

              <label className="text-xs font-medium text-ink-soft">
                Full name
              </label>
              <input
                type="text"
                value={p.name}
                onChange={(e) => update(i, "name", e.target.value)}
                autoComplete="off"
                className={`mt-1 ${inputClass(showErr && errors.name)}`}
              />
              {showErr && errors.name && (
                <p className="mt-1 text-xs text-seat-booked">{errors.name}</p>
              )}

              <label className="mt-3 block text-xs font-medium text-ink-soft">
                Mobile number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={p.mobile}
                onChange={(e) =>
                  update(i, "mobile", e.target.value.replace(/\D/g, ""))
                }
                placeholder="10 digit number"
                autoComplete="off"
                className={`mt-1 ${inputClass(showErr && errors.mobile)}`}
              />
              {/* duplicate hone par turant dikhao, submit ka wait nahi */}
              {((showErr && errors.mobile) ||
                (p.mobile && mobileCount[p.mobile] > 1)) && (
                <p className="mt-1 text-xs text-seat-booked">{errors.mobile}</p>
              )}
            </div>
          );
        })}
      </div>

      {serverError && (
        <p className="mt-4 rounded-xl border border-seat-booked/30 bg-seat-booked/10 px-3 py-2 text-sm text-seat-booked">
          {serverError}
        </p>
      )}

      <div
        data-tour="bar"
        className="fixed inset-x-0 bottom-0 border-t border-line bg-card"
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {seats.length} {seats.length === 1 ? "seat" : "seats"}
            </p>
            <p className="truncate text-xs text-ink-soft">{seats.join(", ")}</p>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-brand px-6 py-3 font-semibold text-card transition active:scale-95 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Booking
          </button>
        </div>
      </div>

      {showTour && (
        <Onboarding tour={DETAILS_TOUR} onClose={() => setShowTour(false)} />
      )}
    </div>
  );
}
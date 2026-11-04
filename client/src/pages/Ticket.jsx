import { useRef, useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { CheckCircle2, Download, Loader2, MessageCircle } from "lucide-react";
import { toPng } from "html-to-image";
import { EVENT } from "../config/event";
import ticketBg from "../assets/Ramayana.webp";

// ---- Yahan se ticket ka look adjust kar sakte ho ----
// Neeche wali details ke peeche cream parda (0 = bilkul saaf image, 1 = image nahi dikhegi)
const DETAILS_OVERLAY = 0.84;
// -----------------------------------------------------

const maskMobile = (m) => `XXXXXX${m.slice(-4)}`;

function whatsappLink({ name, mobile, seat, bookingId }) {
  const text =
    `Hello ${name}! Your booking for ${EVENT.movieName} at ${EVENT.cinemaName} is confirmed.\n\n` +
    `Name: ${name}\n` +
    `Booking ID: ${bookingId}\n` +
    `Seat: ${seat}\n` +
    (EVENT.date ? `Date: ${EVENT.date}\n` : "") +
    (EVENT.time ? `Time: ${EVENT.time}\n` : "") +
    `\nWe look forward to seeing you!`;
  return `https://wa.me/91${mobile}?text=${encodeURIComponent(text)}`;
}

// Ticket ko image (PNG) bana kar phone/laptop mein download karao
async function downloadTicket(node, filename) {
  let bg = getComputedStyle(document.body).backgroundColor;
  if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") bg = "#f5ebe0";

  const dataUrl = await toPng(node, {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor: bg,
    // WhatsApp button image mein nahi aana chahiye
    filter: (n) => !(n.classList && n.classList.contains("no-print")),
  });

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function TicketCard({ person, bookingId, setRef }) {
  return (
    <div
      ref={setRef}
      className="ticket relative overflow-hidden rounded-3xl border border-line shadow-xl shadow-[#b5694a]/25"
    >
      {/* Upar movie naam: seedhi plain patti, image nahi */}
      <div className="bg-brand px-5 py-4 text-card">
        <p className="text-[10px] tracking-[0.3em] opacity-80">
          {EVENT.cinemaName?.toUpperCase()}
        </p>
        <p className="text-xl font-bold">{EVENT.movieName}</p>
      </div>

      {/* Neeche details: image sirf yahan, halke cream parde ke saath */}
      <div className="relative overflow-hidden px-5 py-4">
        <img
          src={ticketBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(255, 249, 241, ${DETAILS_OVERLAY})` }}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-ink-soft">Guest</p>
              <p className="break-words text-base font-semibold leading-snug text-ink">
                {person.name}
              </p>
              <p className="mt-2 text-[11px] text-ink-soft">Mobile</p>
              <p className="text-sm font-medium text-ink">
                {maskMobile(person.mobile)}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-seat-picked px-4 py-3 text-center text-white shadow-md">
              <p className="text-[10px] opacity-80">SEAT</p>
              <p className="text-2xl font-bold leading-none">{person.seat}</p>
            </div>
          </div>

          {/* ticket ki cut-line */}
          <div className="my-4 border-t-2 border-dashed border-ink-soft/40" />

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="min-w-0">
              <p className="text-ink-soft">Booking ID</p>
              <p className="break-all font-semibold text-ink">{bookingId}</p>
            </div>
            <div className="min-w-0">
              <p className="text-ink-soft">Status</p>
              <p className="font-semibold text-[#5f9a6b]">CONFIRMED</p>
            </div>
            {EVENT.date && (
              <div className="min-w-0">
                <p className="text-ink-soft">Date</p>
                <p className="font-semibold text-ink">{EVENT.date}</p>
              </div>
            )}
            {EVENT.time && (
              <div className="min-w-0">
                <p className="text-ink-soft">Time</p>
                <p className="font-semibold text-ink">{EVENT.time}</p>
              </div>
            )}
          </div>

          <a
            href={whatsappLink({ ...person, bookingId })}
            target="_blank"
            rel="noreferrer"
            className="no-print mt-4 flex items-center justify-center gap-2 rounded-2xl border border-line bg-white/70 py-3 text-sm font-semibold text-ink active:scale-95"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            Share on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Ticket() {
  const { state } = useLocation();
  // Hooks early return se pehle (React ka rule)
  const cardRefs = useRef({});
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  if (!state?.people?.length) return <Navigate to="/" replace />;

  const { bookingId, people } = state;

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      for (const p of people) {
        const node = cardRefs.current[p.seat];
        if (!node) continue;
        await downloadTicket(node, `DD-Cinema-${p.seat}-${bookingId}.png`);
        // ek saath kai files ho to browser ko saans lene do
        if (people.length > 1) await new Promise((r) => setTimeout(r, 400));
      }
    } catch {
      setError("Could not download the ticket. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6">
      <div className="mb-5 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#5f9a6b]" />
        <h1 className="mt-2 text-xl font-bold text-ink">Booking confirmed!</h1>
        <p className="break-all text-xs text-ink-soft">
          {people.length} {people.length === 1 ? "ticket" : "tickets"} · ID{" "}
          {bookingId}
        </p>
      </div>

      <div className="space-y-5">
        {people.map((p) => (
          <TicketCard
            key={p.seat}
            person={p}
            bookingId={bookingId}
            setRef={(el) => (cardRefs.current[p.seat] = el)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-[#c0564b]/30 bg-[#c0564b]/10 px-3 py-2 text-center text-sm text-[#c0564b]">
          {error}
        </p>
      )}

      {/* Buttons: one under the other, so they fit every phone width */}
      <div className="no-print mt-6 space-y-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3.5 text-base font-semibold text-card shadow-lg shadow-brand/25 transition active:scale-95 disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          ) : (
            <Download className="h-5 w-5 shrink-0" />
          )}
          <span>
            {downloading
              ? "Preparing..."
              : people.length > 1
                ? "Download tickets"
                : "Download ticket"}
          </span>
        </button>

        <Link
          to="/"
          className="flex w-full items-center justify-center rounded-2xl border border-line bg-card px-4 py-3.5 text-base font-semibold text-ink transition active:scale-95"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
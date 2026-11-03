import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, LogOut, Search } from "lucide-react";
import { TOTAL_SEATS } from "../config/event";
import { adminGetBookings, adminCancelTicket } from "../api";

const KEY_STORAGE = "dd_admin_key";

function LoginBox({ onLogin, error, loading }) {
  const [value, setValue] = useState("");
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <h1 className="text-center text-xl font-bold text-ink">Admin</h1>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && value && onLogin(value)}
        placeholder="Admin password"
        className="mt-5 w-full rounded-xl border border-line bg-white/60 px-3 py-3 text-sm text-ink outline-none focus:border-brand"
      />
      {error && <p className="mt-2 text-xs text-[#c0564b]">{error}</p>}
      <button
        type="button"
        disabled={!value || loading}
        onClick={() => onLogin(value)}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-brand py-3 font-semibold text-card disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Login
      </button>
    </div>
  );
}

function TicketCard({ ticket, onCancel, cancelling }) {
  const cancelled = ticket.status === "CANCELLED";
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-line bg-card p-3 ${
        cancelled ? "opacity-60" : ""
      }`}
    >
      <span className="shrink-0 rounded-lg bg-seat-picked px-3 py-2 text-sm font-bold text-white">
        {ticket.seat}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{ticket.name}</p>
        <p className="text-xs text-ink-soft">{ticket.mobile}</p>
        <p className="mt-0.5 text-[10px] text-ink-soft">
          {ticket.bookingId} · {new Date(ticket.createdAt).toLocaleString("en-IN")}
        </p>
      </div>
      {cancelled ? (
        <span className="shrink-0 rounded-lg bg-[#c0564b]/15 px-2.5 py-1 text-xs font-semibold text-[#c0564b]">
          Cancelled
        </span>
      ) : (
        <button
          type="button"
          disabled={cancelling}
          onClick={() => onCancel(ticket)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#c0564b] px-3 py-1.5 text-xs font-semibold text-[#c0564b] active:scale-95 disabled:opacity-50"
        >
          {cancelling && <Loader2 className="h-3 w-3 animate-spin" />}
          Cancel
        </button>
      )}
    </div>
  );
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem(KEY_STORAGE) || ""
  );
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(Boolean(adminKey));
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("CONFIRMED"); // "CONFIRMED" ya "CANCELLED"
  const [sort, setSort] = useState("NEW"); // "NEW" | "OLD" | "SEAT"

  const logout = useCallback(() => {
    sessionStorage.removeItem(KEY_STORAGE);
    setAdminKey("");
    setBookings([]);
  }, []);

  const load = useCallback(
    async (key) => {
      setLoading(true);
      setError("");
      try {
        const data = await adminGetBookings(key);
        setBookings(data.bookings);
        sessionStorage.setItem(KEY_STORAGE, key);
        setAdminKey(key);
      } catch (err) {
        if (err.status === 401) logout();
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    if (adminKey) load(adminKey);
    // sirf pehli baar (page khulne par)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (ticket) => {
    if (
      !window.confirm(
        `Seat ${ticket.seat} (${ticket.name}) ka ticket cancel karna hai?`
      )
    ) {
      return;
    }
    const id = `${ticket.bookingId}-${ticket.seat}`;
    setCancellingId(id);
    setError("");
    try {
      await adminCancelTicket(adminKey, ticket.bookingId, ticket.seat);
      await load(adminKey);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId("");
    }
  };

  if (!adminKey) {
    return <LoginBox onLogin={load} error={error} loading={loading} />;
  }

  // Har seat ek alag ticket (booking ka group alag-alag tod diya)
  const tickets = bookings.flatMap((b) =>
    b.people.map((p) => ({
      bookingId: b.bookingId,
      createdAt: b.createdAt,
      seat: p.seat,
      name: p.name,
      mobile: p.mobile,
      status: b.status === "CANCELLED" ? "CANCELLED" : p.status || "CONFIRMED",
    }))
  );

  const active = tickets.filter((t) => t.status === "CONFIRMED");
  const cancelled = tickets.filter((t) => t.status === "CANCELLED");

  const q = search.trim().toLowerCase();
  const visible = (tab === "CONFIRMED" ? active : cancelled).filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.mobile.includes(q) ||
      t.seat.toLowerCase().includes(q) ||
      t.bookingId.toLowerCase().includes(q)
  );

  visible.sort((a, b) => {
    if (sort === "SEAT") return a.seat.localeCompare(b.seat);
    const diff = new Date(a.createdAt) - new Date(b.createdAt);
    const byTime = sort === "OLD" ? diff : -diff;
    return byTime || a.seat.localeCompare(b.seat);
  });

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-10 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Admin</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load(adminKey)}
            aria-label="Refresh"
            className="rounded-xl border border-line bg-card p-2 text-ink"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            className="rounded-xl border border-line bg-card p-2 text-ink"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex-1 rounded-xl border border-line bg-card py-2 text-center">
          <p className="text-lg font-bold text-[#c0564b]">{active.length}</p>
          <p className="text-[11px] text-ink-soft">Seats booked</p>
        </div>
        <div className="flex-1 rounded-xl border border-line bg-card py-2 text-center">
          <p className="text-lg font-bold text-[#5f9a6b]">
            {TOTAL_SEATS - active.length}
          </p>
          <p className="text-[11px] text-ink-soft">Seats available</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {[
          ["CONFIRMED", "Tickets", active.length],
          ["CANCELLED", "Cancelled", cancelled.length],
        ].map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
              tab === key
                ? "border-brand bg-brand text-card"
                : "border-line bg-card text-ink"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Naam, mobile ya seat se dhundo"
          className="w-full rounded-xl border border-line bg-white/60 py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-ink-soft">Sort:</span>
        {[
          ["NEW", "Naye pehle"],
          ["OLD", "Purane pehle"],
          ["SEAT", "Seat number"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSort(key)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              sort === key
                ? "border-brand bg-brand/10 text-brand"
                : "border-line bg-card text-ink-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-[#c0564b]/30 bg-[#c0564b]/10 px-3 py-2 text-sm text-[#c0564b]">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {loading && bookings.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">
            {tab === "CONFIRMED" ? "Koi ticket nahi mila" : "Koi cancelled ticket nahi hai"}
          </p>
        ) : (
          visible.map((t) => (
            <TicketCard
              key={`${t.bookingId}-${t.seat}`}
              ticket={t}
              onCancel={handleCancel}
              cancelling={cancellingId === `${t.bookingId}-${t.seat}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
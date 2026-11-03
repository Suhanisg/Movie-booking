import { Router } from "express";
import { timingSafeEqual } from "crypto";
import Booking from "../models/Booking.js";
import Seat from "../models/Seat.js";

const router = Router();

// Har admin request par header "x-admin-key" check hoga
function requireAdmin(req, res, next) {
  const given = Buffer.from(req.get("x-admin-key") || "");
  const expected = Buffer.from(process.env.ADMIN_KEY || "");
  const ok =
    expected.length > 0 &&
    given.length === expected.length &&
    timingSafeEqual(given, expected);
  if (!ok) return res.status(401).json({ message: "Admin password galat hai" });
  next();
}

router.use(requireAdmin);

// Saari bookings (nayi pehle)
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ bookings });
  } catch {
    res.status(500).json({ message: "Bookings load nahi hui" });
  }
});

// EK ticket (ek seat) cancel karo, baaki seats ki booking waisi hi rahegi
router.post("/bookings/:bookingId/seats/:seat/cancel", async (req, res) => {
  try {
    const { bookingId, seat } = req.params;

    const booking = await Booking.findOneAndUpdate(
      {
        bookingId,
        status: "CONFIRMED",
        people: { $elemMatch: { seat, status: { $ne: "CANCELLED" } } },
      },
      { $set: { "people.$.status": "CANCELLED" } },
      { new: true }
    );
    if (!booking) {
      return res
        .status(404)
        .json({ message: "Ticket nahi mila ya pehle hi cancel ho chuka hai" });
    }

    // Check: ticket sach mein CANCELLED save hua? (Booking.js model purana ho to nahi hota)
    const person = booking.people.find((p) => p.seat === seat);
    if (!person || person.status !== "CANCELLED") {
      return res.status(500).json({
        message:
          "Ticket cancel save nahi hua. server/src/models/Booking.js mein people ke andar status field check karo.",
      });
    }

    // Is seat ko wapas available karo
    await Seat.updateOne(
      { seatNumber: seat, bookingId },
      { status: "AVAILABLE", bookingId: null, holdToken: null, heldUntil: null }
    );

    // Agar booking ke saare tickets cancel ho gaye to poori booking cancelled
    if (booking.people.every((p) => p.status === "CANCELLED")) {
      booking.status = "CANCELLED";
      await booking.save();
    }

    res.json({ booking });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ message: "Cancel nahi ho paya. Dobara try karo." });
  }
});

export default router;
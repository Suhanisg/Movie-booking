import { Router } from "express";
import { randomBytes } from "crypto";
import Seat from "../models/Seat.js";
import Booking from "../models/Booking.js";

const router = Router();
const MOBILE_RE = /^[6-9]\d{9}$/;

router.post("/", async (req, res) => {
  const { holdToken, people } = req.body;

  // 1. Input validation (frontend par bharosa nahi)
  if (!holdToken || !Array.isArray(people) || people.length === 0) {
    return res.status(400).json({ message: "Details poori nahi hain" });
  }
  for (const p of people) {
    if (!p.seat || !p.name || p.name.trim().length < 2 || !MOBILE_RE.test(p.mobile)) {
      return res.status(400).json({ message: "Naam ya mobile number sahi nahi hai" });
    }
  }
  const mobiles = people.map((p) => p.mobile);
  if (new Set(mobiles).size !== mobiles.length) {
    return res.status(400).json({ message: "Har seat ka alag mobile number chahiye" });
  }

  // 2. Hold abhi valid hai aur bilkul wahi seats hold hain?
  const seatNumbers = people.map((p) => p.seat);
  const held = await Seat.find({
    holdToken,
    status: "HELD",
    heldUntil: { $gt: new Date() },
  });
  const heldNumbers = held.map((s) => s.seatNumber).sort();
  if (JSON.stringify(heldNumbers) !== JSON.stringify([...seatNumbers].sort())) {
    return res.status(409).json({
      code: "HOLD_EXPIRED",
      message: "Seats ka time khatam ho gaya. Dobara seats chuno.",
    });
  }

  // 3. Ye mobile number pehle kisi (cancel na hue) ticket mein to nahi?
  const used = await Booking.findOne({
    status: "CONFIRMED",
    people: {
      $elemMatch: { mobile: { $in: mobiles }, status: { $ne: "CANCELLED" } },
    },
  });
  if (used) {
    const dup = used.people.find(
      (p) => mobiles.includes(p.mobile) && p.status !== "CANCELLED"
    );
    return res.status(409).json({
      message: `Mobile number ${dup.mobile} se pehle hi booking ho chuki hai`,
    });
  }

  // 4. Seats ko BOOKED karo (sirf wahi jo abhi bhi is token ke paas hain)
  const bookingId = "DDC-" + randomBytes(3).toString("hex").toUpperCase();
  const result = await Seat.updateMany(
    { holdToken, status: "HELD", seatNumber: { $in: seatNumbers } },
    { status: "BOOKED", bookingId, holdToken: null, heldUntil: null }
  );
  if (result.modifiedCount !== seatNumbers.length) {
    return res.status(409).json({
      code: "HOLD_EXPIRED",
      message: "Seats ab available nahi hain. Dobara try karo.",
    });
  }

  // 5. Booking save karo (fail ho to seats wapas chhod do)
  try {
    const booking = await Booking.create({
      bookingId,
      people: people.map((p) => ({
        seat: p.seat,
        name: p.name.trim(),
        mobile: p.mobile,
      })),
    });
    res.status(201).json({ bookingId: booking.bookingId, people: booking.people });
  } catch (err) {
    await Seat.updateMany(
      { bookingId },
      { status: "AVAILABLE", bookingId: null }
    );
    res.status(500).json({ message: "Booking save nahi hui. Dobara try karo." });
  }
});

export default router;
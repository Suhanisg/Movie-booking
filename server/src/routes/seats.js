import { Router } from "express";
import { randomUUID } from "crypto";
import Seat from "../models/Seat.js";

const router = Router();
const HOLD_MS = Number(process.env.HOLD_MINUTES || 5) * 60 * 1000;

// Booked aur held seats ki list
router.get("/", async (req, res) => {
  const now = new Date();
  const seats = await Seat.find({ status: { $in: ["BOOKED", "HELD"] } });
  const booked = seats.filter((s) => s.status === "BOOKED").map((s) => s.seatNumber);
  const held = seats
    .filter((s) => s.status === "HELD" && s.heldUntil > now)
    .map((s) => s.seatNumber);
  res.json({ booked, held });
});

// Seats ko kuch minute ke liye hold karo
router.post("/hold", async (req, res) => {
  const { seats } = req.body;
  if (!Array.isArray(seats) || seats.length === 0 || seats.length > 10) {
    return res.status(400).json({ message: "Seats sahi nahi hain" });
  }

  const token = randomUUID();
  const now = new Date();
  const heldUntil = new Date(now.getTime() + HOLD_MS);
  const claimed = [];

  for (const seatNumber of seats) {
    // Sirf wahi seat milegi jo AVAILABLE hai ya jiska hold expire ho chuka hai
    const seat = await Seat.findOneAndUpdate(
      {
        seatNumber,
        $or: [
          { status: "AVAILABLE" },
          { status: "HELD", heldUntil: { $lt: now } },
        ],
      },
      { status: "HELD", holdToken: token, heldUntil }
    );

    if (!seat) {
      // Koi seat nahi mili: jo li thi wo wapas chhod do
      await Seat.updateMany(
        { holdToken: token },
        { status: "AVAILABLE", holdToken: null, heldUntil: null }
      );
      return res.status(409).json({
        message: `Seat ${seatNumber} abhi kisi aur ne le li hai. Dusri seat chuno.`,
      });
    }
    claimed.push(seatNumber);
  }

  res.json({ holdToken: token, expiresAt: heldUntil, seats: claimed });
});

export default router;
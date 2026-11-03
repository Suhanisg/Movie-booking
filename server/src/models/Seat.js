import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ["AVAILABLE", "HELD", "BOOKED"], default: "AVAILABLE" },
  bookingId: { type: String, default: null },
  holdToken: { type: String, default: null },
  heldUntil: { type: Date, default: null },
});

export default mongoose.model("Seat", seatSchema);
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  people: [
    {
      seat: String,
      name: String,
      mobile: String,
      status: { type: String, enum: ["CONFIRMED", "CANCELLED"], default: "CONFIRMED" },
    },
  ],
  status: { type: String, enum: ["CONFIRMED", "CANCELLED"], default: "CONFIRMED" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", bookingSchema);
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import Seat from "../models/Seat.js";
import { ALL_SEATS } from "./layout.js";

// Pehli baar chalne par saari seats bana do (baad mein kuch nahi badlega)
const seedSeats = async () => {
  await Seat.bulkWrite(
    ALL_SEATS.map((seatNumber) => ({
      updateOne: {
        filter: { seatNumber },
        update: { $setOnInsert: { seatNumber, status: "AVAILABLE" } },
        upsert: true,
      },
    }))
  );
  console.log(`Seats ready: ${ALL_SEATS.length}`);
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedSeats();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
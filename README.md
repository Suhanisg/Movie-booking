# DD Cinema - Movie Seat Booking System

A mobile-first seat-booking web app for a community movie screening. Visitors pick seats on a theatre-style seat map and book them for free, while an admin panel lets the organizer monitor and manage every booking in real time. All bookings are stored in MongoDB.

**Live Demo:** [movie-booking-taupe.vercel.app](https://movie-booking-taupe.vercel.app/)

## Features

### For Visitors
- **Theatre-style seat map:** pick one or more seats from a layout modelled on a real cinema hall, with row and seat labels (for example D04)
- **Details for every seat:** each seat in a booking gets its own name and mobile number, and names must include a first name and surname
- **Duplicate protection:** a mobile number can be used in only one active booking, so the same person cannot block extra seats
- **Live availability:** booked seats are marked on the map and cannot be selected again, which prevents double-booking
- **Privacy on the public map:** attendee names are not shown on the seat map
- **Booking confirmation:** after booking, a ticket with a unique booking ID and all attendee names is shown
- **Mobile-first design:** a minimal, warm-toned interface built for phones, since most users open the link from a chat group

### For the Admin
- **Admin dashboard:** live count of seats booked and seats available
- **Tickets and Cancelled tabs:** see all active bookings, and a separate list of cancelled ones
- **Search:** find a booking by name, mobile number or seat
- **Sorting:** newest first, oldest first, or by seat number
- **Booking details:** each entry shows the seat, name, mobile number, booking ID and the date and time of booking
- **Cancel booking:** the admin can cancel a booking, which frees the seats for others and updates the seat map
- **Refresh and logout** controls for quick updates and secure sign-out

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Deployment | Vercel (frontend) |

## How It Works

1. The seat map is loaded from the database, so every visitor sees the current availability.
2. When a visitor confirms a booking, the server validates the names and mobile numbers, checks that the seats are still free and that no mobile number is already used in an active booking, then saves the booking in MongoDB.
3. The admin panel reads the same data, so new bookings and cancellations show up there right away.
4. When the admin cancels a booking, its seats are released and the seat map updates for everyone.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (local installation or a MongoDB Atlas connection string)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Suhanisg/Movie-booking.git
   cd Movie-booking
   ```

2. Set up the backend

   ```bash
   cd server
   npm install
   ```

   Create a `.env` file in the `server` folder:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   ADMIN_PASSWORD=your_admin_password
   ```

   Start the server:

   ```bash
   npm start
   ```

3. Set up the frontend

   ```bash
   cd client
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser. The admin panel is available at `/admin`.

## What I Learned

- Designing booking rules that avoid double-booking and duplicate mobile numbers
- Building a mobile-first interface for non-technical users
- Creating a simple admin panel with search, sorting and cancellation
- Deploying a full-stack MERN application and keeping the data in sync across pages

## Author

**Suhani Goyal**
[GitHub](https://github.com/Suhanisg) | [LinkedIn](https://linkedin.com/in/suhanisg)

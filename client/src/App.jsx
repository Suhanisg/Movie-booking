import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import SeatSelection from "./pages/SeatSelection";
import Ticket from "./pages/Ticket";
import Details from "./pages/Details";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/seats" element={<SeatSelection />} />
        <Route path="/details" element={<Details />} />
        <Route path="/admin" element={<Admin />} />
<Route path="/ticket" element={<Ticket />} />
      </Routes>
    </BrowserRouter>
  );
}
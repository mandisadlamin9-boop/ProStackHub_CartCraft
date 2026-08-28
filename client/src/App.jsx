import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Cart from "./pages/Cart";
import OrderSuccess from "./pages/OrderSuccess";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-success" element={<OrderSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

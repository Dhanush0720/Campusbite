import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import GuestCheckout from './pages/GuestCheckout';

import StudentDashboard from './pages/student/Dashboard';
import Menu from './pages/student/Menu';
import FoodDetails from './pages/student/FoodDetails';
import Cart from './pages/student/Cart';
import Checkout from './pages/student/Checkout';
import Payment from './pages/student/Payment';
import QRCodePage from './pages/student/QRCodePage';
import OrderTracking from './pages/student/OrderTracking';
import StudentWallet from './pages/student/Wallet';
import SpendingDashboard from './pages/student/SpendingDashboard';
import OrderHistory from './pages/student/OrderHistory';
import Profile from './pages/student/Profile';

import StaffDashboard from './pages/staff/Dashboard';
import QRScanner from './pages/staff/QRScanner';
import StaffHistory from './pages/staff/History';

import ManagerDashboard from './pages/manager/Dashboard';
import ManagerMenu from './pages/manager/Menu';
import ManagerOrders from './pages/manager/Orders';
import Inventory from './pages/manager/Inventory';
import Reports from './pages/manager/Reports';
import StaffPage from './pages/manager/Staff';

function App() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Guest flow - no login required, mirrors the student ordering flow */}
        <Route path="/guest" element={<GuestCheckout />} />
        <Route path="/guest/menu" element={<Menu />} />
        <Route path="/guest/food/:id" element={<FoodDetails />} />
        <Route path="/guest/cart" element={<Cart />} />
        <Route path="/guest/checkout" element={<Checkout />} />
        <Route path="/guest/payment/:orderId" element={<Payment />} />
        <Route path="/guest/qr/:orderId" element={<QRCodePage />} />
        <Route path="/guest/orders/:orderId/track" element={<OrderTracking />} />

        {/* Student + Lecturer */}
        <Route path="/student" element={<ProtectedRoute roles={['student', 'lecturer']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/menu" element={<ProtectedRoute roles={['student', 'lecturer']}><Menu /></ProtectedRoute>} />
        <Route path="/student/food/:id" element={<ProtectedRoute roles={['student', 'lecturer']}><FoodDetails /></ProtectedRoute>} />
        <Route path="/student/cart" element={<ProtectedRoute roles={['student', 'lecturer']}><Cart /></ProtectedRoute>} />
        <Route path="/student/checkout" element={<ProtectedRoute roles={['student', 'lecturer']}><Checkout /></ProtectedRoute>} />
        <Route path="/student/payment/:orderId" element={<ProtectedRoute roles={['student', 'lecturer']}><Payment /></ProtectedRoute>} />
        <Route path="/student/qr/:orderId" element={<ProtectedRoute roles={['student', 'lecturer']}><QRCodePage /></ProtectedRoute>} />
        <Route path="/student/orders/:orderId/track" element={<ProtectedRoute roles={['student', 'lecturer']}><OrderTracking /></ProtectedRoute>} />
        <Route path="/student/wallet" element={<ProtectedRoute roles={['student', 'lecturer']}><StudentWallet /></ProtectedRoute>} />
        <Route path="/student/spending" element={<ProtectedRoute roles={['student', 'lecturer']}><SpendingDashboard /></ProtectedRoute>} />
        <Route path="/student/orders" element={<ProtectedRoute roles={['student', 'lecturer']}><OrderHistory /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute roles={['student', 'lecturer']}><Profile /></ProtectedRoute>} />

        {/* Staff */}
        <Route path="/staff" element={<ProtectedRoute roles={['staff', 'manager', 'admin']}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/scanner" element={<ProtectedRoute roles={['staff', 'manager', 'admin']}><QRScanner /></ProtectedRoute>} />
        <Route path="/staff/history" element={<ProtectedRoute roles={['staff', 'manager', 'admin']}><StaffHistory /></ProtectedRoute>} />

        {/* Manager / Admin */}
        <Route path="/manager" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/manager/menu" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerMenu /></ProtectedRoute>} />
        <Route path="/manager/orders" element={<ProtectedRoute roles={['manager', 'admin']}><ManagerOrders /></ProtectedRoute>} />
        <Route path="/manager/inventory" element={<ProtectedRoute roles={['manager', 'admin']}><Inventory /></ProtectedRoute>} />
        <Route path="/manager/reports" element={<ProtectedRoute roles={['manager', 'admin']}><Reports /></ProtectedRoute>} />
        <Route path="/manager/staff" element={<ProtectedRoute roles={['manager', 'admin']}><StaffPage /></ProtectedRoute>} />

        <Route path="*" element={<Landing />} />
      </Routes>
    </div>
  );
}

export default App;

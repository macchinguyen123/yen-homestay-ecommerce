import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import UserLayout from '../layouts/UserLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout';

// Pages
import HomestayDetail from '../pages/user/HomestayDetail/HomestayDetail';
import OwnerDashboard from '../pages/owner/Dashboard/OwnerDashboard';
import AddPackage from '../pages/owner/AddPackage/AddPackage';
import ManageService from '../pages/owner/ManageService/ManageService';
import ManageBooking from '../pages/owner/ManageBooking/ManageBooking';
import ManageDiscount from '../pages/owner/ManageDiscount/ManageDiscount';
import AdminDashboard from '../pages/admin/Dashboard/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── 1. KHU VỰC KHÁCH HÀNG (USER / PUBLIC) ── */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<HomestayDetail />} />
        <Route path="/homestay/:id" element={<HomestayDetail />} />
      </Route>

      {/* ── 2. KHU VỰC CHỦ HOMESTAY (OWNER / HOST) ── */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
        <Route element={<OwnerLayout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/services" element={<ManageService />} />
          <Route path="/owner/bookings" element={<ManageBooking />} />
          <Route path="/owner/discounts" element={<ManageDiscount />} />
          <Route path="/owner/packages" element={<AddPackage />} />
          <Route path="/owner/add-package" element={<AddPackage />} />
        </Route>
      </Route>

      {/* ── 3. KHU VỰC ADMIN HỆ THỐNG (ADMIN) ── */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

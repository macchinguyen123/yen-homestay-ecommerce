import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import UserLayout from '../layouts/UserLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout';

// User Pages
import Homepage from '../pages/user/Homepage/Homepage';
import HomestayDetail from '../pages/user/HomestayDetail/HomestayDetail';
import BookingAndPay from '../pages/user/BookingAndPay/BookingAndPay';
import Bookings from '../pages/user/Bookings/Bookings';
import CompletePay from '../pages/user/CompletePay/CompletePay';
import Login from '../pages/user/Login/Login';
import Register from '../pages/user/Register/Register';
import Verify from '../pages/user/Verify/Verify';
import Notifications from '../pages/user/Notifications/Notifications';
import PersonalAccount from '../pages/user/PersonalAccount/PersonalAccount';
import Promotions from '../pages/user/Promotions/Promotions';
import SearchResult from '../pages/user/SearchResult/SearchResult';
import Support from '../pages/user/Support/Support';
import Wishlist from '../pages/user/Wishlist/Wishlist';

// Owner Pages
import OwnerDashboard from '../pages/owner/Dashboard/OwnerDashboard';
import ManageHomestay from '../pages/owner/ManageHomestay/ManageHomestay';
import ManageRoom from '../pages/owner/ManageRoom/ManageRoom';
import ManageService from '../pages/owner/ManageService/ManageService';
import ManageBooking from '../pages/owner/ManageBooking/ManageBooking';
import ManageMission from '../pages/owner/ManageMission/ManageMission';
import ManageReviews from '../pages/owner/ManageReviews/ManageReviews';
import ManageDiscount from '../pages/owner/ManageDiscount/ManageDiscount';
import ManageRevenue from '../pages/owner/ManageRevenue/ManageRevenue';
import AddPackage from '../pages/owner/AddPackage/AddPackage';
import Settings from '../pages/owner/Settings/Settings';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard/AdminDashboard';
import AccountManagement from '../pages/admin/AccountManagement/AccountManagement';
import AccountEdit from '../pages/admin/AccountEdit/AccountEdit';
import AdsManagement from '../pages/admin/AdsManagement/AdsManagement';
import ComplaintsManagement from '../pages/admin/ComplaintsManagement/ComplaintsManagement';
import HomestayEdit from '../pages/admin/HomestayEdit/HomestayEdit';
import LocalContent from '../pages/admin/LocalContent/LocalContent';
import AdminManageHomestay from '../pages/admin/ManageHomestay/ManageHomestay';
import ManageTransactions from '../pages/admin/ManageTransactions/ManageTransactions';
import ReportsStatistics from '../pages/admin/ReportsStatistics/ReportsStatistics';
import VoucherManagement from '../pages/admin/VoucherManagement/VoucherManagement';

import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── 0. TRANG ĐĂNG NHẬP / ĐĂNG KÝ (STANDALONE) ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />

      {/* ── 1. KHU VỰC KHÁCH HÀNG (USER / PUBLIC) ── */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Homepage />} />
        <Route path="/homestay" element={<HomestayDetail />} />
        <Route path="/homestay/:id" element={<HomestayDetail />} />
        <Route path="/room" element={<HomestayDetail />} />
        <Route path="/room/:id" element={<HomestayDetail />} />
        <Route path="/room-detail" element={<HomestayDetail />} />
        <Route path="/room-detail/:id" element={<HomestayDetail />} />
        <Route path="/chi-tiet-phong" element={<HomestayDetail />} />
        <Route path="/chi-tiet-phong/:id" element={<HomestayDetail />} />
        <Route path="/booking" element={<BookingAndPay />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/complete-pay" element={<CompletePay />} />
        <Route path="/booking/complete" element={<CompletePay />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/account" element={<PersonalAccount />} />
        <Route path="/personal-account" element={<PersonalAccount />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/search" element={<SearchResult />} />
        <Route path="/search-result" element={<SearchResult />} />
        <Route path="/support" element={<Support />} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Route>

      {/* ── 2. KHU VỰC CHỦ HOMESTAY (OWNER / HOST) ── */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
        <Route element={<OwnerLayout />}>
          <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/homestays" element={<ManageHomestay />} />
          <Route path="/owner/homestay" element={<ManageHomestay />} />
          <Route path="/owner/rooms" element={<ManageRoom />} />
          <Route path="/owner/manage-room" element={<ManageRoom />} />
          <Route path="/owner/services" element={<ManageService />} />
          <Route path="/owner/bookings" element={<ManageBooking />} />
          <Route path="/owner/missions" element={<ManageMission />} />
          <Route path="/owner/reviews" element={<ManageReviews />} />
          <Route path="/owner/discounts" element={<ManageDiscount />} />
          <Route path="/owner/revenue" element={<ManageRevenue />} />
          <Route path="/owner/packages" element={<AddPackage />} />
          <Route path="/owner/add-package" element={<AddPackage />} />
          <Route path="/owner/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* ── 3. KHU VỰC ADMIN HỆ THỐNG (ADMIN) ── */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/accounts" element={<AccountManagement />} />
          <Route path="/admin/accounts/edit" element={<AccountEdit />} />
          <Route path="/admin/ads" element={<AdsManagement />} />
          <Route path="/admin/complaints" element={<ComplaintsManagement />} />
          <Route path="/admin/homestays" element={<AdminManageHomestay />} />
          <Route path="/admin/homestays/edit" element={<HomestayEdit />} />
          <Route path="/admin/local-content" element={<LocalContent />} />
          <Route path="/admin/transactions" element={<ManageTransactions />} />
          <Route path="/admin/reports" element={<ReportsStatistics />} />
          <Route path="/admin/vouchers" element={<VoucherManagement />} />
        </Route>
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

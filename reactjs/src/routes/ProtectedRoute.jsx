import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute component
 * Hỗ trợ phân quyền dựa trên role của người dùng.
 * Cho mục đích demo hiện tại, chúng ta bật mặc định cho phép truy cập.
 */
export default function ProtectedRoute({ allowedRoles }) {
  // Demo mock user role (Có thể là 'USER', 'OWNER', hoặc 'ADMIN')
  const userRole = localStorage.getItem('user_role') || 'ADMIN'; // Mặc định mở để trải nghiệm

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

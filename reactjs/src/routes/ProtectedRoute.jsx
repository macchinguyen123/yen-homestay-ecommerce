import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute component
 * Hỗ trợ phân quyền dựa trên vai trò thực tế của người dùng sau khi đăng nhập.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const rawRole = (localStorage.getItem('user_role') || sessionStorage.getItem('userRole') || '').toUpperCase();
  const normalizedRole = rawRole === 'HOST' ? 'OWNER' : (rawRole === 'GUEST' || rawRole === 'USER') ? 'TOURIST' : rawRole;

  if (allowedRoles && allowedRoles.length > 0) {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || Boolean(localStorage.getItem('user'));
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }

    const isAllowed = allowedRoles.some((r) => {
      const upperR = r.toUpperCase();
      return upperR === normalizedRole || (upperR === 'OWNER' && (normalizedRole === 'OWNER' || normalizedRole === 'HOST'));
    });

    if (!isAllowed) {
      if (normalizedRole === 'OWNER') {
        return <Navigate to="/owner/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}

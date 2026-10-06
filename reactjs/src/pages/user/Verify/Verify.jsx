import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/authService';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Đang xác thực tài khoản...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Mã xác thực không hợp lệ hoặc đã hết hạn.');
      return;
    }

    authService.verifyEmail(token).then((res) => {
      if (res.success) {
        setStatus('success');
        setMessage(res.message || 'Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay.');
      } else {
        setStatus('error');
        setMessage(res.message || 'Xác thực không thành công.');
      }
    });
  }, [searchParams]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 20 }}>
      <div style={{ maxWidth: 460, width: '100%', background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
        {status === 'loading' && (
          <div>
            <div className="spinner-border text-success" role="status" style={{ width: 48, height: 48, marginBottom: 16 }}></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Đang xác thực...</h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem' }}>{message}</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 16 }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Xác thực thành công!</h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: 24 }}>{message}</p>
            <Link to="/login" style={{ display: 'inline-block', background: '#15803D', color: '#fff', padding: '10px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
              Đăng nhập ngay
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 16 }}>
              ✕
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Xác thực thất bại</h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: 24 }}>{message}</p>
            <Link to="/login" style={{ display: 'inline-block', background: '#334155', color: '#fff', padding: '10px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
              Về trang đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

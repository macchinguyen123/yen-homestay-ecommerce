import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          maxWidth: '900px',
          margin: '40px auto',
          background: '#FFF5F5',
          border: '2px solid #FEB2B2',
          borderRadius: '12px',
          fontFamily: 'system-ui, sans-serif',
          color: '#2D3748',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px' }}>⚠️</span>
            <h2 style={{ margin: 0, color: '#C53030', fontSize: '20px', fontWeight: 700 }}>
              Đã xảy ra lỗi khi hiển thị giao diện
            </h2>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#4A5568' }}>
            <strong>Chi tiết lỗi:</strong> {this.state.error?.toString()}
          </p>
          <pre style={{
            background: '#2D3748',
            color: '#F7FAFC',
            padding: '16px',
            borderRadius: '8px',
            overflowX: 'auto',
            fontSize: '13px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.stack || this.state.errorInfo?.componentStack || 'Không có stack trace'}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#C53030',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Tải lại trang (F5)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

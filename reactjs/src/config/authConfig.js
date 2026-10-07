
export const AUTH_CONFIG = {
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID,
    API_BASE_URL:
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/auth',
};
export const isConfigured = (key) => {
  if (!key) return false;
  return !key.includes('YOUR_GOOGLE_CLIENT_ID') && !key.includes('YOUR_FACEBOOK_APP_ID');
};

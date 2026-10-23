/**
 * Tiện ích khởi tạo Facebook JavaScript SDK
 */
let fbInitPromise = null;

export function initFacebookSdk() {
  if (fbInitPromise) return fbInitPromise;

  fbInitPromise = new Promise((resolve) => {
    // Nếu SDK đã sẵn sàng
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    const appId = import.meta.env.VITE_FACEBOOK_APP_ID || '';

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId || '1234567890', // fallback nếu chưa có App ID
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
      resolve(window.FB);
    };

    // Tải script SDK nếu chưa có trong DOM
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      js.async = true;
      js.defer = true;
      js.onerror = () => {
        console.warn('Không thể tải Facebook SDK');
        resolve(null);
      };
      document.body.appendChild(js);
    }
  });

  return fbInitPromise;
}

/**
 * Mở popup đăng nhập Facebook và lấy thông tin user (id, name, email, picture)
 */
export async function loginWithFacebookPopup() {
  const FB = await initFacebookSdk();
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // Nếu người dùng chưa cấu hình App ID trong .env, fallback prompt hoặc demo
  if (!appId || appId === '1234567890' || !FB) {
    throw new Error('MISSING_APP_ID');
  }

  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        if (response.authResponse) {
          const { accessToken, userID } = response.authResponse;
          // Gọi Graph API lấy email, name, avatar
          FB.api('/me', { fields: 'id,name,email,picture.width(200).height(200)' }, (userInfo) => {
            if (!userInfo || userInfo.error) {
              reject(new Error(userInfo?.error?.message || 'Không thể lấy thông tin từ Facebook'));
              return;
            }
            resolve({
              facebookId: userInfo.id || userID,
              fullName: userInfo.name,
              email: userInfo.email,
              avatar: userInfo.picture?.data?.url || '',
              accessToken,
            });
          });
        } else {
          reject(new Error('Người dùng đã hủy đăng nhập Facebook hoặc bị chặn'));
        }
      },
      { scope: 'public_profile,email' }
    );
  });
}

// Lightweight Facebook Web SDK loader and helpers
type FBInitOptions = {
  appId: string;
  version?: string;
};

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB: any;
  }
}

export function loadFacebookSdk({ appId, version = 'v17.0' }: FBInitOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!appId) {
      reject(new Error('Facebook App ID is required'));
      return;
    }

    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId,
          cookie: true,
          xfbml: false,
          version,
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    };

    const existing = document.getElementById('facebook-jssdk');
    if (existing) {
      // script already injected but FB not ready yet
      // rely on fbAsyncInit
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = `https://connect.facebook.net/en_US/sdk.js`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    const first = document.getElementsByTagName('script')[0];
    if (first && first.parentNode) {
      first.parentNode.insertBefore(script, first);
    } else {
      document.head.appendChild(script);
    }
  });
}

export async function ensureFacebook(appId: string) {
  await loadFacebookSdk({ appId });
}

export function fbLogin(): Promise<{ authResponse: any } | null> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('FB SDK not loaded'));
      return;
    }
    window.FB.getLoginStatus((resp: any) => {
      if (resp.status === 'connected') {
        resolve(resp);
        return;
      }
      window.FB.login((loginResp: any) => {
        if (loginResp.status === 'connected') {
          resolve(loginResp);
        } else {
          resolve(null);
        }
      }, { scope: 'public_profile' });
    });
  });
}

export function fbShare({ href, quote }: { href: string; quote?: string }): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('FB SDK not loaded'));
      return;
    }
    window.FB.ui(
      {
        method: 'share',
        href,
        quote,
      },
      (response: any) => {
        resolve(response);
      }
    );
  });
}

export async function getProfile(): Promise<{ id?: string; name?: string; pictureUrl?: string } | null> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('FB SDK not loaded'));
      return;
    }
    // Request picture field too
    window.FB.api('/me', { fields: 'id,name,picture' }, (resp: any) => {
      if (!resp || resp.error) {
        resolve(null);
      } else {
        const pictureUrl = resp.picture && resp.picture.data && resp.picture.data.url ? resp.picture.data.url : undefined;
        resolve({ id: resp.id, name: resp.name, pictureUrl });
      }
    });
  });
}

export function fbLogout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('FB SDK not loaded'));
      return;
    }
    window.FB.getLoginStatus((resp: any) => {
      if (resp && resp.status === 'connected') {
        window.FB.logout((logoutResp: any) => {
          resolve();
        });
      } else {
        // not logged in
        resolve();
      }
    });
  });
}

export default {
  loadFacebookSdk,
  ensureFacebook,
  fbLogin,
  fbShare,
  fbLogout,
  getProfile,
};

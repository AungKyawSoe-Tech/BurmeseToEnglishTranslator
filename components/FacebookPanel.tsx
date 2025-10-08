import React, { useEffect, useState } from 'react';
import facebookService from '../services/facebookService';

const appId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export const FacebookPanel: React.FC<{ shareText?: string }> = ({ shareText }) => {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<{ id?: string; name?: string; pictureUrl?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    // load persisted profile if present
    try {
      const stored = localStorage.getItem('fb_profile');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}

    if (!appId) {
      setError('VITE_FACEBOOK_APP_ID is not set. Facebook features are disabled.');
      return;
    }
    facebookService.ensureFacebook(appId).then(() => {
      setInitialized(true);
      // Attempt to refresh profile if logged in
      facebookService.fbLogin().then((status) => {
        if (status && status.authResponse) {
          facebookService.getProfile().then((p) => {
            setUser(p);
            try { localStorage.setItem('fb_profile', JSON.stringify(p)); } catch {}
          }).catch(() => {});
        }
      }).catch(() => {});
    }).catch((e) => {
      console.error('FB init error', e);
      setError('Failed to initialize Facebook SDK');
    });
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      const resp = await facebookService.fbLogin();
      if (resp && resp.authResponse) {
        const profile = await facebookService.getProfile();
        setUser(profile);
        try { localStorage.setItem('fb_profile', JSON.stringify(profile)); } catch {}
      }
    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      // Confirm
      if (!confirm('Log out from Facebook?')) return;
      await facebookService.fbLogout();
      setUser(null);
      try { localStorage.removeItem('fb_profile'); } catch {}
    } catch (e: any) {
      setError(e?.message ?? 'Logout failed');
    }
  };

  const handleShare = async () => {
    setError(null);
    try {
      const text = shareText || '';
      const apiBase = (import.meta.env as any).VITE_SHARE_API as string | undefined;
      let responseJson: any = null;

      if (apiBase !== undefined) {
        // If explicitly set to empty string, skip API
        if (apiBase) {
          try {
            const resp = await fetch(`${apiBase.replace(/\/$/, '')}/api/share`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text }),
            });
            if (resp.ok) {
              responseJson = await resp.json();
            } else {
              // API failed - fall through to local fallback
              console.warn('Share API failed:', resp.status);
            }
          } catch (e) {
            console.warn('Share API error', e);
          }
        }
      } else {
        // default: use relative path
        try {
          const resp = await fetch(`/api/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
          if (resp.ok) responseJson = await resp.json();
        } catch (e) {
          console.warn('Relative share API error', e);
        }
      }

      if (responseJson && responseJson.url) {
        const url = responseJson.url;
        try {
          await navigator.clipboard.writeText(url);
          setCopiedLink(url);
          setTimeout(() => setCopiedLink(null), 4000);
        } catch (e) {}
        await facebookService.fbShare({ href: url, quote: text });
        return;
      }

      // Fallback: local storage as before
      const id = generateId();
      const sharesRaw = localStorage.getItem('shares');
      const shares = sharesRaw ? JSON.parse(sharesRaw) : {};
      shares[id] = { id, text, createdAt: Date.now() };
      try { localStorage.setItem('shares', JSON.stringify(shares)); } catch {}
      const url = `${window.location.origin}/share?id=${encodeURIComponent(id)}`;
      try { await navigator.clipboard.writeText(url); setCopiedLink(url); setTimeout(() => setCopiedLink(null), 4000); } catch (e) {}
      await facebookService.fbShare({ href: url, quote: text });
    } catch (e: any) {
      setError(e?.message ?? 'Share failed');
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-white dark:bg-slate-800">
      <h3 className="text-lg font-medium">Facebook</h3>
      {!appId && (
        <p className="text-sm text-rose-600">VITE_FACEBOOK_APP_ID not configured — Facebook features disabled.</p>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        {user ? (
          <>
            {user.pictureUrl && <img src={user.pictureUrl} alt="avatar" className="w-10 h-10 rounded-full" />}
            <div className="text-sm">Signed in as <strong>{user.name}</strong></div>
            <button onClick={handleShare} className="ml-auto inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full">Share translation</button>
            <button onClick={handleLogout} className="ml-3 inline-flex items-center px-3 py-2 bg-slate-200 text-slate-700 rounded-full">Logout</button>
          </>
        ) : (
          <button onClick={handleLogin} disabled={!initialized || !!error} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full">
            Sign in with Facebook
          </button>
        )}
      </div>
      {copiedLink && <div className="mt-2 text-sm text-slate-600">Link copied: <a className="underline" href={copiedLink}>{copiedLink}</a></div>}
    </div>
  );
};

export default FacebookPanel;

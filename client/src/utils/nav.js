/**
 * "Return to where you were going" helpers.
 * A logged-out visitor who clicks e.g. Explore is sent to /login?next=/explore.
 * After login OR registration the app sends them to `next`.
 */

// Only same-site paths are accepted ("/explore"), never "https://evil.com" or "//evil.com".
export const safeNext = (value) => {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  if (/^\/(login|register)(\/|\?|$)/.test(value)) return null; // never bounce back to the login screen
  return value;
};

export const authUrl = (mode, next) => {
  const n = safeNext(next);
  return `/${mode}${n ? `?next=${encodeURIComponent(n)}` : ''}`;
};

export const defaultLanding = (user) => (user?.role === 'admin' ? '/admin' : '/explore');

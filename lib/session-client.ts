export const SESSION_STORAGE_KEY = 'luxemoon:user-session';
export const SESSION_STORAGE_TTL_MS = 5 * 60 * 1000;
export const SESSION_CHANGED_EVENT = 'luxemoon:session-changed';

export type SessionState = {
  authenticated: boolean;
  user?: {
    userId?: string;
    email?: string;
    name?: string;
  };
};

type CachedSession = {
  data: SessionState;
  timestamp: number;
};

export function readCachedSession(): SessionState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedSession;
    if (Date.now() - cached.timestamp > SESSION_STORAGE_TTL_MS) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return cached.data;
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function writeCachedSession(session: SessionState) {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      data: session,
      timestamp: Date.now(),
    } satisfies CachedSession)
  );
}

export function clearCachedSession() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function emitSessionChanged(session: SessionState) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT, { detail: session }));
}

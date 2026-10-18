/**
 * Browser Credential Manager & Persistent Session Engine
 * Integrates with standard browser Password Managers (Chrome, Edge, Safari, Firefox)
 * and maintains continuous logged-in state across inactivity and restarts.
 */

export interface StoredCredential {
  username: string;
  password?: string;
  displayName?: string;
  role?: string;
  schoolName?: string;
  schoolCode?: string;
}

// =========================================================================
// 1. BROWSER CREDENTIAL MANAGEMENT API (Web Standard navigator.credentials)
// =========================================================================

/**
 * Stores credentials in the browser's native Password Manager (e.g. Google Password Manager, Apple Keychain, Edge Wallet)
 */
export async function storeBrowserCredential(data: {
  username: string;
  password?: string;
  displayName?: string;
  role?: 'officer' | 'principal';
}): Promise<boolean> {
  const { username, password, displayName, role } = data;
  if (!username) return false;

  // Resilient local storage for instant auto-fill and pre-filling
  try {
    if (role === 'principal') {
      localStorage.setItem('saved_principal_school_name_v1', username);
    } else {
      localStorage.setItem('saved_login_username_v1', username);
    }
    if (displayName) {
      localStorage.setItem('saved_login_display_name_v1', displayName);
    }
    localStorage.setItem('remember_me_login_enabled_v1', 'true');
  } catch (_) {}

  // Native Browser Credential Management API (PasswordCredential standard)
  if (
    typeof window !== 'undefined' &&
    'PasswordCredential' in window &&
    navigator.credentials &&
    typeof navigator.credentials.store === 'function' &&
    password
  ) {
    try {
      const PasswordCred = (window as any).PasswordCredential;
      const cred = new PasswordCred({
        id: username,
        password: password,
        name: displayName || username
      });
      await navigator.credentials.store(cred);
      return true;
    } catch (err) {
      // Browsers may block if not invoked directly in trusted user gesture or origin constraints
      console.info('Browser native credential store fallback used:', err);
    }
  }

  return true;
}

/**
 * Retrieves saved credentials from browser native manager or localStorage
 */
export async function getBrowserCredential(): Promise<StoredCredential | null> {
  // 1. Try Browser Credential Management API
  if (
    typeof window !== 'undefined' &&
    navigator.credentials &&
    typeof navigator.credentials.get === 'function'
  ) {
    try {
      const cred = (await (navigator.credentials as any).get({
        password: true,
        mediation: 'silent'
      })) as any;

      if (cred && cred.id) {
        return {
          username: cred.id,
          password: cred.password || '',
          displayName: cred.name || cred.id
        };
      }
    } catch (_) {}
  }

  // 2. Fallback to localStorage saved username
  try {
    const savedUser = localStorage.getItem('saved_login_username_v1');
    const savedName = localStorage.getItem('saved_login_display_name_v1');
    if (savedUser) {
      return {
        username: savedUser,
        displayName: savedName || savedUser
      };
    }
  } catch (_) {}

  return null;
}

export function getSavedUsername(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('saved_login_username_v1') || '';
  } catch (_) {
    return '';
  }
}

export function getSavedSchoolName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('saved_principal_school_name_v1') || '';
  } catch (_) {
    return '';
  }
}

export function isKeepLoggedInEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem('remember_me_login_enabled_v1');
    return val !== 'false';
  } catch (_) {
    return true;
  }
}

export function setKeepLoggedInEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('remember_me_login_enabled_v1', enabled ? 'true' : 'false');
  } catch (_) {}
}

// =========================================================================
// 2. SESSION PERSISTENCE ENGINE (ANTI-LOGOUT ACROSS INACTIVITY)
// =========================================================================

const SESSION_ROLE_KEY = 'session_user_role_v1';
const OFFICER_AUTH_KEY = 'officer_authenticated_v1';
const ACTIVE_OFFICER_KEY = 'active_officer_id_v1';
const PRINCIPAL_SESSION_KEY = 'principal_session_v1';
const LAST_ACTIVE_KEY = 'session_last_active_v1';

/**
 * Check if an active officer session exists and should be restored
 * Persists indefinitely across inactivity, browser restarts, and tab closures
 */
export function getPersistedOfficerSession(): { isAuthenticated: boolean; officerId: string | null } {
  if (typeof window === 'undefined') return { isAuthenticated: false, officerId: null };
  try {
    const isAuth = localStorage.getItem(OFFICER_AUTH_KEY) === 'true';
    const role = localStorage.getItem(SESSION_ROLE_KEY);
    const officerId = localStorage.getItem(ACTIVE_OFFICER_KEY);

    // If either authenticated is true or role is admin, keep active session indefinitely
    if (isAuth || role === 'admin') {
      localStorage.setItem(OFFICER_AUTH_KEY, 'true');
      localStorage.setItem(SESSION_ROLE_KEY, 'admin');
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      return { isAuthenticated: true, officerId: officerId || 'emp_1' };
    }
  } catch (_) {}
  return { isAuthenticated: false, officerId: null };
}

/**
 * Persist officer session permanently
 */
export function persistOfficerSession(officerId: string = 'emp_1'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_ROLE_KEY, 'admin');
    localStorage.setItem(OFFICER_AUTH_KEY, 'true');
    localStorage.setItem(ACTIVE_OFFICER_KEY, officerId);
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch (_) {}
}

/**
 * Clear officer session on explicit logout
 */
export function clearOfficerSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_ROLE_KEY);
    localStorage.removeItem(OFFICER_AUTH_KEY);
    localStorage.removeItem(ACTIVE_OFFICER_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch (_) {}
}

/**
 * Check if a principal session exists and should be restored
 * Persists indefinitely across inactivity, browser restarts, and tab closures
 */
export function getPersistedPrincipalSession(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(PRINCIPAL_SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.schoolName || parsed.schoolCode)) {
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        return parsed;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Persist principal session permanently
 */
export function persistPrincipalSession(session: any): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(PRINCIPAL_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem('portal_view_v1', 'principal-dashboard');
      if (session.schoolName) {
        localStorage.setItem('saved_principal_school_name_v1', session.schoolName);
      }
      if (session.schoolCode) {
        localStorage.setItem('saved_principal_school_code_v1', session.schoolCode);
      }
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    } else {
      localStorage.removeItem(PRINCIPAL_SESSION_KEY);
      localStorage.removeItem('portal_view_v1');
    }
  } catch (_) {}
}

/**
 * Continuous Activity Keep-Alive Listener
 * Keeps user session fresh and touches timestamp on any interaction without logging out
 */
export function initSessionKeepAlive(): () => void {
  if (typeof window === 'undefined') return () => {};

  let lastTouch = Date.now();
  const touchActivity = () => {
    const now = Date.now();
    // Throttle writing to localStorage to once every 60 seconds
    if (now - lastTouch > 60000) {
      lastTouch = now;
      try {
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      } catch (_) {}
    }
  };

  const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'visibilitychange'];
  events.forEach((evt) => window.addEventListener(evt, touchActivity, { passive: true }));

  return () => {
    events.forEach((evt) => window.removeEventListener(evt, touchActivity));
  };
}

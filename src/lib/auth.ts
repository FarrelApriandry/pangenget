import { createAuthClient } from "@neon/auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

const AUTH_URL =
  typeof window !== "undefined" && (window as any).__NEON_AUTH_URL__
    ? (window as any).__NEON_AUTH_URL__
    : import.meta.env.PUBLIC_NEON_AUTH_URL ||
      "https://ep-orange-sunset-biajbcfz.neonauth.c-5.ap-southeast-1.aws.neon.tech/neondb/auth";

export const authClient = createAuthClient(AUTH_URL);

const STORAGE_KEY = "pangenget_auth_user";
const COOKIE_NAME = "pangenget_user_id";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(user.id)}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.removeItem(STORAGE_KEY);
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    }
    window.dispatchEvent(new CustomEvent("pangenget:auth_change", { detail: user }));
  } catch (err) {
    console.error("Failed to persist user session:", err);
  }
}

export async function logOut(): Promise<void> {
  try {
    await authClient.signOut();
  } catch (e) {
    console.warn("Sign out remote warning:", e);
  } finally {
    setStoredUser(null);
  }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const user = getStoredUser();
  const headers = new Headers(init.headers || {});

  if (user?.id) {
    headers.set("x-user-id", user.id);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}

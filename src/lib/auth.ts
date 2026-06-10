import Cookies from "js-cookie";
import type { User } from "@/types";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function saveAuth(token: string, user: User) {
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: "Lax" }); // 1 day
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1, sameSite: "Lax" });
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function getUser(): User | null {
  const raw = Cookies.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth() {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!Cookies.get(TOKEN_KEY);
}

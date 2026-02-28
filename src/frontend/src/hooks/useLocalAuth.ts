import { useCallback, useEffect, useState } from "react";
import { useActor } from "./useActor";

export interface LocalUser {
  email: string;
  fullName: string;
  inGameName: string;
  gameUID: string;
  mobileNo: string;
  referCode?: string;
}

export interface LocalAuthState {
  isAuthenticated: boolean;
  currentUser: LocalUser | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (user: LocalUser & { password: string }) => Promise<void>;
  logout: () => void;
}

const SESSION_KEY = "ff_session_email";
const PROFILE_KEY = "ff_profile";

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getSessionEmail(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function saveSession(email: string, profile: LocalUser): void {
  localStorage.setItem(SESSION_KEY, email);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

function getStoredProfile(): LocalUser | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function useLocalAuth(): LocalAuthState {
  const { actor } = useActor();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // On mount: restore session from localStorage cache
  useEffect(() => {
    const savedEmail = getSessionEmail();
    if (savedEmail) {
      const profile = getStoredProfile();
      if (profile) {
        setCurrentUser(profile);
        setIsAuthenticated(true);
      } else {
        // Email saved but no profile — clear stale session
        clearSession();
      }
    }
    setIsInitializing(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      if (!actor) {
        throw new Error("Connecting to server, please try again in a moment.");
      }

      const passwordHash = await hashPassword(password);
      let result: Awaited<ReturnType<typeof actor.login>>;
      try {
        result = await actor.login(email.trim().toLowerCase(), passwordHash);
      } catch (rawErr) {
        // Sanitize raw backend trap errors into readable messages
        const msg = rawErr instanceof Error ? rawErr.message : String(rawErr);
        if (
          msg.toLowerCase().includes("anonymous") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          throw new Error(
            "Unable to connect to the server. Please reload the page and try again.",
          );
        }
        throw new Error(
          "Login failed. Please check your connection and try again.",
        );
      }

      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }

      const backendProfile = result.ok;
      const user: LocalUser = {
        email: email.trim().toLowerCase(),
        fullName: backendProfile.fullName,
        inGameName: backendProfile.inGameName,
        gameUID: backendProfile.gameUID,
        mobileNo: backendProfile.mobileNo,
        referCode: backendProfile.referCode,
      };

      saveSession(user.email, user);
      setCurrentUser(user);
      setIsAuthenticated(true);
    },
    [actor],
  );

  const register = useCallback(
    async (userData: LocalUser & { password: string }): Promise<void> => {
      if (!actor) {
        throw new Error("Connecting to server, please try again in a moment.");
      }

      const email = userData.email.trim().toLowerCase();
      const passwordHash = await hashPassword(userData.password);

      let result: Awaited<ReturnType<typeof actor.registerAccount>>;
      try {
        result = await actor.registerAccount(
          email,
          passwordHash,
          userData.fullName,
          userData.inGameName,
          userData.gameUID,
          userData.mobileNo,
          userData.referCode ?? "",
        );
      } catch (rawErr) {
        // Sanitize raw backend trap errors into readable messages
        const msg = rawErr instanceof Error ? rawErr.message : String(rawErr);
        if (
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("exist")
        ) {
          throw new Error("Email already taken. Please use another email");
        }
        if (
          msg.toLowerCase().includes("anonymous") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          throw new Error(
            "Unable to connect to the server. Please reload the page and try again.",
          );
        }
        throw new Error(
          "Registration failed. Please check your connection and try again.",
        );
      }

      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }

      // Registration succeeded — do NOT auto-login.
      // AuthPage will switch to the login tab so the user signs in manually.
    },
    [actor],
  );

  const logout = useCallback((): void => {
    clearSession();
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    currentUser,
    isInitializing,
    login,
    register,
    logout,
  };
}

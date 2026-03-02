import { useCallback, useEffect, useState } from "react";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export interface LocalUser {
  email: string;
  legendId?: number;
  fullName: string;
  inGameName: string;
  gameUID: string;
  mobileNo: string;
  referCode?: string;
}

const STORAGE_KEY = "la_user";

export interface LocalAuthState {
  isAuthenticated: boolean;
  currentUser: LocalUser | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (user: LocalUser & { password: string }) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: LocalUser | null) => void;
}

export function useLocalAuth(): LocalAuthState {
  const { actor } = useActor();
  const {
    identity,
    isInitializing: iiInitializing,
    clear: iiClear,
  } = useInternetIdentity();

  // Load from localStorage on mount
  const [currentUser, setCurrentUserState] = useState<LocalUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as LocalUser;
    } catch {
      // ignore parse errors
    }
    return null;
  });

  const isAuthenticated = !!identity || !!currentUser;

  // When II identity is available, load or sync local profile data
  useEffect(() => {
    if (!identity || !actor) return;
    actor
      .getCallerUserProfile()
      .then((profile) => {
        if (profile) {
          const user: LocalUser = {
            email: profile.email,
            legendId: Number(profile.legendId),
            fullName: profile.fullName,
            inGameName: profile.inGameName,
            gameUID: profile.gameUID,
            mobileNo: profile.mobileNo,
            referCode: profile.referCode,
          };
          setCurrentUserState(user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }
      })
      .catch(() => {
        // Non-fatal — profile may not be set up yet
      });
  }, [identity, actor]);

  const setCurrentUser = useCallback((user: LocalUser | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // No-op login/register since auth is via Legend ID in AuthPage
  const login = useCallback(
    async (_email: string, _password: string): Promise<void> => {
      // Login is handled via Legend ID in AuthPage
    },
    [],
  );

  const register = useCallback(
    async (_userData: LocalUser & { password: string }): Promise<void> => {
      // Registration is handled via Legend ID in AuthPage
    },
    [],
  );

  const logout = useCallback((): void => {
    setCurrentUserState(null);
    localStorage.removeItem(STORAGE_KEY);
    iiClear();
  }, [iiClear]);

  return {
    isAuthenticated,
    currentUser,
    isInitializing: iiInitializing,
    login,
    register,
    logout,
    setCurrentUser,
  };
}

import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MatchDetailPage from "./pages/MatchDetailPage";
import WalletPage from "./pages/WalletPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import TopHeader from "./components/game/TopHeader";
import BottomNav from "./components/game/BottomNav";
import ProfileSetup from "./components/game/ProfileSetup";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Root Layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    isError: profileError,
  } = useGetCallerUserProfile();

  // Timeout-based forced show: after 5s always show content no matter what
  const [forceShow, setForceShow] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);

  useEffect(() => {
    const warnTimer = setTimeout(() => setSlowWarning(true), 3000);
    const forceTimer = setTimeout(() => setForceShow(true), 5000);
    return () => {
      clearTimeout(warnTimer);
      clearTimeout(forceTimer);
    };
  }, []);

  const isAuthenticated = !!identity;

  // Show loading screen while initializing auth
  if (isInitializing) {
    return (
      <div className="min-h-dvh gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-2 rounded-full animate-spin"
            style={{ borderColor: "oklch(0.72 0.22 45)", borderTopColor: "transparent" }}
          />
          <p className="font-display text-sm text-muted-foreground tracking-wider">
            LOADING...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in — show auth page
  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  // Show content: not loading, OR error occurred, OR fetch completed, OR timeout hit
  // Both useGetCallerUserProfile (4s) AND forceShow (5s) timeouts ensure we never get stuck
  const showContent = !profileLoading || !!profileError || profileFetched || forceShow;

  // Show profile setup only when we know profile is definitively null (not just loading)
  const showProfileSetup =
    isAuthenticated && showContent && !profileError && profileFetched && userProfile === null;

  return (
    <div className="gradient-bg min-h-dvh">
      {/* App shell */}
      <div
        className="app-shell flex flex-col relative"
        style={{ boxShadow: "0 0 40px oklch(0 0 0 / 0.5)" }}
      >
        <TopHeader />

        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 8px))" }}
        >
          {!showContent ? (
            <div className="flex flex-col gap-3 p-4 animate-pulse">
              <Skeleton className="h-8 w-1/2 bg-muted/50 rounded" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 bg-muted/50 rounded-xl" />
                ))}
              </div>
              {slowWarning && (
                <p className="text-center text-xs text-muted-foreground/60 mt-2 animate-fade-in">
                  Taking longer than usual...
                </p>
              )}
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        <BottomNav />
      </div>

      {/* Profile setup modal */}
      {showProfileSetup && (
        <ProfileSetup onComplete={() => {}} />
      )}

      <Toaster />
    </div>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const matchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/match/$id",
  component: MatchDetailPage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: WalletPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  matchRoute,
  walletRoute,
  profileRoute,
  adminRoute,
  leaderboardRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />;
}

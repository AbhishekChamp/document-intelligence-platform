import { Suspense, lazy } from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { AppLayout } from "../layout/AppLayout";
import { ErrorBoundary } from "../../shared/components/ErrorBoundary";
import { PageLoader } from "./PageLoader";

// Lazy load pages for code splitting
const AnalyzePage = lazy(() =>
  import("../../domains/analysis/pages/AnalyzePage").then((m) => ({
    default: m.AnalyzePage,
  })),
);
const DashboardPage = lazy(() =>
  import("../../domains/dashboard/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const HistoryPage = lazy(() =>
  import("../../domains/document/pages/HistoryPage").then((m) => ({
    default: m.HistoryPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../../app/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const AboutPage = lazy(() =>
  import("../../app/pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);

const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ErrorBoundary>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AnalyzePage />
    </Suspense>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DashboardPage />
    </Suspense>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <HistoryPage />
    </Suspense>
  ),
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AboutPage />
    </Suspense>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SettingsPage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  historyRoute,
  aboutRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 30_000,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

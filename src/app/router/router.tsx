import { Suspense, lazy } from 'react';
import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { AppLayout } from '../layout/AppLayout';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import { Card, CardContent } from '../../shared/components/Card';

// Lazy load pages for code splitting
const AnalyzePage = lazy(() => import('../../domains/analysis/pages/AnalyzePage').then(m => ({ default: m.AnalyzePage })));
const DashboardPage = lazy(() => import('../../domains/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const HistoryPage = lazy(() => import('../../domains/document/pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import('../../app/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AboutPage = lazy(() => import('../../app/pages/AboutPage').then(m => ({ default: m.AboutPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Card className="w-full max-w-sm">
      <CardContent className="p-8 text-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </CardContent>
    </Card>
  </div>
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
  path: '/',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AnalyzePage />
    </Suspense>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DashboardPage />
    </Suspense>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <HistoryPage />
    </Suspense>
  ),
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AboutPage />
    </Suspense>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
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
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './shared/AuthContext.jsx';
import { BottomNav } from './shared/BottomNav.jsx';
import { AppHeader } from './shared/AppHeader.jsx';
import { HamburgerDrawer } from './shared/HamburgerDrawer.jsx';
import { Spinner, ErrorBoundary } from './shared/ui.jsx';
import { RootErrorBoundary } from './shared/RootErrorBoundary.jsx';
import { api } from './shared/api.js';
import AuthPage from './modules/account/AuthPage.jsx';
import FirstTimeSetup from './modules/account/FirstTimeSetup.jsx';

// Lazy-load all modules for 60fps performance
const HomeModule = lazy(() => import('./modules/home/HomeView.jsx'));
const FitnessAIModule = lazy(() => import('./modules/fitness-ai/FitnessAiView.jsx'));
const ProgressModule = lazy(() => import('./modules/progress/ProgressPage.jsx'));
const WorkoutModule = lazy(() => import('./modules/workout/WorkoutPage.jsx'));
const CardioModule = lazy(() => import('./modules/cardio/CardioPage.jsx'));
const AutopilotModule = lazy(() => import('./modules/autopilot/AutopilotView.jsx'));
const DietModule = lazy(() => import('./modules/diet/DietPage.jsx'));
const AccountModule = lazy(() => import('./modules/account/AccountPage.jsx'));

function ModuleSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size={32} />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function AppShell() {
  const { isLoggedIn, user } = useAuth() ?? {};
  const [tab, setTab] = useState('home');
  const tabHistory = useRef([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [streak, setStreak] = useState(0);
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  function navigateTab(nextTab) {
    if (!nextTab || nextTab === tab) return;
    tabHistory.current.push(tab);
    setTab(nextTab);
    window.history.pushState({ dreamPhysicTab: nextTab }, '', window.location.href);
  }

  useEffect(() => {
    // Keep a same-page sentinel so the first Back at Home does not leave the app.
    window.history.pushState({ dreamPhysicBase: true }, '', window.location.href);
    const handleBack = () => {
      const previousTab = tabHistory.current.pop();
      if (previousTab) {
        setTab(previousTab);
        return;
      }
      window.history.pushState({ dreamPhysicBase: true }, '', window.location.href);
    };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setNeedsSetup(false);
      return;
    }
    api('/progress/streak')
      .then((s) => {
        if (typeof s?.currentDays === 'number') setStreak(s.currentDays);
      })
      .catch(() => {});

    const setupKey = `dp_setup_done_${user?.id || user?.email || 'user'}`;
    if (localStorage.getItem(setupKey)) {
      setNeedsSetup(false);
      return;
    }
    if (user?.isNewUser) {
      setNeedsSetup(true);
      return;
    }
    api('/progress/metabolic')
      .then((m) => {
        if (!m?.primaryGoal && !m?.latestWeightKg) {
          setNeedsSetup(true);
        } else {
          localStorage.setItem(setupKey, '1');
        }
      })
      .catch(() => {});
  }, [isLoggedIn, user]);

  function finishSetup() {
    const setupKey = `dp_setup_done_${user?.id || user?.email || 'user'}`;
    localStorage.setItem(setupKey, '1');
    setNeedsSetup(false);
  }

  if (!isLoggedIn) return <AuthPage />;
  if (needsSetup) return <FirstTimeSetup onComplete={finishSetup} onSkip={finishSetup} />;

  const renderTab = () => {
    switch (tab) {
      case 'home':
        return <HomeModule onNavigate={navigateTab} />;
      case 'ai':
        return <FitnessAIModule onNavigate={navigateTab} />;
      case 'progress':
        return <ProgressModule />;
      case 'workout':
        return <WorkoutModule />;
      case 'cardio':
        return <CardioModule />;
      case 'autopilot':
        return <AutopilotModule onNavigate={navigateTab} />;
      case 'diet':
        return <DietModule />;
      case 'account':
        return <AccountModule onNavigate={navigateTab} />;
      default:
        return <HomeModule onNavigate={navigateTab} />;
    }
  };

  return (
    <div className="min-h-screen min-h-dvh" style={{ background: '#05070c' }}>
      <AppHeader
        activeTab={tab}
        onOpenDrawer={() => setDrawerOpen(true)}
        streak={streak}
        online={online}
      />

      <HamburgerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={tab}
        onNavigate={navigateTab}
      />

      <div className="content-safe overflow-auto">
        <ErrorBoundary>
          <ModuleSuspense>{renderTab()}</ModuleSuspense>
        </ErrorBoundary>
      </div>
      <BottomNav active={tab} onChange={navigateTab} />
    </div>
  );
}

export default function App() {
  return (
    <RootErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </RootErrorBoundary>
  );
}

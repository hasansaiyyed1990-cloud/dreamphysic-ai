import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './shared/AuthContext.jsx';
import { BottomNav } from './shared/BottomNav.jsx';
import { HamburgerDrawer } from './shared/HamburgerDrawer.jsx';
import { Spinner } from './shared/ui.jsx';
import { RootErrorBoundary } from './shared/RootErrorBoundary.jsx';
import { api } from './shared/api.js';
import AuthPage from './modules/account/AuthPage.jsx';
import FirstTimeSetup from './modules/account/FirstTimeSetup.jsx';

// Lazy-load all modules for 60fps performance
const HomeModule = lazy(() => import('./modules/home/HomePage.jsx'));
const FitnessAIModule = lazy(() => import('./modules/fitness-ai/FitnessAIPage.jsx'));
const ProgressModule = lazy(() => import('./modules/progress/ProgressPage.jsx'));
const WorkoutModule = lazy(() => import('./modules/workout/WorkoutPage.jsx'));
const CardioModule = lazy(() => import('./modules/cardio/CardioPage.jsx'));
const AutopilotModule = lazy(() => import('./modules/autopilot/AutopilotPage.jsx'));
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
  const { isLoggedIn = false, user = null, logout } = useAuth() ?? {};
  void logout;
  const [tab, setTab] = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setNeedsSetup(false);
      return;
    }
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
      case 'home': return <HomeModule onNavigate={setTab} />;
      case 'ai': return <FitnessAIModule />;
      case 'progress': return <ProgressModule />;
      case 'workout': return <WorkoutModule />;
      case 'cardio': return <CardioModule />;
      case 'autopilot': return <AutopilotModule />;
      case 'diet': return <DietModule />;
      case 'account': return <AccountModule onNavigate={setTab} />;
      default: return <HomeModule onNavigate={setTab} />;
    }
  };

  return (
    <div className="min-h-screen min-h-dvh" style={{ background: '#05070c' }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(5, 7, 12, 0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 rounded-xl text-white hover:bg-white/5"
        >
          <Menu size={22} />
        </button>
        <span className="text-sm font-bold tracking-tight text-white">
          DreamPhysic <span className="text-teal">AI</span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">
          Beta
        </span>
      </header>

      <HamburgerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={tab}
        onNavigate={setTab}
      />

      <div className="content-safe overflow-auto">
        <ModuleSuspense>{renderTab()}</ModuleSuspense>
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: '100dvh', background: '#05070c' }}>
      <RootErrorBoundary>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </RootErrorBoundary>
    </div>
  );
}

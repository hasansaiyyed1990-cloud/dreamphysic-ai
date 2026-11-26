import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './shared/AuthContext.jsx';
import { BottomNav } from './shared/BottomNav.jsx';
import { Spinner } from './shared/ui.jsx';
import AuthPage from './modules/account/AuthPage.jsx';

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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    }>
      {children}
    </Suspense>
  );
}

function AppShell() {
  const { isLoggedIn, logout } = useAuth();
  const [tab, setTab] = useState('home');

  if (!isLoggedIn) return <AuthPage />;

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
      <div className="content-safe overflow-auto">
        <ModuleSuspense>
          {renderTab()}
        </ModuleSuspense>
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

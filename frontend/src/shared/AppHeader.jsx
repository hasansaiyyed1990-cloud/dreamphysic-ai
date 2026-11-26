import React, { memo } from 'react';
import { Menu, Dumbbell, Flame, Crown, Sparkles } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';

export const AppHeader = memo(({ activeTab, onOpenDrawer, streak = 0, online = true }) => {
  const { user } = useAuth() ?? {};
  const firstName = (user?.name || 'Athlete').split(' ')[0];

  const subtitleMap = {
    home: `Hi ${firstName}! 👋`,
    ai: 'Fitness AI',
    autopilot: 'AI Autopilot',
    workout: 'Workout Tracker',
    cardio: 'Cardio & Stamina',
    diet: 'Nutrition & Scan',
    progress: 'Body & Progress',
    account: 'Account & Settings',
  };

  return (
    <header
      className="sticky top-0 z-40 px-4 pt-3 pb-2.5"
      style={{
        background: 'rgba(5, 7, 12, 0.94)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open menu"
            className="p-2 -ml-2 rounded-xl text-white hover:bg-white/5 flex-shrink-0"
          >
            <Menu size={22} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-teal/15 border border-teal/30 flex items-center justify-center flex-shrink-0">
                <Dumbbell size={12} className="text-teal" />
              </div>
              <span className="text-xs font-bold tracking-tight text-white">
                DreamPhysic <span className="text-teal">AI</span>
              </span>
            </div>
            <p className="text-sm font-bold text-white truncate mt-0.5">
              {subtitleMap[activeTab] || `Hi ${firstName}! 👋`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {activeTab === 'ai' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple/15 text-purple border border-purple/30">
              <Crown size={12} /> 10-Yr Coach
            </span>
          ) : activeTab === 'autopilot' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple/15 text-purple border border-purple/30">
              <Sparkles size={12} /> Smart Plan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tab-num bg-gold/10 text-gold border border-gold/30">
              <Flame size={12} /> {streak}d
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              online
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                online ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {online ? 'Synced' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
});

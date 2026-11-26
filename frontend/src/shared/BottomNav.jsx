import React, { memo } from 'react';
import { Home, Sparkles, TrendingUp, Dumbbell, Heart, Navigation, Utensils, User } from 'lucide-react';

const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'workout', icon: Dumbbell, label: 'Workout' },
  { id: 'cardio', icon: Heart, label: 'Cardio' },
  { id: 'diet', icon: Utensils, label: 'Diet' },
  { id: 'ai', icon: Sparkles, label: 'Fitness AI' },
  { id: 'progress', icon: TrendingUp, label: 'Progress' },
  { id: 'autopilot', icon: Navigation, label: 'Autopilot' },
  { id: 'account', icon: User, label: 'Account' },
];

// 5-Tab Primary Navigation Shell
const PRIMARY = ['home', 'workout', 'cardio', 'diet', 'ai'];

export const BottomNav = memo(({ active, onChange }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 bottom-nav-safe pt-2"
    style={{
      background: 'rgba(5, 7, 12, 0.96)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}
  >
    <div className="flex justify-around items-center max-w-lg mx-auto px-2">
      {PRIMARY.map((id) => {
        const item = TABS.find((t) => t.id === id);
        if (!item) return null;
        const { icon: Icon, label } = item;
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-xl transition-transform min-w-[56px]"
            style={{
              color: isActive ? '#2dd4bf' : '#64748b',
              background: isActive ? 'rgba(45, 212, 191, 0.1)' : 'transparent',
              transform: isActive ? 'translateY(-1px)' : 'none',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
));

export { TABS };

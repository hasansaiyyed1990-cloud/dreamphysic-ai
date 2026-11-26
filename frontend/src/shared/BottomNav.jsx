import React, { memo } from 'react';
import { Home, Zap, TrendingUp, Dumbbell, Heart, Navigation, Utensils, User } from 'lucide-react';

const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'ai', icon: Zap, label: 'AI Coach' },
  { id: 'progress', icon: TrendingUp, label: 'Progress' },
  { id: 'workout', icon: Dumbbell, label: 'Workout' },
  { id: 'cardio', icon: Heart, label: 'Cardio' },
  { id: 'autopilot', icon: Navigation, label: 'Autopilot' },
  { id: 'diet', icon: Utensils, label: 'Diet' },
  { id: 'account', icon: User, label: 'Account' },
];

// Show only 5 primary tabs; rest in overflow
const PRIMARY = ['home', 'workout', 'diet', 'ai', 'account'];

export const BottomNav = memo(({ active, onChange }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 bottom-nav-safe pt-2"
    style={{ background: 'rgba(5, 7, 12, 0.96)', borderTop: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
  >
    <div className="flex justify-around items-center max-w-lg mx-auto px-2">
      {TABS.filter(t => PRIMARY.includes(t.id)).map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all min-w-[52px]"
            style={{
              color: isActive ? '#2dd4bf' : '#64748b',
              transform: isActive ? 'translateY(-1px)' : 'none',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[9px] font-semibold tracking-wide">{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
));

export const MoreNav = memo(({ active, onChange }) => (
  <div className="flex flex-wrap gap-2 p-4">
    {TABS.filter(t => !PRIMARY.includes(t.id)).map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border
          ${active === id ? 'bg-teal/10 border-teal text-teal' : 'bg-white/5 border-white/10 text-muted'}`}
      >
        <Icon size={16} />
        {label}
      </button>
    ))}
  </div>
));

export { TABS };

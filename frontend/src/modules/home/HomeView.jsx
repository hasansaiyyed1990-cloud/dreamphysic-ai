import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  Dumbbell,
  Utensils,
  Heart,
  Sparkles,
  Play,
  Navigation,
  Droplets,
  CheckCircle2,
  Circle,
  Zap,
  Flame,
} from 'lucide-react';
import { api } from '../../shared/api.js';
import { useAuth } from '../../shared/AuthContext.jsx';
import { getLocalIstDateString } from '../../shared/date.js';
import { CircularProgress, MacroBar, Spinner, ErrorMsg } from '../../shared/ui.jsx';

const DEFAULT_HABITS = [
  { id: 'water', label: '3.5L Water' },
  { id: 'creatine', label: '3g Creatine' },
  { id: 'sleep', label: '7.5h Sleep' },
  { id: 'weighin', label: 'Weight Check-in' },
];

const HabitRow = memo(({ habit, checked, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(habit.id)}
    className="flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-colors"
    style={{
      background: checked ? 'rgba(45, 212, 191, 0.08)' : 'rgba(255,255,255,0.03)',
      border: checked ? '1px solid rgba(45, 212, 191, 0.25)' : '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {checked ? (
      <CheckCircle2 size={16} className="text-teal flex-shrink-0" />
    ) : (
      <Circle size={16} className="text-muted flex-shrink-0" />
    )}
    <span className={`text-xs font-semibold ${checked ? 'text-teal line-through' : 'text-white'}`}>
      {habit.label}
    </span>
  </button>
));

export default function HomeView({ onNavigate }) {
  const { user } = useAuth() ?? {};
  const today = getLocalIstDateString();
  const userKey = user?.id || user?.email || 'default';
  const habitsStorageKey = `dp_habits_${userKey}_${today}`;

  const [autopilot, setAutopilot] = useState(null);
  const [diary, setDiary] = useState(null);
  const [mission, setMission] = useState(null);
  const [hydration, setHydration] = useState({ waterMl: 0, waterGoalMl: 3500 });
  const [loading, setLoading] = useState(true);
  const [waterSaving, setWaterSaving] = useState(false);
  const [error, setError] = useState('');
  const [habits, setHabits] = useState(() => {
    try {
      const raw = localStorage.getItem(habitsStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const [ap, d, m, h] = await Promise.allSettled([
        api('/autopilot/today', { signal }),
        api(`/nutrition/diary/${today}`, { signal }),
        api('/nutrition/mission', { signal }),
        api(`/nutrition/hydration/${today}`, { signal }),
      ]);
      if (ap.status === 'fulfilled') setAutopilot(ap.value);
      if (d.status === 'fulfilled') setDiary(d.value);
      if (m.status === 'fulfilled') setMission(m.value);
      if (h.status === 'fulfilled' && h.value) {
        setHydration({
          waterMl: h.value.waterMl ?? 0,
          waterGoalMl: h.value.waterGoalMl ?? 3500,
        });
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const toggleHabit = useCallback(
    (id) => {
      setHabits((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        try {
          localStorage.setItem(habitsStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [habitsStorageKey]
  );

  async function addWater250() {
    if (waterSaving) return;
    const nextMl = (hydration.waterMl || 0) + 250;
    setHydration((h) => ({ ...h, waterMl: nextMl }));
    setWaterSaving(true);
    try {
      await api(`/nutrition/hydration/${today}`, {
        method: 'POST',
        body: { waterMl: nextMl, waterGoalMl: hydration.waterGoalMl || 3500 },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setWaterSaving(false);
    }
  }

  const workout = autopilot?.workout;
  const exercisesCount = workout?.exercises?.length || 6;
  const durationMins = workout?.durationMinutes || 55;
  const workoutTitle = workout?.split || 'Back Width & Thickness';

  const calGoal = mission?.dailyCalorieBudget || autopilot?.nutrition?.calorieTarget || 2200;
  const calEaten = Math.round(diary?.calories ?? autopilot?.nutrition?.caloriesConsumed ?? 0);
  const calLeft = Math.max(0, calGoal - calEaten);
  const proteinTarget = Math.round(autopilot?.nutrition?.proteinTargetG || (calGoal * 0.3) / 4);
  const proteinEaten = Math.round(diary?.proteinG ?? autopilot?.nutrition?.proteinConsumedG ?? 0);
  const carbsTarget = Math.round((calGoal * 0.45) / 4);
  const carbsEaten = Math.round(diary?.carbsG ?? autopilot?.nutrition?.carbsG ?? 0);
  const fatTarget = Math.round((calGoal * 0.25) / 9);
  const fatEaten = Math.round(diary?.fatG ?? autopilot?.nutrition?.fatG ?? 0);

  const waterL = ((hydration.waterMl || 0) / 1000).toFixed(2);
  const waterGoalL = ((hydration.waterGoalMl || 3500) / 1000).toFixed(2);
  const waterPct = hydration.waterGoalMl > 0
    ? Math.min(100, Math.round(((hydration.waterMl || 0) / hydration.waterGoalMl) * 100))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size={34} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 animate-fade-in">
      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {/* Morning AI Autopilot Hero Card */}
      <section
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #131c31 0%, #0e131f 65%, rgba(45,212,191,0.1) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.28)',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple/15 text-purple border border-purple/30">
            <Zap size={11} /> AI Autopilot
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal/10 text-teal border border-teal/30 tab-num">
            ✓ 88% Ready
          </span>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">{workoutTitle}</h2>
        <p className="text-xs text-muted mt-1 tab-num">
          {exercisesCount} Exercises • {durationMins} Mins • Gym
        </p>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => onNavigate('workout')}
            className="btn-teal flex items-center justify-center gap-1.5 py-2.5 text-xs"
          >
            <Play size={14} /> Start Workout
          </button>
          <button
            type="button"
            onClick={() => onNavigate('autopilot')}
            className="btn-ghost flex items-center justify-center gap-1.5 py-2.5 text-xs text-white"
          >
            <Navigation size={14} className="text-purple" /> Open Autopilot
          </button>
        </div>
      </section>

      {/* Today's Fuel, Protein & Hydration Card */}
      <section
        className="rounded-2xl p-4 space-y-3.5"
        style={{ background: '#0e131f', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Flame size={15} className="text-gold" /> Today's Fuel &amp; Hydration
          </h3>
          <span className="text-[11px] text-teal font-semibold tab-num">{calLeft} kcal left</span>
        </div>

        <div className="flex items-center gap-4">
          <CircularProgress value={calEaten} max={calGoal} size={86} strokeWidth={7} color="#2dd4bf">
            <div className="text-center">
              <p className="tab-num text-base font-bold text-white leading-none">{calEaten}</p>
              <p className="text-[10px] text-muted mt-0.5">/ {calGoal}</p>
            </div>
          </CircularProgress>

          <div className="flex-1 space-y-2">
            <MacroBar label="Protein" value={proteinEaten} max={proteinTarget} color="teal" />
            <MacroBar label="Carbs" value={carbsEaten} max={carbsTarget} color="gold" />
            <MacroBar label="Fats" value={fatEaten} max={fatTarget} color="purple" />
          </div>
        </div>

        {/* Hydration Strip */}
        <div
          className="p-3 rounded-xl flex items-center justify-between gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white font-semibold flex items-center gap-1">
                <Droplets size={13} className="text-teal" /> Water
              </span>
              <span className="tab-num text-muted">
                <strong className="text-white">{waterL}</strong> / {waterGoalL} L ({waterPct}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal transition-all"
                style={{ width: `${waterPct}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addWater250}
            disabled={waterSaving}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-teal/15 text-teal border border-teal/30 active:scale-95 transition-transform flex-shrink-0"
          >
            +250ml Water
          </button>
        </div>
      </section>

      {/* 4 Quick-Launch Action Tiles (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-3">
        {[
          { id: 'workout', title: 'Log Workout', sub: 'Sets, reps & rest', icon: Dumbbell, color: 'text-purple', bg: 'bg-purple/10', border: 'rgba(168,85,247,0.22)' },
          { id: 'diet', title: 'Log / Scan Meal', sub: 'Thali AI & macros', icon: Utensils, color: 'text-gold', bg: 'bg-gold/10', border: 'rgba(251,191,36,0.22)' },
          { id: 'cardio', title: 'Cardio Session', sub: 'Run, swim & HIIT', icon: Heart, color: 'text-teal', bg: 'bg-teal/10', border: 'rgba(45,212,191,0.22)' },
          { id: 'ai', title: 'Ask Fitness AI', sub: '10-Yr Coach chat', icon: Sparkles, color: 'text-purple', bg: 'bg-purple/10', border: 'rgba(168,85,247,0.22)' },
        ].map(({ id, title, sub, icon: Icon, color, bg, border }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className="rounded-2xl p-3.5 text-left flex items-center gap-3 active:scale-95 transition-transform"
            style={{ background: '#0e131f', border: `1px solid ${border}` }}
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{title}</p>
              <p className="text-[11px] text-muted truncate mt-0.5">{sub}</p>
            </div>
          </button>
        ))}
      </section>

      {/* Daily Habits & Recovery Checklist */}
      <section
        className="rounded-2xl p-4"
        style={{ background: '#0e131f', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Daily Habits &amp; Recovery</h3>
          <span className="text-[11px] text-teal font-semibold tab-num">
            {Object.values(habits).filter(Boolean).length}/{DEFAULT_HABITS.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_HABITS.map((h) => (
            <HabitRow key={h.id} habit={h} checked={!!habits[h.id]} onToggle={toggleHabit} />
          ))}
        </div>
      </section>
    </div>
  );
}

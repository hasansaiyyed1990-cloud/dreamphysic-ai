import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Zap,
  Clock,
  BatteryCharging,
  Home,
  RefreshCw,
  Bookmark,
  ArrowLeftRight,
  Plus,
  Trash2,
  Play,
  Utensils,
  Heart,
  Target,
  Calendar,
  X,
} from 'lucide-react';
import { api } from '../../shared/api.js';
import { useAuth } from '../../shared/AuthContext.jsx';
import { GYM_EXERCISE_SWAP_DB } from '../../data/gymExerciseSwapDb.js';
import { CircularProgress, Spinner, ErrorMsg, Badge } from '../../shared/ui.jsx';

const MODE_PILLS = [
  { id: 'FULL', label: '⚡ Full 55m', mins: 55, factor: 1 },
  { id: 'EXPRESS', label: '⏱ 25m Express', mins: 25, factor: 0.6 },
  { id: 'LOW_ENERGY', label: '🔋 Low Energy', mins: 35, factor: 0.75 },
  { id: 'HOME', label: '🏠 Home Gym', mins: 40, factor: 0.85 },
];

const ALL_DB_EXERCISES = Object.values(GYM_EXERCISE_SWAP_DB).flat();

function findAlternatives(exName) {
  const match = ALL_DB_EXERCISES.find(
    (x) => x.name.toLowerCase() === String(exName || '').toLowerCase()
  );
  if (match?.sameMuscleAlternatives?.length) {
    return match.sameMuscleAlternatives
      .map((id) => ALL_DB_EXERCISES.find((x) => x.id === id))
      .filter(Boolean);
  }
  return ALL_DB_EXERCISES.slice(0, 5);
}

const DEFAULT_EXERCISES = [
  { name: 'Lat Pulldown', sets: 4, reps: 10, weightKg: 55 },
  { name: 'Barbell Row', sets: 4, reps: 8, weightKg: 60 },
  { name: 'Seated Cable Row', sets: 3, reps: 12, weightKg: 50 },
  { name: 'One-Arm Dumbbell Row', sets: 3, reps: 10, weightKg: 24 },
];

export default function AutopilotView({ onNavigate }) {
  const { user } = useAuth() ?? {};
  const userKey = user?.id || user?.email || 'default';
  const savedPlansKey = `dp_saved_plans_${userKey}`;
  const workoutHandoffKey = `dp_autopilot_workout_${userKey}`;

  const [plan, setPlan] = useState(null);
  const [mode, setMode] = useState('FULL');
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [swapIndex, setSwapIndex] = useState(null);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [savedPlans, setSavedPlans] = useState(() => {
    try {
      const raw = localStorage.getItem(savedPlansKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/autopilot/today', { signal });
      setPlan(data);
      if (data?.workout?.exercises?.length) {
        setExercises(data.workout.exercises);
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setError('');
    try {
      const data = await api('/autopilot/today/generate', { method: 'POST', body: {} });
      setPlan(data);
      if (data?.workout?.exercises?.length) {
        setExercises(data.workout.exercises);
      }
      showToast('Workout regenerated!');
    } catch (e) {
      setError(e.message);
    } finally {
      setRegenerating(false);
    }
  }

  function applyMode(m) {
    setMode(m.id);
    if (m.id === 'HOME') {
      setExercises([
        { name: 'Push-Up', sets: 4, reps: 15, weightKg: 0 },
        { name: 'Pull-Up', sets: 3, reps: 8, weightKg: 0 },
        { name: 'One-Arm Dumbbell Row', sets: 3, reps: 12, weightKg: 16 },
      ]);
      showToast('Switched to Home Gym bodyweight/DB split');
    } else if (m.id === 'EXPRESS') {
      setExercises((prev) => prev.slice(0, 3).map((ex) => ({ ...ex, sets: Math.max(2, ex.sets - 1) })));
      showToast('Adjusted to 25m Express');
    } else if (m.id === 'LOW_ENERGY') {
      setExercises((prev) => prev.map((ex) => ({ ...ex, sets: Math.max(2, ex.sets - 1) })));
      showToast('Reduced volume for Low Energy');
    } else {
      setExercises(plan?.workout?.exercises?.length ? plan.workout.exercises : DEFAULT_EXERCISES);
      showToast('Restored Full 55m Plan');
    }
  }

  function updateExercise(idx, patch) {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)));
  }

  function addExercise() {
    setExercises((prev) => [...prev, { name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weightKg: 10 }]);
  }

  function removeExercise(idx) {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function saveCurrentPlan() {
    const requestedTitle = window.prompt('Plan ka naam kya rakhein?', plan?.workout?.split || 'Custom Split');
    if (requestedTitle === null) return;
    const title = requestedTitle.trim();
    if (!title) return;
    const entry = {
      id: Date.now(),
      title,
      mode,
      exercises,
      savedAt: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };
    const next = [entry, ...savedPlans].slice(0, 10);
    setSavedPlans(next);
    try {
      localStorage.setItem(savedPlansKey, JSON.stringify(next));
    } catch {
      // ignore
    }
    showToast('Plan saved!');
  }

  function loadSavedPlan(item) {
    setExercises(item.exercises || DEFAULT_EXERCISES);
    setMode(item.mode || 'FULL');
    setShowSavedDrawer(false);
    showToast(`Loaded "${item.title}"`);
  }

  function deleteSavedPlan(id) {
    const next = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(next);
    try {
      localStorage.setItem(savedPlansKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function startAutopilotWorkout() {
    try {
      sessionStorage.setItem('dp_autopilot_workout_pending', JSON.stringify({
        userKey,
        split: splitTitle,
        exercises: exercises.map((ex) => ({ ...ex })),
      }));
      onNavigate?.('workout');
    } catch {
      showToast('Could not prepare workout. Please retry.');
    }
  }

  const splitTitle = plan?.workout?.split || 'Back Width & Thickness';
  const nut = plan?.nutrition;
  const calTarget = nut?.calorieTarget || 2200;
  const protTarget = Math.round(nut?.proteinTargetG || 130);

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
      {toast && (
        <div className="p-2.5 rounded-xl bg-teal/15 border border-teal/35 text-teal text-xs font-semibold text-center">
          ✓ {toast}
        </div>
      )}

      {/* Readiness & Recovery Hero Card */}
      <section
        className="rounded-2xl p-4 space-y-3"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, #0e131f 55%, rgba(45,212,191,0.1) 100%)',
          border: '1px solid rgba(168,85,247,0.28)',
        }}
      >
        <div className="flex items-center gap-4">
          <CircularProgress value={0} max={100} size={82} strokeWidth={7} color="#2dd4bf">
            <div className="text-center">
              <p className="tab-num text-base font-bold text-white leading-none">—</p>
              <p className="text-[10px] text-teal font-semibold mt-0.5">Readiness</p>
            </div>
          </CircularProgress>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">{plan?.recoveryStatus || 'Recovery not logged'}</h2>
            <p className="text-xs text-muted mt-0.5">
              {plan?.recoveryReason || 'Sleep, soreness, and energy data are not available yet.'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge color="teal">😴 {plan?.sleepHours != null ? `${plan.sleepHours}h Sleep` : 'Sleep not logged'}</Badge>
              <Badge color="gold">🔥 {plan?.streakDays != null ? `${plan.streakDays}-day streak` : 'Streak unavailable'}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            { label: 'HRV', val: plan?.hrv != null ? `${plan.hrv} ms` : 'Not logged' },
            { label: 'Energy', val: plan?.energy != null ? `${plan.energy}/10` : 'Not logged' },
            { label: 'Recovery', val: plan?.recoveryStatus || 'Not assessed' },
            { label: 'Soreness', val: plan?.soreness || 'Not logged' },
          ].map((s) => (
            <div
              key={s.label}
              className="p-2 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[10px] text-muted">{s.label}</p>
              <p className="text-xs font-bold text-white tab-num mt-0.5">{s.val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Quick-Adjust Mode Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {MODE_PILLS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => applyMode(m)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border transition-colors ${
              mode === m.id
                ? 'bg-teal border-teal text-bg'
                : 'bg-[#0e131f] border-white/10 text-muted hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Editable & Saveable Workout Plan Card */}
      <section
        className="rounded-2xl p-4 space-y-3"
        style={{ background: '#0e131f', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge color="purple">{plan?.workout?.muscleGroups?.[0] || 'Strength'}</Badge>
            <h3 className="text-base font-bold text-white mt-1">{splitTitle}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-white border border-white/10 flex items-center gap-1"
            >
              <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} /> Regenerate
            </button>
            <button
              type="button"
              onClick={saveCurrentPlan}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal/15 text-teal border border-teal/30 flex items-center gap-1"
            >
              <Bookmark size={12} /> Save Plan
            </button>
            <button
              type="button"
              onClick={() => setShowSavedDrawer((s) => !s)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple/15 text-purple border border-purple/30"
            >
              Saved ({savedPlans.length})
            </button>
          </div>
        </div>

        {/* Saved Plans Drawer */}
        {showSavedDrawer && (
          <div
            className="p-3 rounded-xl space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-purple">Saved Plans</p>
              <button type="button" onClick={() => setShowSavedDrawer(false)} className="text-muted">
                <X size={14} />
              </button>
            </div>
            {savedPlans.length === 0 ? (
              <p className="text-xs text-muted">No saved plans yet. Tap &quot;Save Plan&quot; above.</p>
            ) : (
              savedPlans.map((sp) => (
                <div key={sp.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{sp.title}</p>
                    <p className="text-[10px] text-muted">{sp.exercises?.length || 0} exercises • {sp.savedAt}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => loadSavedPlan(sp)}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold bg-teal text-bg"
                    >
                      Load Today
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedPlan(sp.id)}
                      className="p-1 text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Exercise Rows */}
        <div className="space-y-2">
          {exercises.map((ex, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl space-y-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-white truncate flex-1">{ex.name}</p>
                <button
                  type="button"
                  onClick={() => setSwapIndex(swapIndex === idx ? null : idx)}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-teal/10 text-teal border border-teal/25 flex items-center gap-1"
                >
                  <ArrowLeftRight size={11} /> Swap
                </button>
                <button
                  type="button"
                  onClick={() => removeExercise(idx)}
                  aria-label="Remove exercise"
                  className="p-1 text-muted hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs tab-num">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={ex.sets}
                  onChange={(e) => updateExercise(idx, { sets: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-14 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-center text-base"
                />
                <span className="text-muted">sets ×</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={ex.reps}
                  onChange={(e) => updateExercise(idx, { reps: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-14 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-center text-base"
                />
                <span className="text-muted">reps •</span>
                <input
                  type="number"
                  min={0}
                  step={2.5}
                  value={ex.weightKg ?? 0}
                  onChange={(e) => updateExercise(idx, { weightKg: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-teal text-center text-base"
                />
                <span className="text-muted">kg</span>
              </div>

              {swapIndex === idx && (
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {findAlternatives(ex.name).map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => {
                        updateExercise(idx, { name: alt.name });
                        setSwapIndex(null);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple/15 text-purple border border-purple/30"
                    >
                      ⇄ {alt.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addExercise}
          className="w-full py-2 rounded-xl text-xs font-semibold text-teal bg-teal/5 border border-dashed border-teal/30 flex items-center justify-center gap-1"
        >
          <Plus size={14} /> Add Exercise
        </button>
      </section>

      {/* Gold Fuel Banner & 4 Sub-Cards */}
      <div className="px-3 py-2.5 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-between text-xs">
        <span className="font-bold text-gold flex items-center gap-1.5">
          <Zap size={14} /> Today&apos;s Target
        </span>
        <span className="text-white font-semibold tab-num">
          {calTarget} kcal • {protTarget}g Protein • 3.5L Water
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'AI Meal Plan', sub: 'Indian macros', icon: Utensils, tab: 'diet', color: 'text-gold' },
          { label: 'Cardio Plan', sub: 'Zone 2 / HIIT', icon: Heart, tab: 'cardio', color: 'text-teal' },
          { label: 'Focus', sub: splitTitle, icon: Target, tab: 'progress', color: 'text-purple' },
          { label: 'Schedule', sub: 'Weekly rhythm', icon: Calendar, tab: 'home', color: 'text-teal' },
        ].map(({ label, sub, icon: Icon, tab, color }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate?.(tab)}
            className="p-3 rounded-xl text-left flex items-center gap-2.5"
            style={{ background: '#0e131f', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Icon size={16} className={color} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">{label}</p>
              <p className="text-[10px] text-muted truncate">{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={startAutopilotWorkout}
        className="w-full btn-teal flex items-center justify-center gap-2 py-3.5 text-sm"
      >
        <Play size={16} /> Start Autopilot Workout
      </button>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { Flame, Dumbbell, Utensils, TrendingUp, Zap, ArrowRight, Play, ChevronRight, Droplets, Target, Activity } from 'lucide-react';
import { api } from '../../shared/api.js';
import { GlassCard, CircularProgress, MacroBar, Spinner, ErrorMsg, Badge } from '../../shared/ui.jsx';

function dateIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function greet() {
  const h = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
  const hr = parseInt(h);
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage({ onNavigate }) {
  const [autopilot, setAutopilot] = useState(null);
  const [nutrition, setNutrition] = useState(null);
  const [progress, setProgress] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ap, nut, prog, al] = await Promise.allSettled([
        api('/autopilot/today'),
        api('/nutrition/diary/' + dateIST()),
        api('/progress/weight/weekly'),
        api('/progress/alerts'),
      ]);
      if (ap.status === 'fulfilled') setAutopilot(ap.value);
      if (nut.status === 'fulfilled') setNutrition(nut.value);
      if (prog.status === 'fulfilled') setProgress(prog.value);
      if (al.status === 'fulfilled') setAlerts(al.value || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const goal = autopilot?.goal || 'Muscle Gain';
  const workout = autopilot?.workout;
  const nut = nutrition || {};
  const calGoal = nut.calorieGoal || 2200;
  const calEaten = nut.totalCalories || 0;
  const protein = nut.totalProtein || 0;
  const carbs = nut.totalCarbs || 0;
  const fat = nut.totalFat || 0;
  const calLeft = Math.max(0, calGoal - calEaten);

  const weightArr = Array.isArray(progress) ? progress : [];
  const latestWeight = weightArr.length ? weightArr[weightArr.length - 1]?.weight : null;
  const targetWeight = autopilot?.targetWeight || null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Spinner size={36} />
    </div>
  );

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-muted text-xs uppercase tracking-widest font-semibold">
            {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold text-white mt-0.5">{greet()} 👋</h1>
        </div>
        <div className="flex gap-2">
          {goal === 'Muscle Gain' ? (
            <Badge color="teal">💪 Muscle Gain</Badge>
          ) : (
            <Badge color="purple">🔥 Weight Loss</Badge>
          )}
        </div>
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {/* Alerts */}
      {alerts.slice(0, 2).map((a, i) => (
        <div key={i} className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-xs flex items-center gap-2">
          <span>⚠️</span> {a.message || a}
        </div>
      ))}

      {/* Top 3 Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Weight Card */}
        <GlassCard className="col-span-1 flex flex-col items-center py-4 gap-1">
          <TrendingUp size={18} className="text-teal" />
          <span className="text-muted text-[10px]">Weight</span>
          <span className="tab-num text-white font-bold text-lg">{latestWeight ?? '—'}</span>
          {targetWeight && <span className="text-muted text-[10px]">Goal: {targetWeight}kg</span>}
        </GlassCard>

        {/* Calorie Ring */}
        <GlassCard className="col-span-1 flex flex-col items-center py-4 gap-1">
          <CircularProgress value={calEaten} max={calGoal} size={64} strokeWidth={5}>
            <span className="tab-num text-teal font-bold text-xs">{Math.round((calEaten / calGoal) * 100)}%</span>
          </CircularProgress>
          <span className="text-muted text-[10px]">{calLeft} kcal left</span>
        </GlassCard>

        {/* Plan Day */}
        <GlassCard className="col-span-1 flex flex-col items-center py-4 gap-1">
          <Activity size={18} className="text-purple" />
          <span className="text-muted text-[10px]">Today</span>
          <span className="text-white font-bold text-sm text-center leading-tight">{workout?.split || 'Rest Day'}</span>
        </GlassCard>
      </div>

      {/* Calorie + Macros */}
      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-gold" />
            <span className="font-semibold text-sm text-white">Today's Intake</span>
          </div>
          <span className="tab-num text-gold font-bold">{calEaten} <span className="text-muted font-normal">/ {calGoal} kcal</span></span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-teal transition-all"
            style={{ width: `${Math.min(100, (calEaten / calGoal) * 100)}%`, willChange: 'width' }}
          />
        </div>
        <div className="space-y-2">
          <MacroBar label="Protein" value={Math.round(protein)} max={Math.round(calGoal * 0.3 / 4)} color="teal" />
          <MacroBar label="Carbs" value={Math.round(carbs)} max={Math.round(calGoal * 0.45 / 4)} color="gold" />
          <MacroBar label="Fat" value={Math.round(fat)} max={Math.round(calGoal * 0.25 / 9)} color="purple" />
        </div>
        <button onClick={() => onNavigate('diet')} className="w-full text-center text-teal text-xs font-semibold mt-1 flex items-center justify-center gap-1">
          Log meal <ArrowRight size={12} />
        </button>
      </GlassCard>

      {/* Today's Workout Quick-Start */}
      <GlassCard accent="teal" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell size={20} className="text-teal" />
            <div>
              <p className="text-xs text-muted">Today's Split</p>
              <h3 className="text-white font-bold">{workout?.split || 'Rest Day'}</h3>
            </div>
          </div>
          <button
            onClick={() => onNavigate('workout')}
            className="btn-teal flex items-center gap-1.5 text-xs py-2 px-4"
          >
            <Play size={14} /> Start
          </button>
        </div>
        {workout?.muscleGroups?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {workout.muscleGroups.map((m, i) => (
              <Badge key={i} color="muted">{m}</Badge>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        {[
          { label: 'AI Coach', icon: Zap, tab: 'ai', color: 'purple', desc: 'Get your plan' },
          { label: 'Progress', icon: TrendingUp, tab: 'progress', color: 'teal', desc: 'See charts' },
          { label: 'Autopilot', icon: Activity, tab: 'autopilot', color: 'gold', desc: 'Daily mission' },
          { label: 'Cardio', icon: Flame, tab: 'cardio', color: 'teal', desc: 'Log run/swim' },
        ].map(({ label, icon: Icon, tab, color, desc }) => (
          <GlassCard key={tab} className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate(tab)}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'purple' ? 'bg-purple/10' : color === 'gold' ? 'bg-gold/10' : 'bg-teal/10'}`}>
              <Icon size={18} className={color === 'purple' ? 'text-purple' : color === 'gold' ? 'text-gold' : 'text-teal'} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{label}</p>
              <p className="text-muted text-xs">{desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

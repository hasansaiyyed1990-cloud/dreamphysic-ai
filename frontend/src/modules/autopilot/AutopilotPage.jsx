import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Navigation, Zap, Droplets, CheckCircle, Circle, ChevronRight, RefreshCw, MessageCircle, Plus, Minus } from 'lucide-react';
import { api } from '../../shared/api.js';
import { GlassCard, TealButton, PurpleButton, GhostButton, Spinner, ErrorMsg, Badge, CircularProgress } from '../../shared/ui.jsx';
import { getLocalIstDateString } from '../../shared/date.js';
import CoachText from '../../shared/CoachText.jsx';

// Isolated hydration stepper — doesn't re-render parent
const HydrationStepper = memo(({ value, onChange }) => (
  <div className="flex items-center gap-3">
    <button onClick={() => onChange(Math.max(0, value - 250))} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
      <Minus size={16} className="text-muted" />
    </button>
    <div className="flex-1 text-center">
      <span className="tab-num text-teal font-bold text-2xl">{value}</span>
      <span className="text-muted text-xs"> ml</span>
    </div>
    <button onClick={() => onChange(value + 250)} className="w-9 h-9 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center">
      <Plus size={16} className="text-teal" />
    </button>
  </div>
));

const normalizeHydration = value => ({
  ...(value || {}),
  waterMl: Number(value?.waterMl) || 0,
  goalMl: Number(value?.waterGoalMl ?? value?.goalMl) || 3000,
});

export default function AutopilotPage() {
  const [plan, setPlan] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [hydration, setHydration] = useState({ waterMl: 0, goalMl: 3000 });
  const [coachMsg, setCoachMsg] = useState('');
  const [coachReply, setCoachReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingHydration, setSavingHydration] = useState(false);
  const [askingCoach, setAskingCoach] = useState(false);
  const [generating, setGenerating] = useState(false);
  const dateIST = getLocalIstDateString();
  const loadControllerRef = useRef(null);
  const hydrationControllerRef = useRef(null);
  const hydrationTimerRef = useRef(null);
  const revisionRef = useRef(0);
  const syncedRevision = useRef(0);
  const hydrationRef = useRef(null);
  const visibilitySyncAtRef = useRef(0);

  const load = useCallback(async () => {
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    setLoading(true);
    try {
      const [p, b, h] = await Promise.allSettled([
        api('/autopilot/today', { signal: controller.signal }),
        api('/autopilot/briefing', { signal: controller.signal }),
        api('/nutrition/hydration/' + dateIST, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (p.status === 'fulfilled') setPlan(p.value);
      if (b.status === 'fulfilled') setBriefing(b.value);
      if (h.status === 'fulfilled') {
        const next = normalizeHydration(h.value);
        setHydration(next);
        hydrationRef.current = next;
        revisionRef.current = 0;
        syncedRevision.current = 0;
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => { loadControllerRef.current?.abort(); hydrationControllerRef.current?.abort(); clearTimeout(hydrationTimerRef.current); }; }, [load]);

  const syncHydration = useCallback(async (revision) => {
    const current = hydrationRef.current;
    if (!current || revision <= syncedRevision.current || !navigator.onLine) return;
    hydrationControllerRef.current?.abort();
    const controller = new AbortController();
    hydrationControllerRef.current = controller;
    setSavingHydration(true);
    try {
      await api('/nutrition/hydration/' + dateIST, { method: 'POST', body: { waterMl: current.waterMl }, signal: controller.signal });
      syncedRevision.current = Math.max(syncedRevision.current, revision);
      if (revisionRef.current > syncedRevision.current) {
        clearTimeout(hydrationTimerRef.current);
        hydrationTimerRef.current = setTimeout(() => syncHydration(revisionRef.current), 600);
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!controller.signal.aborted) setSavingHydration(false);
    }
  }, [dateIST]);

  useEffect(() => {
    const retryPending = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - visibilitySyncAtRef.current >= 10_000 && revisionRef.current > syncedRevision.current) {
        visibilitySyncAtRef.current = now;
        syncHydration(revisionRef.current);
      }
    };
    window.addEventListener('online', retryPending);
    document.addEventListener('visibilitychange', retryPending);
    return () => { window.removeEventListener('online', retryPending); document.removeEventListener('visibilitychange', retryPending); };
  }, [syncHydration]);

  async function generatePlan() {
    setGenerating(true);
    try {
      const p = await api('/autopilot/today/generate', { method: 'POST', body: {} });
      const previous = new Map((plan?.tasks || []).map(task => [task.id ?? `${task.category}:${task.description || task.task}`, task.completed]));
      setPlan({ ...p, tasks: (p.tasks || []).map(task => ({ ...task, completed: task.completed || previous.get(task.id ?? `${task.category}:${task.description || task.task}`) || false })) });
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function logHydration(ml) {
    const next = { ...(hydrationRef.current || hydration), waterMl: ml };
    hydrationRef.current = next;
    setHydration(next);
    const revision = ++revisionRef.current;
    clearTimeout(hydrationTimerRef.current);
    hydrationTimerRef.current = setTimeout(() => syncHydration(revision), 600);
  }

  async function askCoach() {
    if (!coachMsg.trim()) return;
    setAskingCoach(true);
    setCoachReply('');
    try {
      const res = await api('/autopilot/coach', { method: 'POST', body: { prompt: coachMsg } });
      setCoachReply(typeof res === 'string' ? res : res?.reply || res?.message || JSON.stringify(res));
      setCoachMsg('');
    } catch (e) {
      setError(e.message);
    } finally {
      setAskingCoach(false);
    }
  }

  const workout = plan?.workout;
  const nutrition = plan?.nutrition;
  const tasks = plan?.tasks || [];
  const hydPct = hydration.goalMl > 0 ? Math.min(100, (hydration.waterMl / hydration.goalMl) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Spinner size={36} /></div>;

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Navigation size={22} className="text-gold" /> Autopilot</h1>
        <button onClick={generatePlan} disabled={generating} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
          {generating ? <Spinner size={12} /> : <><RefreshCw size={12} /> Regenerate</>}
        </button>
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {/* AI Briefing */}
      {briefing?.todayBriefing && (
        <GlassCard accent="teal" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
          <div className="flex items-start gap-2 mb-2">
            <Zap size={16} className="text-teal mt-0.5 flex-shrink-0" />
            <p className="text-teal font-semibold text-sm">Today's Briefing</p>
          </div>
          <p className="text-white text-sm leading-relaxed">{briefing.todayBriefing}</p>
        </GlassCard>
      )}

      {/* Mission Control */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-teal" /> Daily Mission</h3>
        {tasks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted text-sm">No tasks generated yet.</p>
            <TealButton onClick={generatePlan} className="mt-3 text-xs">Generate Plan</TealButton>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${task.completed ? 'bg-teal border-teal' : 'border-white/20'}`}>
                  {task.completed && <CheckCircle size={12} className="text-bg" />}
                </div>
                <span className={`text-sm flex-1 ${task.completed ? 'line-through text-muted' : 'text-white'}`}>{task.description || task.task}</span>
                {task.category && <Badge color="muted">{task.category}</Badge>}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Workout Summary */}
      {workout && (
        <GlassCard>
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">💪 Today's Split</h3>
          <p className="text-teal font-bold">{workout.split || 'Rest'}</p>
          {workout.muscleGroups?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {workout.muscleGroups.map((m, i) => <Badge key={i} color="muted">{m}</Badge>)}
            </div>
          )}
        </GlassCard>
      )}

      {/* Nutrition Summary */}
      {nutrition && (
        <GlassCard>
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">🥗 Nutrition</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Calories', value: nutrition.targetCalories || nutrition.caloriesRemaining, unit: 'kcal', color: 'gold' },
              { label: 'Protein', value: nutrition.targetProtein || nutrition.proteinRemainingG, unit: 'g', color: 'teal' },
              { label: 'Remaining', value: nutrition.caloriesRemaining, unit: 'kcal', color: 'purple' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="text-center p-2 rounded-xl bg-white/5">
                <p className={`tab-num font-bold ${color === 'gold' ? 'text-gold' : color === 'purple' ? 'text-purple' : 'text-teal'}`}>{Math.round(value || 0)}</p>
                <p className="text-muted text-[10px]">{unit}</p>
                <p className="text-muted text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Hydration */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2"><Droplets size={16} className="text-teal" /> Hydration</h3>
          <span className="tab-num text-teal text-sm font-bold">{hydPct.toFixed(0)}%</span>
        </div>
        <HydrationStepper value={hydration.waterMl} onChange={(v) => logHydration(v)} />
        {savingHydration && <p className="text-muted text-[10px] text-center mt-1">Syncing water log…</p>}
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${hydPct}%`, willChange: 'width' }} />
        </div>
        <p className="text-muted text-xs text-center mt-1">{hydration.waterMl}ml / {hydration.goalMl}ml goal</p>
        {/* Quick add buttons */}
        <div className="flex gap-2 mt-3">
          {[250, 500, 750].map(ml => (
            <button key={ml} onClick={() => logHydration(hydration.waterMl + ml)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-teal bg-teal/10 border border-teal/20">
              +{ml}ml
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Quick Coach */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><MessageCircle size={16} className="text-purple" /> Quick Coach</h3>
        <div className="flex gap-2">
          <input
            value={coachMsg}
            onChange={e => setCoachMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askCoach()}
            placeholder="Ask anything… recovery, food, plan"
            className="flex-1 px-3 py-2.5 rounded-xl text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <TealButton onClick={askCoach} disabled={askingCoach || !coachMsg.trim()} className="px-4">
            {askingCoach ? <Spinner size={14} /> : 'Ask'}
          </TealButton>
        </div>
        {coachReply && (
          <div className="mt-3 p-3 rounded-xl bg-purple/5 border border-purple/20">
            <CoachText text={coachReply} className="text-white text-sm" />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

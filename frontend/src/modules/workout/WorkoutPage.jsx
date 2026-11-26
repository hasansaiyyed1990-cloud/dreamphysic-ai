import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Dumbbell, Plus, Play, ChevronRight, ChevronDown, RotateCcw, Check, Minus, Info, Repeat2 } from 'lucide-react';
import { api } from '../../shared/api.js';
import { GlassCard, TealButton, GhostButton, Spinner, ErrorMsg, Badge, Chip } from '../../shared/ui.jsx';

// Isolated stepper — won't re-render parent on tick
const SetRow = memo(({ set, onChange, onDone }) => {
  const [weight, setWeight] = useState(String(set.weightKg || ''));
  const [reps, setReps] = useState(String(set.reps || ''));
  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
      <span className="tab-num text-muted text-xs w-6">{set.setNumber}</span>
      <input
        type="number"
        placeholder="kg"
        value={weight}
        onChange={e => { setWeight(e.target.value); onChange({ ...set, weightKg: parseFloat(e.target.value) || 0 }); }}
        className="w-16 px-2 py-1.5 rounded-lg text-white text-sm text-center outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <span className="text-muted text-xs">×</span>
      <input
        type="number"
        placeholder="reps"
        value={reps}
        onChange={e => { setReps(e.target.value); onChange({ ...set, reps: parseInt(e.target.value) || 0 }); }}
        className="w-16 px-2 py-1.5 rounded-lg text-white text-sm text-center outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <button onClick={() => onDone(set)} className="ml-auto w-7 h-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center">
        <Check size={12} className="text-teal" />
      </button>
    </div>
  );
});

// Isolated Rest Timer — doesn't re-render parent
const RestTimer = memo(({ seconds: initSec, onDone }) => {
  const [sec, setSec] = useState(initSec);
  const ref = useRef(null);
  useEffect(() => {
    if (sec <= 0) { onDone?.(); return; }
    ref.current = setInterval(() => setSec(s => s - 1), 1000);
    return () => clearInterval(ref.current);
  }, []);
  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-teal/5 border border-teal/20">
      <div className="tab-num text-teal font-bold text-2xl">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div>
      <div className="flex-1">
        <p className="text-white text-xs font-semibold">Rest Timer</p>
        <p className="text-muted text-xs">Next set soon…</p>
      </div>
      <button onClick={onDone} className="text-xs text-teal font-semibold">Skip</button>
    </div>
  );
});

export default function WorkoutPage() {
  const [sessions, setSessions] = useState([]);
  const [library, setLibrary] = useState([]);
  const [goals, setGoals] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sets, setSets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('today'); // today | history | library
  const [restTimer, setRestTimer] = useState(null);
  const [savingSet, setSavingSet] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sess, lib, g] = await Promise.allSettled([
        api('/workouts'),
        api('/workouts/library'),
        api('/workouts/goals'),
      ]);
      if (sess.status === 'fulfilled') setSessions(Array.isArray(sess.value) ? sess.value : []);
      if (lib.status === 'fulfilled') setLibrary(Array.isArray(lib.value) ? lib.value : []);
      if (g.status === 'fulfilled') setGoals(g.value);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startSession(split) {
    setCreating(true);
    try {
      const session = await api('/workouts', { method: 'POST', body: { split, startedAt: new Date().toISOString() } });
      setActiveSession(session);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function logSet(workoutId, setData) {
    setSavingSet(true);
    try {
      await api(`/workouts/${workoutId}/sets`, { method: 'POST', body: setData });
      setRestTimer(90);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingSet(false);
    }
  }

  const SPLITS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest & Tri', 'Back & Bi', 'Shoulders', 'Rest'];

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Spinner size={36} /></div>;

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Dumbbell size={22} className="text-teal" /> Workout</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {['today', 'history', 'library'].map(t => (
          <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {tab === 'today' && (
        <>
          {/* Rest Timer */}
          {restTimer !== null && (
            <RestTimer seconds={restTimer} onDone={() => setRestTimer(null)} />
          )}

          {/* Active Session */}
          {activeSession ? (
            <GlassCard accent="teal">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Badge color="teal">LIVE SESSION</Badge>
                  <h3 className="text-white font-bold mt-1">{activeSession.split}</h3>
                </div>
                <TealButton onClick={() => setActiveSession(null)} className="text-xs py-1.5 px-3">Done</TealButton>
              </div>
              {activeSession.exercises?.map((ex, ei) => (
                <div key={ei} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-teal/10 border border-teal/30 flex items-center justify-center">
                      <span className="text-teal font-bold text-xs">{ei + 1}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{ex.name}</p>
                      <p className="text-muted text-xs">{ex.sets} sets · {ex.reps} reps · {ex.rest}s rest</p>
                    </div>
                  </div>
                  {Array.from({ length: ex.sets }, (_, si) => (
                    <SetRow
                      key={si}
                      set={{ setNumber: si + 1, weightKg: ex.defaultWeight, reps: ex.defaultReps, exerciseId: ex.id }}
                      onChange={() => {}}
                      onDone={(s) => logSet(activeSession.id, { ...s, exerciseName: ex.name })}
                    />
                  ))}
                </div>
              ))}
            </GlassCard>
          ) : (
            /* Split Selector */
            <GlassCard>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Play size={16} className="text-teal" /> Start a Session</h3>
              <div className="flex flex-wrap gap-2">
                {SPLITS.map(s => (
                  <button
                    key={s}
                    onClick={() => s !== 'Rest' && startSession(s)}
                    disabled={creating}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border
                      ${s === 'Rest' ? 'border-white/5 text-muted cursor-default' : 'border-teal/20 bg-teal/5 text-teal hover:bg-teal/10 active:scale-95'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Goals */}
          {goals && (
            <GlassCard>
              <h3 className="font-semibold text-white mb-2">Workout Goals</h3>
              <p className="text-muted text-sm">{goals.weeklyTarget || goals.goal || 'No goal set'}</p>
            </GlassCard>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Dumbbell size={36} className="mx-auto mb-3 opacity-30" />
              <p>No sessions yet. Start your first workout!</p>
            </div>
          ) : sessions.slice(0, 20).map((s, i) => (
            <GlassCard key={i}>
              <div className="flex items-center justify-between">
                <div>
                  <Badge color="muted">{s.startedAt?.slice(0, 10)}</Badge>
                  <h4 className="text-white font-semibold mt-1">{s.split}</h4>
                  <p className="text-muted text-xs mt-0.5">{s.totalSets || 0} sets · {s.totalVolume ? s.totalVolume.toFixed(0) + 'kg vol' : ''}</p>
                </div>
                <Repeat2 size={18} className="text-muted" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-3">
          {library.map((ex, i) => (
            <GlassCard key={i}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center">
                  <Dumbbell size={18} className="text-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{ex.name}</p>
                  <p className="text-muted text-xs">{ex.muscleGroup} · {ex.equipment}</p>
                </div>
                <Badge color="muted">{ex.type}</Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Dumbbell, Plus, Play, ChevronRight, ChevronDown, RotateCcw, Check, Minus, Info, Repeat2, Trash2, Pencil, X, Search } from 'lucide-react';
import { api } from '../../shared/api.js';
import { GlassCard, TealButton, GhostButton, Spinner, ErrorMsg, Badge, Chip, ContentEmptyState, ScienceTooltip } from '../../shared/ui.jsx';
import { GYM_EXERCISES } from './gymExerciseSwapDb.js';
import { scheduleRestTimerCompletion } from '../../shared/restTimerNotification.js';
import { useAuth } from '../../shared/AuthContext.jsx';

// Isolated stepper — won't re-render parent on tick
const SetRow = memo(({ set, onChange, onDone, disabled = false }) => {
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
      <button disabled={disabled} onClick={() => onDone(set)} className="ml-auto w-7 h-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center disabled:opacity-40">
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
  useEffect(() => {
    let cancelNotification;
    scheduleRestTimerCompletion(initSec).then(cancel => { cancelNotification = cancel; });
    return () => cancelNotification?.();
  }, [initSec]);
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
  const { user } = useAuth() ?? {};
  const userKey = user?.id || user?.email || 'default';
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
  const [completedSetKeys, setCompletedSetKeys] = useState([]);
  const [swapHistory, setSwapHistory] = useState(null);
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [browseSectionId, setBrowseSectionId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const loadControllerRef = useRef(null);
  const swapControllerRef = useRef(null);
  const inFlightSetKeysRef = useRef(new Set());

  const load = useCallback(async () => {
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    setLoading(true);
    try {
      const [sess, lib, g, sec] = await Promise.allSettled([
        api('/workouts', { signal: controller.signal }),
        api('/workouts/library', { signal: controller.signal }),
        api('/workouts/goals', { signal: controller.signal }),
        api('/workouts/sections', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (sess.status === 'fulfilled') setSessions(Array.isArray(sess.value) ? sess.value : []);
      if (lib.status === 'fulfilled') setLibrary(Array.isArray(lib.value) ? lib.value : []);
      if (g.status === 'fulfilled') setGoals(g.value);
      if (sec.status === 'fulfilled') setSections(Array.isArray(sec.value) ? sec.value : []);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => { loadControllerRef.current?.abort(); swapControllerRef.current?.abort(); }; }, [load]);

  async function startSession(split, plannedExercises = null) {
    setCreating(true);
    try {
      const sessionDate = new Date().toISOString().slice(0, 19);
      const session = await api('/workouts', { method: 'POST', body: { name: split, sessionDate } });
      const groups = split === 'Push' || split === 'Chest & Tri' ? ['Chest', 'Shoulders', 'Triceps']
        : split === 'Pull' || split === 'Back & Bi' ? ['Back Width', 'Back Thickness', 'Biceps']
          : split === 'Legs' || split === 'Lower' ? ['Legs'] : split === 'Upper' ? ['Chest', 'Back Width', 'Shoulders', 'Biceps'] : null;
      const starterExercises = plannedExercises?.length ? plannedExercises.map(ex => ({
        id: ex.id || ex.name,
        name: ex.name,
        sets: Number(ex.sets) || 3,
        reps: Number(ex.reps) || 8,
        rest: Number(ex.restSeconds ?? ex.rest) || 90,
        defaultWeight: Number(ex.weightKg) || 0,
        defaultReps: Number(ex.reps) || 8,
      })) : GYM_EXERCISES.filter(ex => !groups || groups.includes(ex.muscleGroup)).slice(0, 4).map(ex => ({
        id: ex.id, name: ex.name, sets: 3, reps: 8, rest: 90, defaultWeight: 0, defaultReps: 8,
      }));
      setActiveSession({ ...session, split: session.name || split, exercises: starterExercises });
      setCompletedSetKeys([]);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dp_autopilot_workout_pending');
      if (!raw) return;
      const pending = JSON.parse(raw);
      if (pending?.userKey !== userKey || !pending?.exercises?.length) return;
      sessionStorage.removeItem('dp_autopilot_workout_pending');
      startSession(pending.split || 'Autopilot Workout', pending.exercises);
    } catch {
      sessionStorage.removeItem('dp_autopilot_workout_pending');
    }
  }, [userKey]);

  async function logSet(workoutId, setData) {
    const key = `${workoutId}:${setData.exerciseName}:${setData.setNumber}`;
    if (completedSetKeys.includes(key) || inFlightSetKeysRef.current.has(key)) return;
    inFlightSetKeysRef.current.add(key);
    setSavingSet(true);
    try {
      await api(`/workouts/${workoutId}/sets`, { method: 'POST', body: {
        exerciseName: setData.exerciseName,
        setNumber: setData.setNumber,
        reps: setData.reps,
        weightKg: setData.weightKg,
        restSeconds: setData.restSeconds,
      } });
      setCompletedSetKeys(keys => keys.includes(key) ? keys : [...keys, key]);
      setRestTimer(90);
    } catch (e) {
      if (/409|conflict/i.test(e.message)) setCompletedSetKeys(keys => keys.includes(key) ? keys : [...keys, key]);
      else inFlightSetKeysRef.current.delete(key);
      setError(e.message);
    } finally {
      if (completedSetKeys.includes(key)) inFlightSetKeysRef.current.delete(key);
      setSavingSet(false);
    }
  }

  async function lookupSwapHistory(exerciseName) {
    swapControllerRef.current?.abort();
    const controller = new AbortController();
    swapControllerRef.current = controller;
    setSwapHistory({ exerciseName, sets: [], loading: true });
    try {
      const rows = await api(`/workouts/last-session/sets?exerciseName=${encodeURIComponent(exerciseName)}`, { signal: controller.signal });
      if (!controller.signal.aborted) setSwapHistory({ exerciseName, sets: Array.isArray(rows) ? rows : [], loading: false });
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    }
  }

  async function addSection() {
    const name = newSectionName.trim();
    if (!name) return;
    try {
      const created = await api('/workouts/sections', { method: 'POST', body: { name } });
      setSections(prev => [...prev, created]);
      setNewSectionName('');
    } catch (e) { setError(e.message); }
  }

  async function renameSection(id) {
    const name = renameValue.trim();
    if (!name) return;
    try {
      const updated = await api(`/workouts/sections/${id}`, { method: 'PUT', body: { name } });
      setSections(prev => prev.map(s => s.id === id ? updated : s));
      setRenamingId(null);
    } catch (e) { setError(e.message); }
  }

  async function deleteSection(id) {
    try {
      await api(`/workouts/sections/${id}`, { method: 'DELETE' });
      setSections(prev => prev.filter(s => s.id !== id));
      if (browseSectionId === id) setBrowseSectionId(null);
    } catch (e) { setError(e.message); }
  }

  async function addExerciseToSection(section, ex) {
    try {
      const updated = await api(`/workouts/sections/${section.id}/exercises`, { method: 'POST', body: {
        exerciseName: ex.name,
        equipment: ex.equipment || '',
        muscleGroup: ex.muscleGroup || section.name,
      } });
      setSections(prev => prev.map(s => s.id === section.id ? updated : s));
    } catch (e) { setError(e.message); }
  }

  async function removeExerciseFromSection(section, exerciseId) {
    try {
      const updated = await api(`/workouts/sections/${section.id}/exercises/${exerciseId}`, { method: 'DELETE' });
      setSections(prev => prev.map(s => s.id === section.id ? updated : s));
    } catch (e) { setError(e.message); }
  }

  function browseExercises(section) {
    const key = section.name.trim().toLowerCase();
    const matches = (muscle) => {
      const m = String(muscle || '').toLowerCase();
      return m.includes(key) || key.includes(m);
    };
    const fromLibrary = library.filter(ex => matches(ex.muscleGroup) || (ex.primaryMuscles || []).some(matches));
    const seen = new Set(fromLibrary.map(ex => ex.name.toLowerCase()));
    const fromLocal = GYM_EXERCISES.filter(ex => matches(ex.muscleGroup) && !seen.has(ex.name.toLowerCase()));
    return [...fromLibrary, ...fromLocal];
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

          {/* My Muscle Sections */}
          <GlassCard>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Dumbbell size={16} className="text-teal" /> My Sections</h3>
            <div className="flex gap-2 mb-3">
              <input
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                placeholder="New section, e.g. Triceps"
                className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button onClick={addSection} className="px-3 py-2 rounded-xl text-xs font-semibold border border-teal/20 bg-teal/5 text-teal flex items-center gap-1"><Plus size={14} /> Add</button>
            </div>
            {sections.length === 0 && <p className="text-muted text-xs">No sections yet. Add one like Triceps, Back or Chest.</p>}
            {sections.map(section => (
              <div key={section.id} className="mb-3 rounded-xl border border-white/5 p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2">
                  {renamingId === section.id ? (
                    <>
                      <input
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <button onClick={() => renameSection(section.id)} className="text-teal"><Check size={16} /></button>
                      <button onClick={() => setRenamingId(null)} className="text-muted"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <p className="text-white text-sm font-semibold flex-1">{section.name}</p>
                      <button onClick={() => { setRenamingId(section.id); setRenameValue(section.name); }} className="text-muted"><Pencil size={14} /></button>
                      <button onClick={() => deleteSection(section.id)} className="text-muted"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
                {(section.exercises || []).map(ex => (
                  <div key={ex.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                    <p className="text-white text-xs flex-1">{ex.exerciseName}{ex.equipment ? <span className="text-muted"> · {ex.equipment}</span> : null}</p>
                    <button onClick={() => removeExerciseFromSection(section, ex.id)} className="text-muted"><X size={13} /></button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setBrowseSectionId(browseSectionId === section.id ? null : section.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-teal/20 bg-teal/5 text-teal flex items-center gap-1"><Search size={12} /> Browse</button>
                  {(section.exercises || []).length > 0 && (
                    <button onClick={() => startSession(section.name, section.exercises.map(e => ({ name: e.exerciseName, sets: 3, reps: 8, restSeconds: 90 })))} disabled={creating} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-white flex items-center gap-1"><Play size={12} /> Start</button>
                  )}
                </div>
                {browseSectionId === section.id && (
                  <div className="mt-2">
                    {browseExercises(section).length === 0 && <p className="text-muted text-xs">No {section.name} exercises found.</p>}
                    {browseExercises(section).map((ex, i) => (
                      <button key={`${ex.name}-${i}`} onClick={() => addExerciseToSection(section, ex)} className="w-full flex items-center gap-2 py-2 border-b border-white/5 last:border-0 text-left">
                        <Plus size={13} className="text-teal" />
                        <span className="text-white text-xs flex-1">{ex.name}</span>
                        <span className="text-muted text-xs">{ex.equipment || ex.muscleGroup}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </GlassCard>

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
                      set={{ setNumber: si + 1, weightKg: ex.defaultWeight, reps: ex.defaultReps, restSeconds: ex.rest }}
                      onChange={() => {}}
                      disabled={savingSet || completedSetKeys.includes(`${activeSession.id}:${ex.name}:${si + 1}`)}
                      onDone={(s) => logSet(activeSession.id, { ...s, exerciseName: ex.name, restSeconds: ex.rest })}
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
              <ContentEmptyState section="workout" onAction={() => setTab('today')} />
            </div>
          ) : sessions.slice(0, 20).map((s, i) => (
            <GlassCard key={i}>
              <div className="flex items-center justify-between">
                <div>
                  <Badge color="muted">{s.sessionDate?.slice(0, 10)}</Badge>
                  <h4 className="text-white font-semibold mt-1">{s.name}</h4>
                  <p className="text-muted text-xs mt-0.5">{s.sets?.length || 0} sets · {(s.sets || []).reduce((sum, set) => sum + Number(set.weightKg || 0) * Number(set.reps || 0), 0).toFixed(0)} kg volume</p>
                </div>
                <Repeat2 size={18} className="text-muted" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-3">
          <GlassCard>
            <h3 className="text-white font-semibold mb-2">Exercise swaps <ScienceTooltip name="warmupVsWorkingSets" /></h3>
            <p className="text-muted text-xs mb-3">Choose a similar movement to compare your previous working sets.</p>
            <select className="w-full rounded-lg bg-white/5 border border-white/10 p-3 text-white" defaultValue="" onChange={e => e.target.value && lookupSwapHistory(e.target.value)}>
              <option value="">Choose an exercise</option>
              {GYM_EXERCISES.map(ex => <option key={ex.id} value={ex.name}>{ex.muscleGroup}: {ex.name}</option>)}
            </select>
            {swapHistory && <div className="mt-3 text-xs text-muted">
              <p className="text-white font-semibold">{swapHistory.exerciseName}{swapHistory.loading ? ' · Loading…' : ''}</p>
              {!swapHistory.loading && (swapHistory.sets.length ? swapHistory.sets.map((s, i) => <p key={`${s.setNumber}-${i}`}>Set {s.setNumber}: {s.weightKg} kg × {s.reps} reps</p>) : <p>No saved sets for this exercise yet.</p>)}
            </div>}
          </GlassCard>
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

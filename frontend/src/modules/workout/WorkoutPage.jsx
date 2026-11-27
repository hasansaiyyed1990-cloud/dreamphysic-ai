import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  Dumbbell, Plus, Play, Check, X, ChevronDown, ChevronUp, History, Search,
  Flame, TrendingUp,
} from 'lucide-react';
import { api } from '../../shared/api.js';
import { GlassCard, TealButton, GhostButton, Spinner, ErrorMsg, Badge, Chip, ContentEmptyState } from '../../shared/ui.jsx';
import { curatedGifUrl, loadGifIndex, matchGif } from './exerciseMedia.js';
import { scheduleRestTimerCompletion } from '../../shared/restTimerNotification.js';
import { useAuth } from '../../shared/AuthContext.jsx';

const SPLITS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Arms', 'Chest & Tri', 'Back & Bi'];

// Library muscle groups mapped to the body parts a lifter actually trains.
const MUSCLE_TABS = [
  { key: 'All', muscles: null },
  { key: 'Chest', muscles: ['Chest'] },
  { key: 'Back', muscles: ['Lats', 'Middle Back', 'Lower Back', 'Traps', 'Back'] },
  { key: 'Shoulders', muscles: ['Shoulders', 'Neck'] },
  { key: 'Biceps', muscles: ['Biceps', 'Forearms'] },
  { key: 'Triceps', muscles: ['Triceps'] },
  { key: 'Legs', muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors', 'Legs'] },
  { key: 'Core', muscles: ['Abdominals'] },
];

const SPLIT_MUSCLES = {
  Push: ['Chest', 'Shoulders', 'Triceps'],
  Pull: ['Lats', 'Middle Back', 'Biceps'],
  Legs: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
  Upper: ['Chest', 'Lats', 'Shoulders', 'Biceps', 'Triceps'],
  Lower: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
  'Full Body': 'All',
};

/** Library names carry a coaching suffix ("Barbell Bench Press - Medium Grip"). */
const shortName = (name) => String(name || '').split(' - ')[0].trim();

const volumeOf = (sets) => (sets || []).reduce((sum, s) => sum + Number(s.weightKg || 0) * Number(s.reps || 0), 0);

const groupSetsByExercise = (sets) => {
  const grouped = [];
  for (const row of sets || []) {
    const key = String(row.exerciseName || '').toLowerCase();
    let bucket = grouped.find(g => g.name.toLowerCase() === key);
    if (!bucket) { bucket = { name: row.exerciseName, sets: [] }; grouped.push(bucket); }
    bucket.sets.push(row);
  }
  return grouped;
};

// Isolated stepper — won't re-render parent on tick
const SetRow = memo(({ set, onChange, onDone, disabled = false, done = false }) => {
  const [weight, setWeight] = useState(set.weightKg ? String(set.weightKg) : '');
  const [reps, setReps] = useState(set.reps ? String(set.reps) : '');
  useEffect(() => { if (done) { setWeight(set.weightKg ? String(set.weightKg) : ''); setReps(set.reps ? String(set.reps) : ''); } }, [done, set.weightKg, set.reps]);
  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
      <span className="tab-num text-muted text-xs w-6">{set.setNumber}</span>
      <input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        value={weight}
        disabled={disabled}
        onChange={e => { setWeight(e.target.value); onChange({ ...set, weightKg: parseFloat(e.target.value) || 0 }); }}
        className="w-16 px-2 py-1.5 rounded-lg text-white text-sm text-center outline-none disabled:opacity-50"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <span className="text-muted text-xs">×</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        disabled={disabled}
        onChange={e => { setReps(e.target.value); onChange({ ...set, reps: parseInt(e.target.value, 10) || 0 }); }}
        className="w-16 px-2 py-1.5 rounded-lg text-white text-sm text-center outline-none disabled:opacity-50"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <button
        disabled={disabled}
        onClick={() => onDone({ ...set, weightKg: parseFloat(weight) || 0, reps: parseInt(reps, 10) || 0 })}
        className={`ml-auto w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 ${done ? 'bg-teal/25 border border-teal/50' : 'bg-teal/10 border border-teal/30'}`}
      >
        <Check size={13} className="text-teal" />
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
      <div className="tab-num text-teal font-bold text-2xl">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>
      <div className="flex-1">
        <p className="text-white text-xs font-semibold">Rest Timer</p>
        <p className="text-muted text-xs">Next set soon…</p>
      </div>
      <button onClick={onDone} className="text-xs text-teal font-semibold">Skip</button>
    </div>
  );
});

// Animated demo: GIF first, backend still image next, dumbbell icon last
const ExerciseDemo = memo(({ name, exerciseId, images, size = 48 }) => {
  const still = Array.isArray(images) && images.length ? images[0] : '';
  const curated = exerciseId ? curatedGifUrl(exerciseId) : '';
  const [gif, setGif] = useState(curated);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let alive = true;
    setGif(curated);
    setStage(0);
    if (!curated && name) {
      loadGifIndex().then(index => { if (alive) setGif(matchGif(index, shortName(name))); });
    }
    return () => { alive = false; };
  }, [curated, name]);

  const sources = [gif, still].filter(Boolean);
  const src = sources[stage];
  const style = { width: size, height: size };

  if (!src) {
    return (
      <div className="rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0" style={style}>
        <Dumbbell size={Math.round(size / 3.2)} className="text-teal" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${shortName(name)} demonstration`}
      loading="lazy"
      onError={() => setStage(i => i + 1)}
      className="rounded-xl object-cover bg-black/30 border border-teal/20 shrink-0"
      style={style}
    />
  );
});

/** Exercise detail sheet: GIF, how to perform it, previous numbers, add to session. */
function ExerciseDetail({ exercise, onClose, onAdd, canAdd, onStartSession }) {
  const [last, setLast] = useState(null);
  const name = shortName(exercise.name);

  useEffect(() => {
    let alive = true;
    setLast(null);
    api(`/workouts/last-session/sets?exerciseName=${encodeURIComponent(name)}`)
      .then(rows => { if (alive) setLast(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (alive) setLast([]); });
    return () => { alive = false; };
  }, [name]);

  const steps = (exercise.instructions && exercise.instructions.length ? exercise.instructions : [exercise.setup, exercise.brace, exercise.execution])
    .filter(Boolean)
    .slice(0, 6);
  const muscles = [...(exercise.primaryMuscles || []), ...(exercise.secondaryMuscles || [])].slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-teal/25 p-4 space-y-3 animate-fade-in"
        style={{ background: '#0b1220' }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <ExerciseDemo name={exercise.name} images={exercise.imageUrls} size={96} />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold leading-tight">{name}</h3>
            <p className="text-muted text-xs mt-0.5">{exercise.muscleGroup} · {exercise.equipment || 'bodyweight'}</p>
            {muscles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {muscles.map(m => (
                  <span key={m} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted text-[10px]">{m}</span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <X size={13} className="text-muted" />
          </button>
        </div>

        <div>
          <p className="text-teal text-xs font-semibold uppercase tracking-wide mb-1">How to do it</p>
          <ol className="space-y-1.5">
            {steps.length === 0 && <li className="text-muted text-xs">No instructions saved for this exercise.</li>}
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="tab-num text-teal/70 text-[11px] mt-0.5">{i + 1}.</span>
                <span className="text-white/80 text-xs leading-relaxed">{String(step).replace(/^Tip:\s*/i, '')}</span>
              </li>
            ))}
          </ol>
        </div>

        {exercise.commonMistakes && (
          <div className="p-2.5 rounded-xl bg-gold/5 border border-gold/20">
            <p className="text-gold text-[10px] font-semibold uppercase tracking-wide mb-0.5">Avoid</p>
            <p className="text-white/70 text-xs leading-relaxed">{exercise.commonMistakes}</p>
          </div>
        )}

        <div>
          <p className="text-teal text-xs font-semibold uppercase tracking-wide mb-1">Last time</p>
          {last === null ? (
            <p className="text-muted text-xs">Loading…</p>
          ) : last.length === 0 ? (
            <p className="text-muted text-xs">Not logged yet — this will be your first session.</p>
          ) : (
            <div className="space-y-0.5">
              {last.map((row, i) => (
                <p key={`${row.setNumber}-${i}`} className="text-white/80 text-xs">Set {row.setNumber}: {row.weightKg} kg × {row.reps} reps</p>
              ))}
            </div>
          )}
        </div>

        {canAdd ? (
          <TealButton onClick={() => { onAdd(exercise); onClose(); }} className="w-full text-sm py-2.5">Add to today's session</TealButton>
        ) : (
          <TealButton onClick={() => { onStartSession(exercise); onClose(); }} className="w-full text-sm py-2.5">Start a session with this</TealButton>
        )}
      </div>
    </div>
  );
}

export default function WorkoutPage() {
  const { user } = useAuth() ?? {};
  const userKey = user?.id || user?.email || 'default';
  const customKey = `dp_custom_exercises_${userKey}`;

  const [sessions, setSessions] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('today'); // today | exercises | history
  const [muscleTab, setMuscleTab] = useState('Chest');
  const [query, setQuery] = useState('');
  const [equipTab, setEquipTab] = useState('All');
  const [detail, setDetail] = useState(null);

  const [activeSession, setActiveSession] = useState(null);
  const [completedSetKeys, setCompletedSetKeys] = useState([]);
  const [restTimer, setRestTimer] = useState(null);
  const [savingSet, setSavingSet] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openSession, setOpenSession] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', sets: 3, reps: 8, rest: 90 });
  const [savedExercises, setSavedExercises] = useState([]);

  const loadControllerRef = useRef(null);
  const inFlightSetKeysRef = useRef(new Set());
  const lastSetsCacheRef = useRef(new Map());

  const load = useCallback(async () => {
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    setLoading(true);
    try {
      const [sess, lib] = await Promise.allSettled([
        api('/workouts', { signal: controller.signal }),
        api('/workouts/library', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (sess.status === 'fulfilled') setSessions(Array.isArray(sess.value) ? sess.value : []);
      if (lib.status === 'fulfilled') setLibrary(Array.isArray(lib.value) ? lib.value : []);
      const failure = [sess, lib].find(r => r.status === 'rejected');
      if (failure) setError(failure.reason?.message || 'Could not load workout data');
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => loadControllerRef.current?.abort(); }, [load]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(customKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedExercises(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedExercises([]);
    }
  }, [customKey]);

  async function lastSetsFor(name) {
    const key = String(name || '').toLowerCase();
    if (lastSetsCacheRef.current.has(key)) return lastSetsCacheRef.current.get(key);
    try {
      const rows = await api(`/workouts/last-session/sets?exerciseName=${encodeURIComponent(name)}`);
      const safe = Array.isArray(rows) ? rows : [];
      lastSetsCacheRef.current.set(key, safe);
      return safe;
    } catch {
      lastSetsCacheRef.current.set(key, []);
      return [];
    }
  }

  function rememberExercise(entry) {
    setSavedExercises(prev => {
      const next = [entry, ...prev.filter(x => x.name.toLowerCase() !== entry.name.toLowerCase())].slice(0, 20);
      try { localStorage.setItem(customKey, JSON.stringify(next)); } catch { /* keep in memory only */ }
      return next;
    });
  }

  const clampInt = (value, fallback, min, max) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  };

  async function addExercise(def) {
    if (!activeSession) return;
    const name = shortName(def?.name);
    if (!name) return;
    const targetSets = clampInt(def.sets, 3, 1, 20);
    const targetReps = clampInt(def.reps, 8, 1, 100);
    const previous = await lastSetsFor(name);
    const top = previous.reduce((best, row) => (Number(row.weightKg || 0) >= Number(best?.weightKg || 0) ? row : best), null);
    const entry = {
      id: def.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      sets: targetSets,
      reps: targetReps,
      rest: clampInt(def.rest ?? def.restSeconds, 90, 0, 600),
      defaultWeight: Number(top?.weightKg || 0),
      defaultReps: Number(top?.reps || targetReps),
      images: Array.isArray(def.images) ? def.images : [],
      previous,
    };
    setActiveSession(s => ({ ...s, exercises: [...(s.exercises || []), entry] }));
    rememberExercise({ name, sets: targetSets, reps: targetReps, rest: entry.rest });
  }

  function removeExercise(index) {
    setActiveSession(s => ({ ...s, exercises: (s.exercises || []).filter((_, i) => i !== index) }));
  }

  function addSetSlot(index) {
    setActiveSession(s => ({
      ...s,
      exercises: (s.exercises || []).map((ex, i) => (i === index ? { ...ex, sets: Math.min(20, ex.sets + 1) } : ex)),
    }));
  }

  async function startSession(split, starterExercise = null) {
    setCreating(true);
    try {
      const sessionDate = new Date().toISOString().slice(0, 19);
      const session = await api('/workouts', { method: 'POST', body: { name: split, sessionDate } });
      const allowed = SPLIT_MUSCLES[split];
      const starters = starterExercise
        ? [starterExercise]
        : library
          .filter(ex => !allowed || allowed === 'All' || (Array.isArray(allowed) && allowed.includes(ex.muscleGroup)))
          .slice(0, 4);
      const exercises = await Promise.all(starters.map(async ex => {
        const name = shortName(ex.name);
        const previous = await lastSetsFor(name);
        const top = previous.reduce((best, row) => (Number(row.weightKg || 0) >= Number(best?.weightKg || 0) ? row : best), null);
        return {
          id: String(ex.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          sets: 3,
          reps: 8,
          rest: 90,
          defaultWeight: Number(top?.weightKg || 0),
          defaultReps: Number(top?.reps || 8),
          images: Array.isArray(ex.imageUrls) ? ex.imageUrls : [],
          previous,
        };
      }));
      setActiveSession({ ...session, split: session.name || split, exercises });
      setCompletedSetKeys([]);
      setTab('today');
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
      const mapped = pending.exercises.map(ex => ({
        id: String(ex.id || ex.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: shortName(ex.name),
        sets: Number(ex.sets) || 3,
        reps: Number(ex.reps) || 8,
        rest: Number(ex.restSeconds ?? ex.rest) || 90,
        defaultWeight: Number(ex.weightKg) || 0,
        defaultReps: Number(ex.reps) || 8,
        images: [],
        previous: [],
      }));
      (async () => {
        try {
          const sessionDate = new Date().toISOString().slice(0, 19);
          const session = await api('/workouts', { method: 'POST', body: { name: pending.split || 'Autopilot Workout', sessionDate } });
          setActiveSession({ ...session, split: pending.split || 'Autopilot Workout', exercises: mapped });
          setCompletedSetKeys([]);
          setTab('today');
        } catch (e) {
          setError(e.message);
        }
      })();
    } catch {
      sessionStorage.removeItem('dp_autopilot_workout_pending');
    }
  }, [userKey]);

  async function logSet(workoutId, setData) {
    if (!setData.exerciseName) return;
    const key = `${workoutId}:${setData.exerciseName}:${setData.setNumber}`;
    if (completedSetKeys.includes(key) || inFlightSetKeysRef.current.has(key)) return;
    inFlightSetKeysRef.current.add(key);
    setSavingSet(true);
    try {
      const saved = await api(`/workouts/${workoutId}/sets`, { method: 'POST', body: {
        exerciseName: setData.exerciseName,
        setNumber: setData.setNumber,
        reps: setData.reps,
        weightKg: setData.weightKg,
        restSeconds: setData.restSeconds,
      } });
      // Keep the history tab in sync without re-fetching the whole list.
      if (saved && saved.exerciseName) {
        setSessions(prev => prev.map(s => s.id === workoutId
          ? { ...s, sets: [...(s.sets || []).filter(x => !(x.exerciseName === saved.exerciseName && x.setNumber === saved.setNumber)), saved] }
          : s));
      }
      setCompletedSetKeys(keys => keys.includes(key) ? keys : [...keys, key]);
      const cacheKey = setData.exerciseName.toLowerCase();
      lastSetsCacheRef.current.delete(cacheKey);
      setRestTimer(Number(setData.restSeconds) || 90);
    } catch (e) {
      if (/409|conflict/i.test(e.message)) setCompletedSetKeys(keys => keys.includes(key) ? keys : [...keys, key]);
      else inFlightSetKeysRef.current.delete(key);
      setError(e.message);
    } finally {
      inFlightSetKeysRef.current.delete(key);
      setSavingSet(false);
    }
  }

  function finishSession() {
    setActiveSession(null);
    setCompletedSetKeys([]);
    setRestTimer(null);
    load();
  }

  function submitDraft() {
    if (!draft.name.trim()) {
      setError('Enter an exercise name first');
      return;
    }
    addExercise(draft);
    setDraft({ name: '', sets: draft.sets, reps: draft.reps, rest: draft.rest });
    setAddOpen(false);
  }

  const draftQuery = draft.name.trim().toLowerCase();
  const draftMatches = draftQuery.length >= 2
    ? library.filter(ex => ex.name.toLowerCase().includes(draftQuery)).slice(0, 5)
    : [];

  const libraryByName = useMemo(() => {
    const map = new Map();
    for (const ex of library) map.set(shortName(ex.name).toLowerCase(), ex);
    return map;
  }, [library]);

  function openDetailFor(exerciseName) {
    const found = libraryByName.get(String(exerciseName || '').toLowerCase());
    setDetail(found || { name: exerciseName, muscleGroup: 'Strength', equipment: '', instructions: [], imageUrls: [] });
  }

  const activeMuscles = MUSCLE_TABS.find(t => t.key === muscleTab)?.muscles;
  const queryLower = query.trim().toLowerCase();
  const filteredLibrary = library
    .filter(ex => {
      if (activeMuscles && !activeMuscles.includes(ex.muscleGroup)) return false;
      if (equipTab !== 'All' && String(ex.equipment || '').toLowerCase() !== equipTab) return false;
      if (!queryLower) return true;
      return `${ex.name} ${ex.muscleGroup} ${ex.equipment} ${(ex.primaryMuscles || []).join(' ')}`.toLowerCase().includes(queryLower);
    })
    .filter((ex, i, arr) => arr.findIndex(x => shortName(x.name).toLowerCase() === shortName(ex.name).toLowerCase()) === i)
    .slice(0, 80);

  const totalVolume = sessions.reduce((sum, s) => sum + volumeOf(s.sets), 0);
  const totalSets = sessions.reduce((sum, s) => sum + (s.sets?.length || 0), 0);

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Spinner size={36} /></div>;

  const loggedFor = (exerciseName) => completedSetKeys.filter(k => k.split(':')[1] === exerciseName).length;

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Dumbbell size={22} className="text-teal" /> Workout</h1>
        {activeSession && <Badge color="teal">LIVE</Badge>}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[['today', 'Today'], ['exercises', 'Exercises'], ['history', 'History']].map(([key, label]) => (
          <Chip key={key} label={label} active={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {tab === 'today' && (
        <>
          {restTimer !== null && <RestTimer seconds={restTimer} onDone={() => setRestTimer(null)} />}

          {activeSession ? (
            <GlassCard accent="teal">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Badge color="teal">LIVE SESSION</Badge>
                  <h3 className="text-white font-bold mt-1">{activeSession.split}</h3>
                  <p className="text-muted text-[11px]">{activeSession.exercises?.length || 0} exercises · {activeSession.exercises?.reduce((n, e) => n + e.sets, 0) || 0} sets planned</p>
                </div>
                <TealButton onClick={finishSession} className="text-xs py-1.5 px-3">Finish</TealButton>
              </div>

              {activeSession.exercises?.map((ex, ei) => {
                const done = loggedFor(ex.name);
                return (
                  <div key={`${ex.name}-${ei}`} className="mb-4 pb-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <ExerciseDemo name={ex.name} exerciseId={ex.id} images={ex.images} size={46} />
                      <button onClick={() => openDetailFor(ex.name)} className="flex-1 min-w-0 text-left">
                        <p className="text-white text-sm font-semibold truncate">
                          <span className="text-muted text-[10px] mr-1">#{ei + 1}</span>{ex.name}
                        </p>
                        <p className="text-muted text-[11px]">{ex.sets} sets × {ex.reps} reps · {ex.rest}s rest · {done}/{ex.sets} done</p>
                      </button>
                      <button onClick={() => removeExercise(ei)} aria-label={`Remove ${ex.name}`} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <X size={12} className="text-muted" />
                      </button>
                    </div>

                    {Array.isArray(ex.previous) && ex.previous.length > 0 && (
                      <p className="text-muted text-[10px] mb-1">
                        Last time: {ex.previous.slice(0, 3).map(r => `${r.weightKg}kg×${r.reps}`).join(' · ')}
                      </p>
                    )}

                    {Array.from({ length: ex.sets }, (_, si) => (
                      <SetRow
                        key={si}
                        set={{ setNumber: si + 1, weightKg: si === 0 ? ex.defaultWeight : ex.defaultWeight, reps: si === 0 ? ex.defaultReps : ex.reps, restSeconds: ex.rest }}
                        onChange={() => {}}
                        disabled={savingSet || completedSetKeys.includes(`${activeSession.id}:${ex.name}:${si + 1}`)}
                        done={completedSetKeys.includes(`${activeSession.id}:${ex.name}:${si + 1}`)}
                        onDone={(s) => logSet(activeSession.id, { ...s, exerciseName: ex.name, restSeconds: ex.rest })}
                      />
                    ))}
                    <div className="flex gap-2 mt-1.5">
                      <GhostButton onClick={() => addSetSlot(ei)} className="text-[11px] py-1 px-2">+ set</GhostButton>
                      <GhostButton onClick={() => openDetailFor(ex.name)} className="text-[11px] py-1 px-2">How to do it</GhostButton>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2 mt-2">
                <TealButton onClick={() => setTab('exercises')} className="flex-1 text-xs py-2 flex items-center justify-center gap-1">
                  <Search size={13} /> Browse exercises
                </TealButton>
                <GhostButton onClick={() => setAddOpen(o => !o)} className="text-xs py-2 px-3">Custom</GhostButton>
              </div>

              {addOpen && (
                <div className="mt-2 p-3 rounded-xl border border-dashed border-teal/30 space-y-2">
                  <p className="text-white text-xs font-semibold">Add your own exercise</p>
                  <input
                    autoFocus
                    value={draft.name}
                    onChange={e => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Triceps Pushdown, Machine Chest Press"
                    className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  {draftMatches.length > 0 && (
                    <div className="space-y-1">
                      {draftMatches.map(m => (
                        <button
                          key={m.id}
                          onClick={() => { addExercise({ name: m.name, images: m.imageUrls, sets: draft.sets, reps: draft.reps, rest: draft.rest }); setDraft({ ...draft, name: '' }); setAddOpen(false); }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/5 active:scale-[0.99] text-left"
                        >
                          <ExerciseDemo name={m.name} images={m.imageUrls} size={34} />
                          <span className="text-white text-xs flex-1 truncate">{shortName(m.name)}</span>
                          <span className="text-muted text-[10px] shrink-0">{m.muscleGroup}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {[['sets', 'Sets'], ['reps', 'Reps'], ['rest', 'Rest (s)']].map(([key, label]) => (
                      <label key={key} className="flex-1">
                        <span className="text-muted text-[10px] uppercase tracking-wide">{label}</span>
                        <input
                          type="number"
                          min="1"
                          value={draft[key]}
                          onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                          className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-white text-sm text-center outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <TealButton onClick={submitDraft} className="flex-1 text-xs py-2">Add exercise</TealButton>
                    <GhostButton onClick={() => setAddOpen(false)} className="text-xs py-2 px-3">Cancel</GhostButton>
                  </div>
                </div>
              )}

              {savedExercises.length > 0 && (
                <div className="mt-3">
                  <p className="text-muted text-[10px] uppercase tracking-wide mb-1">My exercises</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedExercises.map(ex => (
                      <button key={ex.name} onClick={() => addExercise(ex)} className="px-2 py-1 rounded-lg bg-teal/10 border border-teal/20 text-teal text-[11px]">
                        + {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          ) : (
            <>
              <GlassCard>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Play size={16} className="text-teal" /> Start a strength session</h3>
                <div className="flex flex-wrap gap-2">
                  {SPLITS.map(s => (
                    <button
                      key={s}
                      onClick={() => startSession(s)}
                      disabled={creating}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all border border-teal/20 bg-teal/5 text-teal hover:bg-teal/10 active:scale-95 disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-muted text-[11px] mt-3">Session start karke exercise add kar — sets, kg aur reps yahin log honge.</p>
              </GlassCard>

              <div className="grid grid-cols-3 gap-2">
                <GlassCard className="text-center">
                  <p className="text-teal tab-num text-lg font-bold">{sessions.length}</p>
                  <p className="text-muted text-[10px]">Sessions</p>
                </GlassCard>
                <GlassCard className="text-center">
                  <p className="text-teal tab-num text-lg font-bold">{totalSets}</p>
                  <p className="text-muted text-[10px]">Sets logged</p>
                </GlassCard>
                <GlassCard className="text-center">
                  <p className="text-teal tab-num text-lg font-bold">{Math.round(totalVolume).toLocaleString()}</p>
                  <p className="text-muted text-[10px]">Volume kg</p>
                </GlassCard>
              </div>

              {library.length > 0 && (
                <GlassCard>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Flame size={15} className="text-teal" /> Pick a body part</h3>
                  <div className="flex flex-wrap gap-2">
                    {MUSCLE_TABS.filter(t => t.key !== 'All').map(t => (
                      <button
                        key={t.key}
                        onClick={() => { setMuscleTab(t.key); setTab('exercises'); }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 text-white/80 active:scale-95"
                      >
                        {t.key}
                      </button>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </>
      )}

      {tab === 'exercises' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {MUSCLE_TABS.map(t => (
              <Chip key={t.key} label={t.key} active={muscleTab === t.key} onClick={() => setMuscleTab(t.key)} />
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['All', 'machine', 'cable', 'barbell', 'dumbbell', 'bodyweight'].map(eq => (
              <Chip key={eq} label={eq === 'All' ? 'Any equipment' : eq} active={equipTab === eq} onClick={() => setEquipTab(eq)} />
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search machine or exercise (e.g. chest press)"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <p className="text-muted text-[11px]">{filteredLibrary.length} exercises{activeMuscles ? ` · ${muscleTab}` : ''}{activeSession ? ' · tap + to add' : ''}</p>

          {filteredLibrary.map(ex => (
            <button key={ex.id} onClick={() => setDetail(ex)} className="w-full text-left">
              <GlassCard>
                <div className="flex items-center gap-3">
                  <ExerciseDemo name={ex.name} images={ex.imageUrls} size={46} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{shortName(ex.name)}</p>
                    <p className="text-muted text-[11px]">{ex.muscleGroup} · {ex.equipment || 'bodyweight'}</p>
                  </div>
                  {activeSession ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); addExercise({ name: ex.name, images: ex.imageUrls }); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); addExercise({ name: ex.name, images: ex.imageUrls }); } }}
                      aria-label={`Add ${shortName(ex.name)} to session`}
                      className="w-7 h-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center"
                    >
                      <Plus size={12} className="text-teal" />
                    </span>
                  ) : (
                    <ChevronDown size={14} className="text-muted -rotate-90" />
                  )}
                </div>
              </GlassCard>
            </button>
          ))}

          {filteredLibrary.length === 0 && (
            <p className="text-muted text-xs text-center py-6">No exercise found for "{query}". Try another body part or spelling.</p>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <History size={36} className="mx-auto mb-3 opacity-30" />
              <ContentEmptyState section="workout" onAction={() => setTab('today')} />
            </div>
          ) : sessions.map((s) => {
            const grouped = groupSetsByExercise(s.sets);
            const open = openSession === s.id;
            return (
              <GlassCard key={s.id}>
                <button onClick={() => setOpenSession(open ? null : s.id)} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge color="muted">{String(s.sessionDate || '').slice(0, 10)}</Badge>
                      <h4 className="text-white font-semibold mt-1">{s.name}</h4>
                      <p className="text-muted text-[11px] mt-0.5">
                        {s.sets?.length || 0} sets · {Math.round(volumeOf(s.sets)).toLocaleString()} kg volume · {grouped.length} exercises
                      </p>
                    </div>
                    {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </button>

                {open && (
                  <div className="mt-3 space-y-2">
                    {grouped.length === 0 && <p className="text-muted text-xs">No sets were logged in this session.</p>}
                    {grouped.map(g => (
                      <div key={g.name} className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start gap-2 mb-1">
                          <ExerciseDemo name={g.name} images={[]} size={34} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{g.name}</p>
                            <p className="text-muted text-[10px]">
                              {g.sets.length} sets · best {Math.max(...g.sets.map(x => Number(x.weightKg || 0)))} kg · {Math.round(volumeOf(g.sets))} kg vol
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {g.sets.slice().sort((a, b) => a.setNumber - b.setNumber).map((row, i) => (
                            <span key={`${row.setNumber}-${i}`} className="px-1.5 py-0.5 rounded-md bg-black/30 border border-white/10 text-white/80 text-[10px]">
                              {row.weightKg}kg × {row.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            );
          })}

          {sessions.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <GlassCard className="text-center">
                <p className="text-teal tab-num text-lg font-bold">{sessions.length}</p>
                <p className="text-muted text-[10px]">Sessions</p>
              </GlassCard>
              <GlassCard className="text-center">
                <p className="text-teal tab-num text-lg font-bold">{totalSets}</p>
                <p className="text-muted text-[10px]">Sets</p>
              </GlassCard>
              <GlassCard className="text-center">
                <p className="text-teal tab-num text-lg font-bold flex items-center justify-center gap-1"><TrendingUp size={12} />{Math.round(totalVolume).toLocaleString()}</p>
                <p className="text-muted text-[10px]">Volume kg</p>
              </GlassCard>
            </div>
          )}
        </div>
      )}

      {detail && (
        <ExerciseDetail
          exercise={detail}
          onClose={() => setDetail(null)}
          canAdd={Boolean(activeSession)}
          onAdd={(ex) => addExercise({ name: ex.name, images: ex.imageUrls })}
          onStartSession={(ex) => startSession(ex.muscleGroup && MUSCLE_TABS.some(t => t.key === ex.muscleGroup) ? ex.muscleGroup : 'Full Body', ex)}
        />
      )}
    </div>
  );
}

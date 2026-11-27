import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  Dumbbell, Plus, Play, Check, X, ChevronDown, ChevronUp, History, Search,
  Flame, TrendingUp, Trash2, Star, Pencil,
} from 'lucide-react';
import { api } from '../../shared/api.js';
import { GlassCard, TealButton, GhostButton, Spinner, ErrorMsg, Badge, Chip, ContentEmptyState } from '../../shared/ui.jsx';
import { curatedGifUrl, loadGifIndex, matchGif } from './exerciseMedia.js';
import { BODY_PARTS, PART_MUSCLES, PART_LABELS, bodyPartOf, cuesFor, formatDuration, matchesExercise, normalizeTerm } from './workoutCopy.js';
import { INDIAN_GYM_MACHINES } from './indianGymMachines.js';
import { GYM_EXERCISES } from './gymExerciseSwapDb.js';
import { scheduleRestTimerCompletion } from '../../shared/restTimerNotification.js';
import { useAuth } from '../../shared/AuthContext.jsx';

const SPLITS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Arms', 'Chest & Tri', 'Back & Bi', 'Home Gym'];

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

// Machines carry a body part ("Legs"), library items a muscle group ("Calves").
const SPLIT_FOR_PART = {
  Chest: 'Push', Shoulders: 'Push', Triceps: 'Push',
  Back: 'Pull', Biceps: 'Pull', Legs: 'Legs', Core: 'Full Body', Other: 'Full Body',
};

// Adding a single exercise without a running session starts the matching split.
const SPLIT_FOR_MUSCLE = {
  Chest: 'Push', Shoulders: 'Push', Triceps: 'Push',
  Lats: 'Pull', 'Middle Back': 'Pull', 'Lower Back': 'Pull', Traps: 'Pull', Biceps: 'Pull',
  Quadriceps: 'Legs', Hamstrings: 'Legs', Glutes: 'Legs', Calves: 'Legs',
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
  const [setType, setSetType] = useState(set.setType || 'WORKING');
  const [rpe, setRpe] = useState('');
  const [duration, setDuration] = useState('');
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
      <select value={setType} disabled={disabled} onChange={e=>setSetType(e.target.value)} aria-label="Set type" className="w-20 px-1 py-1.5 rounded-lg text-white text-[10px] outline-none" style={{background:'#101827',border:'1px solid rgba(255,255,255,0.1)'}}>
        <option value="WORKING">Work</option><option value="WARMUP">Warm-up</option><option value="DROP">Drop</option><option value="SUPERSET">Superset</option>
      </select>
      <input type="number" min="0" max="10" step="0.5" value={rpe} onChange={e=>setRpe(e.target.value)} placeholder="RPE" aria-label="RPE" disabled={disabled} className="w-12 px-1 py-1.5 rounded-lg text-white text-[10px] text-center outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
      <input type="number" min="0" max="3600" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="sec" aria-label="Duration seconds" disabled={disabled} className="w-12 px-1 py-1.5 rounded-lg text-white text-[10px] text-center outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
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
        onClick={() => onDone({ ...set, setType, rpe: rpe ? Number(rpe) : null, durationSeconds: duration ? Number(duration) : null, weightKg: parseFloat(weight) || 0, reps: parseInt(reps, 10) || 0 })}
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
  // Indian machine entries apna exact GIF laate hain — use fuzzy match se pehle wahi chalao.
  const explicitGif = Array.isArray(images) && images[0] && /\.gif(\?|$)/i.test(images[0]) ? images[0] : '';
  const still = Array.isArray(images) && images.length ? images[0] : '';
  const curated = exerciseId ? curatedGifUrl(exerciseId) : '';
  const direct = curated || explicitGif;
  const [gif, setGif] = useState(direct);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let alive = true;
    setGif(direct);
    setStage(0);
    if (!direct && name) {
      loadGifIndex().then(index => { if (alive) setGif(matchGif(index, shortName(name))); });
    }
    return () => { alive = false; };
  }, [direct, name]);

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
function ExerciseDetail({ exercise, onClose, onAdd, canAdd, onStartSession, history = [] }) {
  const [last, setLast] = useState(null);
  const name = shortName(exercise.name);

  useEffect(() => {
    let alive = true;
    setLast(null);
    api(`/workouts/last-session/sets?exerciseName=${encodeURIComponent(name)}${exercise.equipment ? `&equipment=${encodeURIComponent(exercise.equipment)}` : ''}`)
      .then(rows => { if (alive) setLast(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (alive) setLast([]); });
    return () => { alive = false; };
  }, [name]);

  const steps = (exercise.instructions && exercise.instructions.length ? exercise.instructions : [exercise.setup, exercise.brace, exercise.execution])
    .filter(Boolean)
    .slice(0, 6);
  const muscles = [...(exercise.primaryMuscles || []), ...(exercise.secondaryMuscles || [])].slice(0, 6);
  const trend = history.slice().reverse().filter(h=>Number(h.bestWeight)>0);
  const trendMax = Math.max(1,...trend.map(h=>Number(h.bestWeight)));
  const trendPoints = trend.map((h,i)=>`${trend.length<2?90:i*(180/(trend.length-1))},${44-(Number(h.bestWeight)/trendMax)*38}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="w-full max-w-md max-h-[88vh] flex flex-col rounded-t-3xl border-t border-teal/25 animate-fade-in"
        style={{ background: '#0b1220' }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => { if (canAdd) onAdd(exercise); else onStartSession(exercise); onClose(); }}
              aria-label={`Add ${name} to workout`}
              className="w-7 h-7 rounded-full bg-teal/15 border border-teal/40 flex items-center justify-center"
            >
              <Plus size={14} className="text-teal" />
            </button>
            <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <X size={13} className="text-muted" />
            </button>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-teal/5 border border-teal/20">
          <p className="text-teal text-[10px] font-semibold uppercase tracking-wide mb-1">Hinglish me kaise karein</p>
          <ul className="space-y-0.5">
            {cuesFor(exercise.muscleGroup).map((cue, i) => (
              <li key={i} className="text-white/80 text-[11px] leading-relaxed">• {cue}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-teal text-xs font-semibold uppercase tracking-wide mb-1">How to do it <span className="normal-case font-normal text-muted text-[10px]">· Steps</span></p>
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

        {history.length > 0 && (
          <div>
            <p className="text-teal text-xs font-semibold uppercase tracking-wide mb-1">History</p>
            {trend.length>1 && <svg viewBox="0 0 180 50" role="img" aria-label="Logged best weight progression" className="w-full h-14 mb-1"><polyline points={trendPoints} fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />{trend.map((h,i)=><circle key={`${h.date}-${i}`} cx={trend.length<2?90:i*(180/(trend.length-1))} cy={44-(Number(h.bestWeight)/trendMax)*38} r="2.5" fill="#fbbf24" />)}</svg>}
            <div className="space-y-0.5">
              {history.slice(0, 4).map((h, i) => (
                <p key={i} className="text-white/80 text-xs">
                  {String(h.date || '').slice(0, 10)} · best {h.bestWeight} kg × {h.bestReps} · {h.sets} sets · {h.volume} kg
                </p>
              ))}
            </div>
          </div>
        )}

        </div>

        {/* Sticky action: always visible, even when the instructions are long */}
        <div className="p-3 border-t border-white/10" style={{ background: '#0b1220' }}>
          {canAdd ? (
            <TealButton onClick={() => { onAdd(exercise); onClose(); }} className="w-full text-sm py-2.5">+ Add to today's session</TealButton>
          ) : (
            <TealButton onClick={() => { onStartSession(exercise); onClose(); }} className="w-full text-sm py-2.5">+ Start a session with this</TealButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkoutPage() {
  const { user } = useAuth() ?? {};
  const userKey = user?.id || user?.email || 'default';
  const customKey = `dp_custom_exercises_${userKey}`;
  const favoriteKey = `dp_favorite_exercises_${userKey}`;
  const recentKey = `dp_recent_exercises_${userKey}`;

  const [sessions, setSessions] = useState([]);
  const [library, setLibrary] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('today'); // today | exercises | history
  const [muscleTab, setMuscleTab] = useState('Chest');
  const [selectedSubMuscle, setSelectedSubMuscle] = useState('');
  const [query, setQuery] = useState('');
  const [equipTab, setEquipTab] = useState('All');
  const [machineMode, setMachineMode] = useState(false);
  const [openHistoryPart, setOpenHistoryPart] = useState('');
  const [detail, setDetail] = useState(null);

  const [activeSession, setActiveSession] = useState(null);
  const [completedSetKeys, setCompletedSetKeys] = useState([]);
  const [restTimer, setRestTimer] = useState(null);
  const [savingSet, setSavingSet] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openSession, setOpenSession] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', muscle: 'Chest', customMuscleGroup: '', subMuscle: '', equipment: '', trackingType: 'WEIGHT_REPS', sets: 3, reps: 8, rest: 90 });
  const [savedExercises, setSavedExercises] = useState([]);
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [savedRoutines, setSavedRoutines] = useState([]);
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [browseSectionId, setBrowseSectionId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [historyRange, setHistoryRange] = useState('ALL');
  const [historyEquipment, setHistoryEquipment] = useState('');
  const [historyMuscle, setHistoryMuscle] = useState('');
  const [historySubMuscle, setHistorySubMuscle] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [loggedSets, setLoggedSets] = useState({});
  const [summary, setSummary] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [now, setNow] = useState(Date.now());
  const activeKey = `dp_active_session_${userKey}`;

  const loadControllerRef = useRef(null);
  const swapControllerRef = useRef(null);
  const inFlightSetKeysRef = useRef(new Set());
  const lastSetsCacheRef = useRef(new Map());

  const load = useCallback(async () => {
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    setLoading(true);
    try {
      const [sess, lib, custom, routine, pr, sectionResult] = await Promise.allSettled([
        api('/workouts', { signal: controller.signal }),
        api('/workouts/library', { signal: controller.signal }),
        api('/workouts/custom-exercises', { signal: controller.signal }),
        api('/workouts/routines', { signal: controller.signal }),
        api('/workouts/records', { signal: controller.signal }),
        api('/workouts/sections', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (sess.status === 'fulfilled') setSessions(Array.isArray(sess.value) ? sess.value : []);
      if (lib.status === 'fulfilled') setLibrary(Array.isArray(lib.value) ? lib.value : []);
      if (custom.status === 'fulfilled') setSavedExercises((Array.isArray(custom.value) ? custom.value : []).map(e => ({ ...e, muscle: e.muscleGroup || 'Other', sets: 3, reps: 8, rest: 90 })));
      if (routine.status === 'fulfilled') setSavedRoutines(Array.isArray(routine.value) ? routine.value : []);
      if (pr.status === 'fulfilled') setRecords(Array.isArray(pr.value) ? pr.value : []);
      if (sectionResult.status === 'fulfilled') setSections(Array.isArray(sectionResult.value) ? sectionResult.value : []);
      const failure = [sess, lib].find(r => r.status === 'rejected');
      if (failure) setError(failure.reason?.message || 'Could not load workout data');
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => { loadControllerRef.current?.abort(); swapControllerRef.current?.abort(); }; }, [load]);

  async function addSection() {
    const name = newSectionName.trim(); if (!name) return;
    try { const created=await api('/workouts/sections',{method:'POST',body:{name}}); setSections(prev=>[...prev,created]); setNewSectionName(''); }
    catch(e){setError(e.message);}
  }
  async function renameSection(id) {
    const name=renameValue.trim(); if(!name)return;
    try { const updated=await api(`/workouts/sections/${id}`,{method:'PUT',body:{name}}); setSections(prev=>prev.map(s=>s.id===id?updated:s)); setRenamingId(null); }
    catch(e){setError(e.message);}
  }
  async function deleteSection(id) {
    try { await api(`/workouts/sections/${id}`,{method:'DELETE'}); setSections(prev=>prev.filter(s=>s.id!==id)); if(browseSectionId===id)setBrowseSectionId(null); }
    catch(e){setError(e.message);}
  }
  async function addExerciseToSection(section, exercise) {
    try { const updated=await api(`/workouts/sections/${section.id}/exercises`,{method:'POST',body:{exerciseName:exercise.name,equipment:exercise.equipment||'',muscleGroup:exercise.muscleGroup||section.name}}); setSections(prev=>prev.map(s=>s.id===section.id?updated:s)); }
    catch(e){setError(e.message);}
  }
  async function removeExerciseFromSection(section, exerciseId) {
    try { const updated=await api(`/workouts/sections/${section.id}/exercises/${exerciseId}`,{method:'DELETE'}); setSections(prev=>prev.map(s=>s.id===section.id?updated:s)); }
    catch(e){setError(e.message);}
  }
  function browseExercises(section) {
    const key=section.name.trim().toLowerCase();
    const matches=muscle=>{const value=String(muscle||'').toLowerCase();return value.includes(key)||key.includes(value);};
    const all=[...library,...GYM_EXERCISES,...INDIAN_GYM_MACHINES];
    const seen=new Set();
    return all.filter(ex=>matches(ex.muscleGroup||ex.muscle)||(ex.primaryMuscles||[]).some(matches)).filter(ex=>{const name=String(ex.name||'').toLowerCase();if(!name||seen.has(name))return false;seen.add(name);return true;});
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(customKey);
      const parsed = raw ? JSON.parse(raw) : [];
      // Older entries had no body part; keep them and file them under Other.
      setSavedExercises((Array.isArray(parsed) ? parsed : []).map(e => ({ ...e, muscle: e.muscle || 'Other' })));
    } catch {
      setSavedExercises([]);
    }
  }, [customKey]);
  useEffect(() => {
    try { setFavoriteExercises(JSON.parse(localStorage.getItem(favoriteKey) || '[]')); } catch { setFavoriteExercises([]); }
    try { setRecentExercises(JSON.parse(localStorage.getItem(recentKey) || '[]')); } catch { setRecentExercises([]); }
  }, [favoriteKey, recentKey]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // The running session survives reloads and bottom-nav switches.
  // Restore once per account, and never delete storage from an effect (a not-yet
  // restored state must not wipe a session that is still on disk).
  const restoredKeyRef = useRef('');
  useEffect(() => {
    if (restoredKeyRef.current === activeKey) return;
    restoredKeyRef.current = activeKey;
    try {
      const raw = localStorage.getItem(activeKey);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored?.session?.id) {
          setActiveSession(stored.session);
          setCompletedSetKeys(Array.isArray(stored.completed) ? stored.completed : []);
          setLoggedSets(stored.logged && typeof stored.logged === 'object' ? stored.logged : {});
        }
      }
    } catch { /* start clean */ }
    setHydrated(true);
  }, [activeKey]);

  useEffect(() => {
    if (!hydrated || !activeSession) return;
    try {
      localStorage.setItem(activeKey, JSON.stringify({ session: activeSession, completed: completedSetKeys, logged: loggedSets }));
    } catch { /* storage blocked: keep running in memory */ }
  }, [activeSession, completedSetKeys, loggedSets, hydrated, activeKey]);

  async function lastSetsFor(name, equipment = '') {
    const key = `${String(name || '').toLowerCase()}::${String(equipment || '').toLowerCase()}`;
    if (lastSetsCacheRef.current.has(key)) return lastSetsCacheRef.current.get(key);
    try {
      const rows = await api(`/workouts/last-session/sets?exerciseName=${encodeURIComponent(name)}${equipment ? `&equipment=${encodeURIComponent(equipment)}` : ''}`);
      const safe = Array.isArray(rows) ? rows : [];
      lastSetsCacheRef.current.set(key, safe);
      return safe;
    } catch {
      lastSetsCacheRef.current.set(key, []);
      return [];
    }
  }

  async function rememberExercise(entry) {
    const muscle = entry.muscle || bodyPartOf(entry.muscleGroup);
    setSavedExercises(prev => {
      const next = [{ ...entry, muscle }, ...prev.filter(x => !(x.name.toLowerCase() === entry.name.toLowerCase() && (x.muscle || 'Other') === muscle))].slice(0, 120);
      try { localStorage.setItem(customKey, JSON.stringify(next)); } catch { /* keep in memory only */ }
      return next;
    });
    try {
      const saved = await api('/workouts/custom-exercises', { method: 'POST', body: {
        name: entry.name, muscleGroup: entry.muscleGroup || muscle, subMuscle: entry.subMuscle || null,
        equipment: entry.equipment || null, primaryMuscles: entry.primaryMuscles || [], secondaryMuscles: entry.secondaryMuscles || [],
        trackingType: entry.trackingType || 'WEIGHT_REPS', notes: entry.notes || null,
      } });
      setSavedExercises(prev => [{ ...entry, ...saved, muscle: saved.muscleGroup || muscle, sets: entry.sets || 3, reps: entry.reps || 8, rest: entry.rest || 90 }, ...prev.filter(x => x.id !== saved.id && x.name.toLowerCase() !== saved.name.toLowerCase())]);
    } catch (e) { setError(`Exercise is saved on this device; cloud sync failed: ${e.message}`); }
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
    const previous = await lastSetsFor(name, def.equipment || '');
    const top = previous.reduce((best, row) => (Number(row.weightKg || 0) >= Number(best?.weightKg || 0) ? row : best), null);
    const muscle = def.muscle || bodyPartOf(def.muscleGroup);
    const entry = {
      id: def.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      muscle,
      muscleGroup: def.muscleGroup || def.subMuscle || muscle,
      subMuscle: def.subMuscle || def.muscleGroup || muscle,
      equipment: def.equipment || '',
      trackingType: def.trackingType || 'WEIGHT_REPS',
      sets: targetSets,
      reps: targetReps,
      rest: clampInt(def.rest ?? def.restSeconds, 90, 0, 600),
      defaultWeight: Number(top?.weightKg || 0),
      defaultReps: Number(top?.reps || targetReps),
      images: Array.isArray(def.images) ? def.images : [],
      previous,
    };
    setRecentExercises(prev => { const next=[{name, muscleGroup:def.muscleGroup || muscle, equipment:def.equipment || '', imageUrls:def.imageUrls || def.images || []},...prev.filter(x=>x.name.toLowerCase()!==name.toLowerCase())].slice(0,8); try{localStorage.setItem(recentKey,JSON.stringify(next));}catch{} return next; });
    setActiveSession(s => ({ ...s, exercises: [...(s.exercises || []), entry] }));
    // Permanent vs temporary is the user's call, not an automatic save.
    const alreadySaved = savedExercises.some(x => x.name.toLowerCase() === name.toLowerCase() && (x.muscle || 'Other') === muscle);
    if (!alreadySaved) setPendingSave({ ...entry });
  }

  function toggleFavorite(exercise) {
    const name = typeof exercise === 'string' ? exercise : exercise.name;
    setFavoriteExercises(prev => { const next=prev.some(x=>x.toLowerCase()===name.toLowerCase())?prev.filter(x=>x.toLowerCase()!==name.toLowerCase()):[name,...prev]; try{localStorage.setItem(favoriteKey,JSON.stringify(next));}catch{} return next; });
  }

  function removeExercise(index) {
    setActiveSession(s => ({ ...s, exercises: (s.exercises || []).filter((_, i) => i !== index) }));
  }
  function moveExercise(index, direction) {
    setActiveSession(s => { const items = [...(s.exercises || [])]; const target = index + direction; if (target < 0 || target >= items.length) return s; [items[index], items[target]] = [items[target], items[index]]; return { ...s, exercises: items }; });
  }

  function addSetSlot(index) {
    setActiveSession(s => ({
      ...s,
      exercises: (s.exercises || []).map((ex, i) => (i === index ? { ...ex, sets: Math.min(20, ex.sets + 1) } : ex)),
    }));
  }

  function removeSetSlot(index) {
    setActiveSession(s => ({
      ...s,
      exercises: (s.exercises || []).map((ex, i) => (i === index ? { ...ex, sets: Math.max(1, ex.sets - 1) } : ex)),
    }));
  }

  // One tap from any exercise card: add to the running session, or start one.
  function quickAdd(exercise) {
    const muscle = exercise.muscle || bodyPartOf(exercise.muscleGroup);
    if (activeSession) {
      addExercise({ ...exercise, name: exercise.name, images: exercise.imageUrls || exercise.images, muscle });
      return;
    }
    const split = SPLIT_FOR_MUSCLE[exercise.muscleGroup] || SPLIT_FOR_PART[muscle] || 'Full Body';
    startSession(split, { ...exercise, muscle });
  }

  // "Back maru to saved Back exercises aayein" — start the body part directly.
  async function startBodyPart(part) {
    const saved = savedExercises.filter(e => (e.muscle || 'Other') === part);
    const starters = saved.length
      ? saved.map(e => ({ ...e, muscle: part }))
      : library.filter(ex => PART_MUSCLES[part]?.includes(ex.muscleGroup)).slice(0, 4);
    await startSession(`${part} Day`, starters);
  }

  async function deleteSavedExercise(exercise) {
    const name = typeof exercise === 'string' ? exercise : exercise.name;
    setSavedExercises(prev => {
      const next = prev.filter(x => x.name.toLowerCase() !== String(name).toLowerCase());
      try { localStorage.setItem(customKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    if (exercise?.id) {
      try { await api(`/workouts/custom-exercises/${exercise.id}`, { method: 'DELETE' }); }
      catch (e) { setError(`Could not delete saved exercise: ${e.message}`); }
    }
  }

  async function startSession(split, starterExercise = null) {
    setCreating(true);
    try {
      const sessionDate = new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 19);
      const session = await api('/workouts', { method: 'POST', body: { name: split, sessionDate } });
      const allowed = SPLIT_MUSCLES[split];
      const starters = Array.isArray(starterExercise)
        ? starterExercise
        : starterExercise
          ? [starterExercise]
          : library
            .filter(ex => split === 'Home Gym'
              ? /bodyweight|resistance band/i.test(ex.equipment || '')
              : (!allowed || allowed === 'All' || (Array.isArray(allowed) && allowed.includes(ex.muscleGroup))))
            .slice(0, 4);
      const exercises = await Promise.all(starters.map(async ex => {
        const name = shortName(ex.name);
        const muscle = ex.muscle && BODY_PARTS.includes(ex.muscle) ? ex.muscle : bodyPartOf(ex.muscleGroup);
        const previous = await lastSetsFor(name, ex.equipment || '');
        const top = previous.reduce((best, row) => (Number(row.weightKg || 0) >= Number(best?.weightKg || 0) ? row : best), null);
        return {
          id: String(ex.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          muscle,
          muscleGroup: ex.muscleGroup || ex.subMuscle || muscle,
          subMuscle: ex.subMuscle || (ex.primaryMuscles || [])[0] || ex.muscleGroup || muscle,
          equipment: ex.equipment || '',
          trackingType: ex.trackingType || 'WEIGHT_REPS',
          sets: clampInt(ex.sets, 3, 1, 20),
          reps: clampInt(ex.reps, 8, 1, 100),
          rest: clampInt(ex.rest ?? ex.restSeconds, 90, 0, 600),
          defaultWeight: Number(top?.weightKg || 0),
          defaultReps: Number(top?.reps || 8),
          images: Array.isArray(ex.imageUrls) ? ex.imageUrls : [],
          previous,
        };
      }));
      setActiveSession({ ...session, split: session.name || split, startedAt: Date.now(), exercises });
      setCompletedSetKeys([]);
      setLoggedSets({});
      setSummary(null);
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
        muscle: ex.muscle || bodyPartOf(ex.muscleGroup),
        muscleGroup: ex.muscleGroup || ex.subMuscle || ex.muscle,
        subMuscle: ex.subMuscle || ex.muscleGroup || ex.muscle,
        equipment: ex.equipment || '',
        trackingType: ex.trackingType || 'WEIGHT_REPS',
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
      const sessionDate = new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 19);
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
        previousWeightKg: setData.previousWeightKg ?? null,
        restSeconds: setData.restSeconds,
        muscleGroup: setData.muscleGroup || '',
        subMuscle: setData.subMuscle || '',
        equipment: setData.equipment || '',
        setType: setData.setType || 'WORKING',
        trackingType: setData.trackingType || (Number(setData.weightKg) > 0 ? 'WEIGHT_REPS' : 'BODYWEIGHT_REPS'),
        weightMode: setData.weightMode || 'TOTAL',
        durationSeconds: setData.durationSeconds || null,
        rpe: setData.rpe || null,
        rir: setData.rir ?? null,
        notes: setData.notes || null,
        completed: true,
      } });
      // Keep the history tab in sync without re-fetching the whole list.
      if (saved && saved.exerciseName) {
        setSessions(prev => prev.map(s => s.id === workoutId
          ? { ...s, sets: [...(s.sets || []).filter(x => !(x.exerciseName === saved.exerciseName && x.setNumber === saved.setNumber)), saved] }
          : s));
      }
      setCompletedSetKeys(keys => keys.includes(key) ? keys : [...keys, key]);
      setLoggedSets(prev => ({ ...prev, [`${setData.exerciseName}:${setData.setNumber}`]: { weightKg: setData.weightKg, reps: setData.reps } }));
      const cacheKey = `${setData.exerciseName.toLowerCase()}::`;
      for (const cacheEntry of lastSetsCacheRef.current.keys()) if (cacheEntry.startsWith(cacheKey)) lastSetsCacheRef.current.delete(cacheEntry);
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
    const entries = Object.values(loggedSets);
    const volume = entries.reduce((sum, e) => sum + Number(e.weightKg || 0) * Number(e.reps || 0), 0);
    const best = entries.reduce((top, e) => (Number(e.weightKg || 0) >= Number(top?.weightKg || 0) ? e : top), null);
    setSummary({
      name: activeSession?.split || 'Session',
      sets: entries.length,
      volume: Math.round(volume),
      best,
      exercises: activeSession?.exercises?.length || 0,
    });
    setActiveSession(null);
    setCompletedSetKeys([]);
    setLoggedSets({});
    setRestTimer(null);
    try { localStorage.removeItem(activeKey); } catch { /* ignore */ }
    load();
  }

  function submitDraft() {
    const name = draft.name.trim();
    if (!name) {
      setError('Exercise ka naam likho · Enter an exercise name');
      return;
    }
    const muscle = draft.muscle || 'Other';
    if (activeSession) {
      addExercise({ ...draft, name, muscle, muscleGroup: draft.customMuscleGroup || muscle });
    } else {
      // No session running: the only choice is to save it for later.
      rememberExercise({
        name,
        muscle,
        muscleGroup: draft.customMuscleGroup || muscle,
        subMuscle: draft.subMuscle || '',
        equipment: draft.equipment || '',
        trackingType: draft.trackingType || 'WEIGHT_REPS',
        sets: clampInt(draft.sets, 3, 1, 20),
        reps: clampInt(draft.reps, 8, 1, 100),
        rest: clampInt(draft.rest, 90, 0, 600),
      });
    }
    setDraft({ name: '', muscle: draft.muscle, customMuscleGroup: draft.customMuscleGroup, subMuscle: draft.subMuscle, equipment: draft.equipment, trackingType: draft.trackingType, sets: draft.sets, reps: draft.reps, rest: draft.rest });
    setAddOpen(false);
  }

  async function saveCurrentRoutine() {
    if (!activeSession?.exercises?.length) { setError('Pehle workout mein exercises add karo.'); return; }
    const currentRoutine = savedRoutines.find(r => r.id === editingRoutineId);
    const name = window.prompt('Routine ka naam?', currentRoutine?.name || '');
    if (!name?.trim()) return;
    try {
      const body = {
        name: name.trim(), split: activeSession.split || activeSession.name, homeWorkout: /home/i.test(activeSession.split || activeSession.name),
        exercises: activeSession.exercises.map(ex => ({ exerciseName: ex.name, muscleGroup: ex.muscleGroup || ex.muscle, subMuscle: ex.subMuscle || null, equipment: ex.equipment || null, sets: ex.sets, reps: ex.reps, weightKg: ex.defaultWeight || 0, restSeconds: ex.rest || 90, trackingType: ex.trackingType || 'WEIGHT_REPS' })),
      };
      const routine = editingRoutineId
        ? await api(`/workouts/routines/${editingRoutineId}`, { method: 'PUT', body })
        : await api('/workouts/routines', { method: 'POST', body });
      setSavedRoutines(prev => [routine, ...prev.filter(x => x.id !== routine.id)]);
      setEditingRoutineId(routine.id);
    } catch (e) { setError(`Routine save nahi hua: ${e.message}`); }
  }

  async function loadRoutine(routine) {
    const exercises = (routine.exercises || []).map(ex => ({ ...ex, name: ex.exerciseName, muscle: bodyPartOf(ex.muscleGroup), rest: ex.restSeconds, defaultWeight: ex.weightKg, defaultReps: ex.reps }));
    await startSession(routine.split || routine.name, exercises);
    setEditingRoutineId(routine.id);
  }

  async function duplicateRoutine(routine) {
    try { const copy = await api(`/workouts/routines/${routine.id}/duplicate`, { method: 'POST' }); setSavedRoutines(prev => [...prev, copy]); }
    catch (e) { setError(e.message); }
  }

  async function deleteRoutine(routine) {
    try { await api(`/workouts/routines/${routine.id}`, { method: 'DELETE' }); setSavedRoutines(prev => prev.filter(x => x.id !== routine.id)); }
    catch (e) { setError(e.message); }
  }

  async function renameCustomExercise(exercise) {
    const name = window.prompt('Exercise ka naya naam?', exercise.name);
    if (!name?.trim() || name.trim() === exercise.name) return;
    try {
      const updated = await api(`/workouts/custom-exercises/${exercise.id}`, { method: 'PUT', body: { name: name.trim(), muscleGroup: exercise.muscleGroup || exercise.muscle || 'Other', subMuscle: exercise.subMuscle, equipment: exercise.equipment, primaryMuscles: exercise.primaryMuscles || [], secondaryMuscles: exercise.secondaryMuscles || [], trackingType: exercise.trackingType, notes: exercise.notes } });
      setSavedExercises(prev => prev.map(x => x.id === exercise.id ? { ...x, ...updated, muscle: updated.muscleGroup } : x));
    } catch (e) { setError(e.message); }
  }

  async function duplicateCustomExercise(exercise) {
    try { const copy = await api(`/workouts/custom-exercises/${exercise.id}/duplicate`, { method: 'POST' }); setSavedExercises(prev => [...prev, { ...copy, muscle: copy.muscleGroup, sets: exercise.sets, reps: exercise.reps, rest: exercise.rest }]); }
    catch (e) { setError(e.message); }
  }

  const draftQuery = draft.name.trim();
  const draftMachineMatches = draftQuery.length >= 2
    ? INDIAN_GYM_MACHINES.filter(m => matchesExercise(m, draftQuery)).slice(0, 3)
    : [];
  const draftMatches = draftQuery.length >= 2
    ? [...draftMachineMatches, ...library]
        .filter(ex => matchesExercise(ex, draftQuery))
        // Suggestions for the body part you picked come first.
        .sort((a, b) => (bodyPartOf(a.muscleGroup) === draft.muscle ? 0 : 1) - (bodyPartOf(b.muscleGroup) === draft.muscle ? 0 : 1))
        .filter((ex, i, arr) => arr.findIndex(x => shortName(x.name).toLowerCase() === shortName(ex.name).toLowerCase()) === i)
        .slice(0, 6)
    : [];

  const libraryByName = useMemo(() => {
    const map = new Map();
    for (const ex of library) map.set(shortName(ex.name).toLowerCase(), ex);
    return map;
  }, [library]);

  function openMachine(machine) {
    const target = normalizeTerm(machine.match || machine.name);
    const match = libraryByName.get(String(machine.match || '').toLowerCase())
      || library.find(ex => normalizeTerm(shortName(ex.name)) === target)
      || library.find(ex => {
        const have = normalizeTerm(shortName(ex.name));
        return have && (have.includes(target) || target.includes(have));
      });
    setDetail({
      ...machine,
      muscleGroup: machine.muscle,
      ...(match ? { instructions: match.instructions, primaryMuscles: match.primaryMuscles, secondaryMuscles: match.secondaryMuscles, commonMistakes: match.commonMistakes } : {}),
    });
  }

  function openDetailFor(exerciseName) {
    const key = String(exerciseName || '').toLowerCase();
    const found = libraryByName.get(key);
    if (found) { setDetail(found); return; }
    const machine = INDIAN_GYM_MACHINES.find(m => m.name.toLowerCase() === key);
    if (machine) { openMachine(machine); return; }
    setDetail({ name: exerciseName, muscleGroup: 'Strength', equipment: '', instructions: [], imageUrls: [] });
  }

  // History me body part columns: sets me sirf naam aata hai, part yahan resolve hota hai.
  function partOfExercises(name, sessionName) {
    const key = String(name || '').toLowerCase();
    const found = libraryByName.get(key);
    if (found) return bodyPartOf(found.muscleGroup);
    const machine = INDIAN_GYM_MACHINES.find(m => m.name.toLowerCase() === key);
    if (machine) return machine.muscle;
    const saved = savedExercises.find(e => e.name.toLowerCase() === key);
    if (saved?.muscle) return saved.muscle;
    return BODY_PARTS.find(p => String(sessionName || '').toLowerCase().startsWith(p.toLowerCase())) || 'Other';
  }

  function historyGroupsFor(session) {
    const groups = [];
    for (const row of groupSetsByExercise(session.sets)) {
      const snapshotMuscle = row.sets.find(s => s.muscleGroup)?.muscleGroup;
      const part = snapshotMuscle ? (BODY_PARTS.includes(snapshotMuscle) ? snapshotMuscle : bodyPartOf(snapshotMuscle)) : partOfExercises(row.name, session.name);
      let group = groups.find(g => g.part === part);
      if (!group) { group = { part, rows: [] }; groups.push(group); }
      group.rows.push(row);
    }
    return groups.sort((a, b) => BODY_PARTS.indexOf(a.part) - BODY_PARTS.indexOf(b.part));
  }

  const activeMuscles = MUSCLE_TABS.find(t => t.key === muscleTab)?.muscles;
  const availableSubMuscles = [...new Set(library.flatMap(ex => {
    if (activeMuscles && !activeMuscles.includes(ex.muscleGroup) && !(ex.primaryMuscles || []).some(m=>activeMuscles.includes(m))) return [];
    return ex.primaryMuscles?.length ? ex.primaryMuscles : [ex.muscleGroup];
  }).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const queryLower = query.trim().toLowerCase();
  const filteredLibrary = library
    .filter(ex => {
      if (!queryLower && activeMuscles && !activeMuscles.includes(ex.muscleGroup) && !(ex.primaryMuscles || []).some(m=>activeMuscles.includes(m)) && !(ex.secondaryMuscles || []).some(m=>activeMuscles.includes(m))) return false;
      if (selectedSubMuscle && ![...(ex.primaryMuscles || []),...(ex.secondaryMuscles || []),ex.muscleGroup].some(m=>String(m || '').toLowerCase()===selectedSubMuscle.toLowerCase())) return false;
      if (equipTab !== 'All' && !String(ex.equipment || '').toLowerCase().includes(equipTab)) return false;
      if (!queryLower) return true;
      return matchesExercise(ex, queryLower);
    })
    .filter((ex, i, arr) => arr.findIndex(x => shortName(x.name).toLowerCase() === shortName(ex.name).toLowerCase()) === i)
    .slice(0, 80);

  // Search karte waqt saare parts me dhoondo ("leg press" Chest tab par bhi mile),
  // warna body part filter hi lagta hai.
  const machineFiltered = INDIAN_GYM_MACHINES.filter(m => {
    if (!query.trim() && muscleTab !== 'All' && m.muscle !== muscleTab) return false;
    return matchesExercise(m, query);
  });

  const historyByExercise = useMemo(() => {
    const map = new Map();
    for (const session of sessions) {
      for (const group of groupSetsByExercise(session.sets)) {
        const key = group.name.toLowerCase();
        const bestSet = group.sets.reduce((top, row) => (Number(row.weightKg || 0) >= Number(top?.weightKg || 0) ? row : top), null);
        const list = map.get(key) || [];
        list.push({
          date: session.sessionDate,
          bestWeight: Number(bestSet?.weightKg || 0),
          bestReps: Number(bestSet?.reps || 0),
          sets: group.sets.length,
          volume: Math.round(volumeOf(group.sets)),
        });
        map.set(key, list);
      }
    }
    return map;
  }, [sessions]);

  const customForm = () => (
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
      <label className="block">
        <span className="text-muted text-[10px] uppercase tracking-wide">Body part · Kaunsa part</span>
        <select
          value={draft.muscle || 'Chest'}
          onChange={e => setDraft({ ...draft, muscle: e.target.value })}
          className="w-full mt-0.5 px-2 py-2 rounded-lg text-white text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {BODY_PARTS.map(p => (
            <option key={p} value={p} style={{ background: '#0b1220' }}>{PART_LABELS[p].en} · {PART_LABELS[p].hi}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input value={draft.customMuscleGroup || ''} onChange={e=>setDraft({...draft,customMuscleGroup:e.target.value})} placeholder="Custom muscle group" className="min-w-0 px-2 py-2 rounded-lg text-white text-xs outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
        <input value={draft.subMuscle || ''} onChange={e=>setDraft({...draft,subMuscle:e.target.value})} placeholder="Sub-muscle / custom target" className="min-w-0 px-2 py-2 rounded-lg text-white text-xs outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
        <input value={draft.equipment || ''} onChange={e=>setDraft({...draft,equipment:e.target.value})} placeholder="Equipment variation" className="min-w-0 px-2 py-2 rounded-lg text-white text-xs outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
      </div>
      <label className="block"><span className="text-muted text-[10px] uppercase tracking-wide">Tracking mode</span><select value={draft.trackingType || 'WEIGHT_REPS'} onChange={e=>setDraft({...draft,trackingType:e.target.value})} className="w-full mt-1 px-2 py-2 rounded-lg text-white text-xs" style={{background:'#101827'}}><option value="WEIGHT_REPS">Weight + reps</option><option value="BODYWEIGHT_REPS">Bodyweight reps</option><option value="WEIGHTED">Weighted bodyweight</option><option value="ASSISTED">Assisted movement</option><option value="TIME_BASED">Time based</option></select></label>
      {draftMatches.length > 0 && (
        <div className="space-y-1">
          {draftMatches.map(m => (
            <button
              key={m.id}
              onClick={() => {
                const muscle = draft.muscle || bodyPartOf(m.muscleGroup);
                rememberExercise({ name: shortName(m.name), muscle, muscleGroup: draft.customMuscleGroup || m.muscleGroup || muscle, subMuscle: draft.subMuscle || m.primaryMuscles?.[0] || '', equipment: draft.equipment || m.equipment || '', primaryMuscles: m.primaryMuscles || [], secondaryMuscles: m.secondaryMuscles || [], trackingType: draft.trackingType || 'WEIGHT_REPS', sets: clampInt(draft.sets, 3, 1, 20), reps: clampInt(draft.reps, 8, 1, 100), rest: clampInt(draft.rest, 90, 0, 600) });
                if (activeSession) addExercise({ ...m, name: m.name, muscle, muscleGroup: draft.customMuscleGroup || m.muscleGroup || muscle, subMuscle: draft.subMuscle || m.primaryMuscles?.[0], equipment: draft.equipment || m.equipment, trackingType: draft.trackingType || 'WEIGHT_REPS', images: m.imageUrls, sets: draft.sets, reps: draft.reps, rest: draft.rest });
                setDraft({ ...draft, name: '' });
                setAddOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/5 active:scale-[0.99] text-left"
            >
              <ExerciseDemo name={m.name} images={m.imageUrls} size={34} />
              <span className="text-white text-xs flex-1 truncate">{shortName(m.name)}</span>
              <span className="text-muted text-[10px] shrink-0">{PART_LABELS[bodyPartOf(m.muscleGroup)]?.en || m.muscleGroup}</span>
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
        <TealButton onClick={submitDraft} className="flex-1 text-xs py-2">{activeSession ? 'Add exercise' : 'Save exercise'}</TealButton>
        <GhostButton onClick={() => setAddOpen(false)} className="text-xs py-2 px-3">Cancel</GhostButton>
      </div>
    </div>
  );

  const plannedSets = activeSession?.exercises?.reduce((n, e) => n + e.sets, 0) || 0;
  // Ek body part = ek apna section/column. Naya part add hote hi uska naya
  // section ban jata hai; row apna original index rakhti hai taaki remove sahi jaye.
  const sessionGroups = useMemo(() => {
    const groups = [];
    for (const [i, ex] of (activeSession?.exercises || []).entries()) {
      const part = ex.muscle || 'Other';
      const last = groups[groups.length - 1];
      if (last && last.part === part) last.rows.push({ ex, i });
      else groups.push({ part, rows: [{ ex, i }] });
    }
    return groups.sort((a, b) => BODY_PARTS.indexOf(a.part) - BODY_PARTS.indexOf(b.part));
  }, [activeSession]);
  const totalVolume = sessions.reduce((sum, s) => sum + volumeOf(s.sets), 0);
  const totalSets = sessions.reduce((sum, s) => sum + (s.sets?.length || 0), 0);
  const historySessions = useMemo(() => {
    const days = historyRange === 'ALL' ? null : Number(historyRange);
    const cutoff = days ? Date.now() - days * 86400000 : 0;
    return sessions.filter(s => {
      const sessionDay = String(s.sessionDate || '').slice(0,10);
      if (historyRange === 'CUSTOM' && ((historyFrom && sessionDay < historyFrom) || (historyTo && sessionDay > historyTo))) return false;
      const date = new Date(s.sessionDate).getTime();
      if (cutoff && (!Number.isFinite(date) || date < cutoff)) return false;
      const muscleMatch = !historyMuscle.trim() || (s.sets || []).some(row => String(row.muscleGroup || '').toLowerCase().includes(historyMuscle.trim().toLowerCase()));
      const subMatch = !historySubMuscle.trim() || (s.sets || []).some(row => String(row.subMuscle || '').toLowerCase().includes(historySubMuscle.trim().toLowerCase()));
      const equipmentMatch = !historyEquipment.trim() || (s.sets || []).some(row => String(row.equipment || '').toLowerCase().includes(historyEquipment.trim().toLowerCase()));
      return muscleMatch && subMatch && equipmentMatch;
    });
  }, [sessions, historyRange, historyEquipment, historyMuscle, historySubMuscle, historyFrom, historyTo]);
  const weeklyMuscleVolume = useMemo(()=>{
    const cutoff=Date.now()-7*86400000;const totals={};
    for(const session of sessions){if(new Date(session.sessionDate).getTime()<cutoff)continue;for(const row of session.sets||[]){const muscle=row.muscleGroup||'Unclassified';totals[muscle]=(totals[muscle]||0)+(Number(row.weightKg)||0)*(Number(row.reps)||0);}}
    return Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,8);
  },[sessions]);

  async function renameWorkout(session) {
    const name = window.prompt('Workout ka naam?', session.name);
    if (!name?.trim() || name.trim() === session.name) return;
    try { const updated = await api(`/workouts/${session.id}`, { method: 'PUT', body: { name: name.trim(), sessionDate: session.sessionDate } }); setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...updated } : s)); }
    catch (e) { setError(e.message); }
  }
  async function deleteWorkout(session) {
    if (!window.confirm(`Delete ${session.name} and its recorded sets?`)) return;
    try { await api(`/workouts/${session.id}`, { method: 'DELETE' }); setSessions(prev => prev.filter(s => s.id !== session.id)); }
    catch (e) { setError(e.message); }
  }
  async function duplicateWorkout(session) {
    try { const copy=await api(`/workouts/${session.id}/duplicate`,{method:'POST'}); setSessions(prev=>[copy,...prev]); }
    catch(e){setError(e.message);}
  }
  async function editHistorySet(row) {
    const nextWeight = window.prompt('Weight (kg)', String(row.weightKg));
    if (nextWeight === null) return;
    const nextReps = window.prompt('Reps', String(row.reps));
    if (nextReps === null) return;
    try {
      const updated = await api(`/workouts/sets/${row.id}`, { method: 'PUT', body: { ...row, weightKg: Number(nextWeight), reps: Number(nextReps), previousWeightKg: row.previousWeightKg ?? null, restSeconds: row.restSeconds || 0 } });
      setSessions(prev => prev.map(s => ({ ...s, sets: (s.sets || []).map(x => x.id === row.id ? updated : x) })));
    } catch (e) { setError(e.message); }
  }
  async function deleteHistorySet(row) {
    if (!window.confirm(`Delete set ${row.setNumber} for ${row.exerciseName}?`)) return;
    try { await api(`/workouts/sets/${row.id}`, { method: 'DELETE' }); setSessions(prev => prev.map(s => ({ ...s, sets: (s.sets || []).filter(x => x.id !== row.id) }))); }
    catch (e) { setError(e.message); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Spinner size={36} /></div>;

  const loggedFor = (exerciseName) => completedSetKeys.filter(k => k.split(':')[1] === exerciseName).length;

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Dumbbell size={22} className="text-teal" /> Workout</h1>
          <p className="text-muted text-[11px]">Aaj ka workout · {activeSession ? 'Live session chal raha hai' : 'Strength training'}</p>
        </div>
        {activeSession && <Badge color="teal">LIVE</Badge>}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[['today', 'Today · Aaj'], ['exercises', 'Exercises · List'], ['history', 'History · Purane']].map(([key, label]) => (
          <Chip key={key} label={label} active={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {tab === 'today' && (
        <>
          {restTimer !== null && <RestTimer seconds={restTimer} onDone={() => setRestTimer(null)} />}

          <GlassCard>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Dumbbell size={16} className="text-teal" /> My Muscle Sections</h3>
            <div className="flex gap-2 mb-3">
              <input value={newSectionName} onChange={e=>setNewSectionName(e.target.value)} placeholder="New section, e.g. Triceps" className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
              <button onClick={addSection} className="px-3 py-2 rounded-xl text-xs font-semibold border border-teal/20 bg-teal/5 text-teal flex items-center gap-1"><Plus size={14}/>Add</button>
            </div>
            {sections.length===0 && <p className="text-muted text-xs">Apne workout folders banao, phir library se exercises add karo.</p>}
            {sections.map(section=><div key={section.id} className="mb-3 rounded-xl border border-white/5 p-3" style={{background:'rgba(255,255,255,0.02)'}}>
              <div className="flex items-center gap-2">
                {renamingId===section.id?<><input value={renameValue} onChange={e=>setRenameValue(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg text-white text-sm outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}/><button onClick={()=>renameSection(section.id)} className="text-teal"><Check size={16}/></button><button onClick={()=>setRenamingId(null)} className="text-muted"><X size={16}/></button></>:<><p className="text-white text-sm font-semibold flex-1">{section.name}</p><button onClick={()=>{setRenamingId(section.id);setRenameValue(section.name);}} aria-label="Rename section" className="text-muted"><Pencil size={14}/></button><button onClick={()=>deleteSection(section.id)} aria-label="Delete section" className="text-muted"><Trash2 size={14}/></button></>}
              </div>
              {(section.exercises||[]).map(ex=><div key={ex.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0"><p className="text-white text-xs flex-1">{ex.exerciseName}{ex.equipment?<span className="text-muted"> · {ex.equipment}</span>:null}</p><button onClick={()=>removeExerciseFromSection(section,ex.id)} aria-label="Remove exercise from section" className="text-muted"><X size={13}/></button></div>)}
              <div className="flex gap-2 mt-2"><button onClick={()=>setBrowseSectionId(browseSectionId===section.id?null:section.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-teal/20 bg-teal/5 text-teal flex items-center gap-1"><Search size={12}/>Browse exercises</button>{(section.exercises||[]).length>0&&<button onClick={()=>startSession(section.name,section.exercises.map(ex=>({name:ex.exerciseName,muscleGroup:ex.muscleGroup,equipment:ex.equipment,sets:3,reps:8,restSeconds:90})))} disabled={creating} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-white flex items-center gap-1"><Play size={12}/>Start section</button>}</div>
              {browseSectionId===section.id&&<div className="mt-2">{browseExercises(section).length===0&&<p className="text-muted text-xs">No {section.name} exercises found.</p>}{browseExercises(section).map((ex,i)=><button key={`${ex.name}-${i}`} onClick={()=>addExerciseToSection(section,ex)} className="w-full flex items-center gap-2 py-2 border-b border-white/5 last:border-0 text-left"><Plus size={13} className="text-teal"/><span className="text-white text-xs flex-1">{ex.name}</span><span className="text-muted text-xs">{ex.equipment||ex.muscleGroup||ex.muscle}</span></button>)}</div>}
            </div>)}
          </GlassCard>

          {activeSession ? (
            <GlassCard accent="teal">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Badge color="teal">LIVE SESSION</Badge>
                  <h3 className="text-white font-bold mt-1">{activeSession.split}</h3>
                  <p className="text-muted text-[11px]">{activeSession.exercises?.length || 0} exercises · {plannedSets} sets planned</p>
                  <p className="text-teal text-[11px] mt-0.5 tab-num">
                    {activeSession.startedAt ? formatDuration(now - activeSession.startedAt) : '00:00'} · {completedSetKeys.length}/{plannedSets} sets done
                  </p>
                </div>
                <div className="flex gap-1.5"><GhostButton onClick={saveCurrentRoutine} className="text-[10px] py-1 px-2">Save plan</GhostButton><TealButton onClick={finishSession} className="text-xs py-1.5 px-3">Finish</TealButton></div>
              </div>

              {sessionGroups.map(group => (
                <div key={group.part} className="mb-3 rounded-xl border border-teal/20 bg-white/[0.03] p-2">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-teal/20">
                    <p className="text-teal text-xs font-bold uppercase tracking-wider">{PART_LABELS[group.part]?.en || group.part}</p>
                    <p className="text-muted text-[10px]">{PART_LABELS[group.part]?.hi || ''} · {group.rows.length}</p>
                  </div>
                  {group.rows.map(({ ex, i: ei }) => {
                  const done = loggedFor(ex.name);
                  return (
                  <div key={`${ex.name}-${ei}`} className="mb-3 pb-2 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
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
                      <button onClick={() => moveExercise(ei, -1)} aria-label={`Move ${ex.name} up`} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">↑</button>
                      <button onClick={() => moveExercise(ei, 1)} aria-label={`Move ${ex.name} down`} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">↓</button>
                    </div>

                    {Array.isArray(ex.previous) && ex.previous.length > 0 && (
                      <p className="text-muted text-[10px] mb-1">
                        Last time: {ex.previous.slice(0, 3).map(r => `${r.weightKg}kg×${r.reps}`).join(' · ')}
                      </p>
                    )}

                    {Object.entries(loggedSets).filter(([k]) => k.startsWith(`${ex.name}:`)).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {Object.entries(loggedSets).filter(([k]) => k.startsWith(`${ex.name}:`)).map(([k, v]) => (
                          <span key={k} className="px-1.5 py-0.5 rounded-md bg-black/30 border border-teal/20 text-teal/80 text-[10px]">
                            {v.weightKg}kg × {v.reps} ✓
                          </span>
                        ))}
                      </div>
                    )}

                    {Array.from({ length: ex.sets }, (_, si) => (
                      <SetRow
                        key={si}
                        set={{ setNumber: si + 1, weightKg: si === 0 ? ex.defaultWeight : ex.defaultWeight, reps: si === 0 ? ex.defaultReps : ex.reps, restSeconds: ex.rest, previousWeightKg: ex.previous?.[si]?.weightKg ?? null }}
                        onChange={() => {}}
                        disabled={savingSet || completedSetKeys.includes(`${activeSession.id}:${ex.name}:${si + 1}`)}
                        done={completedSetKeys.includes(`${activeSession.id}:${ex.name}:${si + 1}`)}
                        onDone={(s) => logSet(activeSession.id, { ...s, exerciseName: ex.name, restSeconds: ex.rest, muscleGroup: ex.muscleGroup || ex.subMuscle || ex.muscle, subMuscle: ex.subMuscle || ex.muscleGroup || ex.muscle, equipment: ex.equipment || '', trackingType: ex.trackingType || 'WEIGHT_REPS' })}
                      />
                    ))}
                    <div className="flex gap-2 mt-1.5">
                      <GhostButton onClick={() => addSetSlot(ei)} className="text-[11px] py-1 px-2">+ set</GhostButton>
                      <GhostButton onClick={() => removeSetSlot(ei)} className="text-[11px] py-1 px-2">− set</GhostButton>
                      <GhostButton onClick={() => openDetailFor(ex.name)} className="text-[11px] py-1 px-2">Kaise karein</GhostButton>
                    </div>
                  </div>
                  );
                  })}
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <TealButton onClick={() => setTab('exercises')} className="flex-1 text-xs py-2 flex items-center justify-center gap-1">
                  <Search size={13} /> Browse exercises
                </TealButton>
                <GhostButton onClick={() => setAddOpen(o => !o)} className="text-xs py-2 px-3">Custom</GhostButton>
              </div>

              {addOpen && customForm()}

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
              {summary && (
                <GlassCard accent="teal">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge color="teal">SESSION SAVED</Badge>
                      <h3 className="text-white font-bold mt-1">{summary.name}</h3>
                      <p className="text-muted text-[11px]">
                        {summary.exercises} exercises · {summary.sets} sets · {summary.volume.toLocaleString()} kg volume
                        {summary.best ? ` · best ${summary.best.weightKg}kg × ${summary.best.reps}` : ''}
                      </p>
                    </div>
                    <button onClick={() => setSummary(null)} aria-label="Dismiss summary" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <X size={12} className="text-muted" />
                    </button>
                  </div>
                </GlassCard>
              )}

              <GlassCard>
                <h3 className="font-semibold text-white flex items-center gap-2"><Play size={16} className="text-teal" /> Body part chuno <span className="text-muted text-[11px] font-normal">· Pick a body part</span></h3>
                <p className="text-muted text-[11px] mt-1 mb-3">Jo exercises tune save ki hain, wo ek tap me session me aa jayengi.</p>
                <div className="grid grid-cols-2 gap-2">
                  {BODY_PARTS.filter(p => p !== 'Other').map(part => {
                    const count = savedExercises.filter(e => (e.muscle || 'Other') === part).length;
                    return (
                      <button
                        key={part}
                        onClick={() => startBodyPart(part)}
                        disabled={creating}
                        className="text-left px-3 py-2.5 rounded-xl border border-teal/20 bg-teal/5 active:scale-[0.98] disabled:opacity-50"
                      >
                        <p className="text-white text-sm font-semibold">{PART_LABELS[part].en}</p>
                        <p className="text-muted text-[10px]">{PART_LABELS[part].hi} · {count ? `${count} saved` : 'top exercises'}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-muted text-[10px] uppercase tracking-wide mt-3 mb-1.5">Other splits · Baaki splits</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPLITS.map(s => (
                    <button key={s} onClick={() => startSession(s)} disabled={creating} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 bg-white/5 text-white/80 active:scale-95 disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
              </GlassCard>

              {savedRoutines.length > 0 && <GlassCard>
                <h3 className="text-white text-sm font-semibold mb-2">Saved workout plans</h3>
                <div className="space-y-2">{savedRoutines.map(routine => <div key={routine.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <div className="flex-1 min-w-0"><p className="text-white text-xs font-semibold truncate">{routine.name}</p><p className="text-muted text-[10px]">{routine.exercises?.length || 0} exercises{routine.homeWorkout ? ' · Home' : ''}</p></div>
                  <button onClick={()=>loadRoutine(routine)} className="text-teal text-[10px]">Start</button>
                  <button onClick={()=>loadRoutine(routine)} className="text-white/70 text-[10px]">Edit</button>
                  <button onClick={()=>duplicateRoutine(routine)} className="text-white/70 text-[10px]">Copy</button>
                  <button onClick={()=>deleteRoutine(routine)} className="text-red-300 text-[10px]">Delete</button>
                </div>)}</div>
              </GlassCard>}

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

              {records.length>0 && <GlassCard><h3 className="text-white text-xs font-semibold mb-2">Personal records · Logged PRs</h3><div className="space-y-1.5">{records.slice(0,4).map(pr=><div key={pr.exerciseName} className="flex items-center justify-between gap-2 text-[11px]"><span className="text-white/80 truncate">{pr.exerciseName}</span><span className="text-gold tab-num shrink-0">{pr.weightKg} kg × {pr.reps}</span></div>)}</div></GlassCard>}

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
              <Chip key={t.key} label={t.key} active={muscleTab === t.key} onClick={() => {setMuscleTab(t.key);setSelectedSubMuscle('');}} />
            ))}
          </div>

          {availableSubMuscles.length>0 && <div className="flex gap-2 overflow-x-auto no-scrollbar"><Chip label="All sub-muscles" active={!selectedSubMuscle} onClick={()=>setSelectedSubMuscle('')} />{availableSubMuscles.map(m=><Chip key={m} label={m} active={selectedSubMuscle===m} onClick={()=>setSelectedSubMuscle(m)} />)}</div>}

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

          {(favoriteExercises.length > 0 || recentExercises.length > 0) && <GlassCard>
            {favoriteExercises.length > 0 && <div className="mb-2"><p className="text-gold text-[10px] font-bold uppercase tracking-wide mb-1">Favorites</p><div className="flex gap-1.5 overflow-x-auto">{favoriteExercises.map(name=>{const ex=[...library,...savedExercises,...INDIAN_GYM_MACHINES].find(x=>x.name.toLowerCase()===name.toLowerCase());return ex?<button key={name} onClick={()=>quickAdd(ex)} className="px-2 py-1 rounded-lg bg-gold/10 border border-gold/20 text-gold text-[10px] whitespace-nowrap">★ {shortName(name)}</button>:null;})}</div></div>}
            {recentExercises.length > 0 && <div><p className="text-muted text-[10px] font-bold uppercase tracking-wide mb-1">Recently used</p><div className="flex gap-1.5 overflow-x-auto">{recentExercises.map(ex=><button key={ex.name} onClick={()=>quickAdd(ex)} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/75 text-[10px] whitespace-nowrap">↻ {shortName(ex.name)}</button>)}</div></div>}
          </GlassCard>}

          <GlassCard>
            <div className="flex items-center justify-between">
              <p className="text-white text-xs font-semibold">My exercises{savedExercises.length ? ` (${savedExercises.length})` : ''}</p>
              <button onClick={() => setAddOpen(o => !o)} className="px-2 py-1 rounded-lg bg-teal/10 border border-teal/20 text-teal text-[11px] flex items-center gap-1">
                <Plus size={11} /> Custom
              </button>
            </div>
            {savedExercises.length === 0 ? (
              <p className="text-muted text-[11px] mt-1">Apna exercise naam add kar — body part ke saath save hoga, aur delete bhi kar sakta hai.</p>
            ) : (
              <div className="mt-2 space-y-3">
                {BODY_PARTS.map(part => {
                  const items = savedExercises.filter(e => (e.muscle || 'Other') === part);
                  if (!items.length) return null;
                  return (
                    <div key={part}>
                      <p className="text-teal text-[10px] font-bold uppercase tracking-wider mb-1">
                        {PART_LABELS[part].en} <span className="text-muted normal-case font-normal">· {PART_LABELS[part].hi} · {items.length}</span>
                      </p>
                      <div className="space-y-1">
                        {items.map(ex => (
                          <div key={`${part}-${ex.name}`} className="flex items-center gap-2">
                            <button onClick={() => quickAdd({ name: ex.name, muscle: part })} className="flex-1 min-w-0 text-left text-xs text-white/85 truncate">
                              <span className="text-teal mr-1">+</span>{ex.name}
                              <span className="text-muted text-[10px] ml-1">{ex.sets}×{ex.reps}</span>
                            </button>
                            <button onClick={() => renameCustomExercise(ex)} aria-label={`Rename ${ex.name}`} className="px-1.5 h-6 rounded bg-white/5 text-teal text-[9px]">Edit</button>
                            <button onClick={() => duplicateCustomExercise(ex)} aria-label={`Duplicate ${ex.name}`} className="px-1.5 h-6 rounded bg-white/5 text-white/70 text-[9px]">Copy</button>
                            <button onClick={() => deleteSavedExercise(ex)} aria-label={`Delete ${ex.name}`} className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                              <Trash2 size={11} className="text-muted" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {addOpen && customForm()}
          </GlassCard>

          <div className="flex gap-2">
            <Chip label={`Library · ${library.length}`} active={!machineMode} onClick={() => setMachineMode(false)} />
            <Chip label={`Gym machines · ${INDIAN_GYM_MACHINES.length}`} active={machineMode} onClick={() => { setMachineMode(true); setMuscleTab('All'); }} />
          </div>

          {machineMode ? (
            <div className="space-y-2">
              <p className="text-muted text-[11px]">{machineFiltered.length} gym machines{muscleTab !== 'All' ? ` · ${muscleTab}` : ''} · machine ka naam English/Hinglish dono se search kar</p>
              {machineFiltered.map(m => (
                <GlassCard key={m.id}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openMachine(m)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <ExerciseDemo name={m.name} images={m.imageUrls} size={46} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{m.name}</p>
                        <p className="text-muted text-[11px] truncate">{m.hi} · machine</p>
                      </div>
                    </button>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); quickAdd(m); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); quickAdd(m); } }}
                      aria-label={`Add ${m.name} to workout`}
                      className="w-7 h-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center"
                    >
                      <Plus size={12} className="text-teal" />
                    </span>
                  </div>
                </GlassCard>
              ))}
              {machineFiltered.length === 0 && (
                <p className="text-muted text-xs text-center py-6">Machine nahi mili · naam check kar (e.g. leg press, pec deck, lat pulldown).</p>
              )}
            </div>
          ) : (
          <>
          <p className="text-muted text-[11px]">{filteredLibrary.length} exercises{activeMuscles ? ` · ${muscleTab}` : ''} · tap + to add</p>

          {filteredLibrary.map(ex => (
            <div key={ex.id} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')setDetail(ex);}} onClick={() => setDetail(ex)} className="w-full text-left cursor-pointer">
              <GlassCard>
                <div className="flex items-center gap-3">
                  <ExerciseDemo name={ex.name} images={ex.imageUrls} size={46} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{shortName(ex.name)}</p>
                    <p className="text-muted text-[11px]">{ex.muscleGroup} · {ex.equipment || 'bodyweight'}</p>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); quickAdd(ex); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); quickAdd(ex); } }}
                    aria-label={`Add ${shortName(ex.name)} to workout`}
                    className="w-7 h-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center"
                  >
                    <Plus size={12} className="text-teal" />
                  </span>
                  <button type="button" onClick={e=>{e.stopPropagation();toggleFavorite(ex);}} aria-label={`${favoriteExercises.some(n=>n.toLowerCase()===ex.name.toLowerCase())?'Unfavorite':'Favorite'} ${ex.name}`} className={`w-7 h-7 rounded-full border flex items-center justify-center ${favoriteExercises.some(n=>n.toLowerCase()===ex.name.toLowerCase())?'bg-gold/15 border-gold/40':'bg-white/5 border-white/10'}`}>
                    <Star size={12} className={favoriteExercises.some(n=>n.toLowerCase()===ex.name.toLowerCase())?'text-gold fill-current':'text-muted'} />
                  </button>
                </div>
              </GlassCard>
            </div>
          ))}

          {filteredLibrary.length === 0 && (
            <p className="text-muted text-xs text-center py-6">"{query}" nahi mila · No exercise found. Spelling check kar ya body part change kar.</p>
          )}
          </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          <GlassCard>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-muted text-[11px]">Period</span>
              {[['7','7d'],['30','30d'],['90','3m'],['180','6m'],['365','1y'],['ALL','All time'],['CUSTOM','Custom']].map(([key,label]) => <Chip key={key} label={label} active={historyRange===key} onClick={()=>setHistoryRange(key)} />)}
            </div>
            {historyRange==='CUSTOM' && <div className="grid grid-cols-2 gap-2 mt-2"><label className="text-muted text-[10px]">From<input type="date" value={historyFrom} onChange={e=>setHistoryFrom(e.target.value)} className="block w-full mt-1 px-2 py-2 rounded-lg text-white text-xs" style={{background:'#101827'}} /></label><label className="text-muted text-[10px]">To<input type="date" value={historyTo} onChange={e=>setHistoryTo(e.target.value)} className="block w-full mt-1 px-2 py-2 rounded-lg text-white text-xs" style={{background:'#101827'}} /></label></div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <input value={historyMuscle} onChange={e=>setHistoryMuscle(e.target.value)} placeholder="Muscle group" className="min-w-0 px-3 py-2 rounded-lg text-white text-sm outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
              <input value={historySubMuscle} onChange={e=>setHistorySubMuscle(e.target.value)} placeholder="Sub-muscle" className="min-w-0 px-3 py-2 rounded-lg text-white text-sm outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
              <input value={historyEquipment} onChange={e=>setHistoryEquipment(e.target.value)} placeholder="Equipment" className="min-w-0 px-3 py-2 rounded-lg text-white text-sm outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}} />
            </div>
            <button onClick={()=>{ const rows=historySessions.flatMap(s=>(s.sets||[]).map(x=>({date:s.sessionDate,workout:s.name,...x}))); const csv=['date,workout,exercise,muscle,equipment,set,reps,weight_kg,volume_kg','...']; const body=[csv[0],...rows.map(r=>[r.date,r.workout,r.exerciseName,r.muscleGroup,r.equipment,r.setNumber,r.reps,r.weightKg,(Number(r.reps)||0)*(Number(r.weightKg)||0)].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(','))].join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([body],{type:'text/csv'})); a.download='dreamphysic-workout-history.csv'; a.click(); URL.revokeObjectURL(a.href); }} className="mt-2 text-teal text-xs">Export visible history</button>
          </GlassCard>
          {weeklyMuscleVolume.length>0 && <GlassCard><h3 className="text-white text-xs font-semibold mb-2">Weekly muscle volume · last 7 days</h3><div className="space-y-1.5">{weeklyMuscleVolume.map(([muscle,volume])=><div key={muscle} className="flex items-center gap-2 text-[10px]"><span className="w-24 truncate text-muted">{muscle}</span><div className="h-1.5 flex-1 rounded bg-white/10"><div className="h-full rounded bg-teal" style={{width:`${Math.min(100,volume/Math.max(1,weeklyMuscleVolume[0][1])*100)}%`}} /></div><span className="tab-num text-white/80">{Math.round(volume).toLocaleString()} kg</span></div>)}</div></GlassCard>}
          {historySessions.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <History size={36} className="mx-auto mb-3 opacity-30" />
              <ContentEmptyState section="workout" onAction={() => setTab('today')} />
            </div>
          ) : historySessions.map((s) => {
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
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={()=>renameWorkout(s)} className="text-teal text-[10px]">Rename</button>
                  <button onClick={()=>duplicateWorkout(s)} className="text-white/70 text-[10px]">Duplicate</button>
                  <button onClick={()=>deleteWorkout(s)} className="text-red-300 text-[10px]">Delete session</button>
                </div>

                {open && (
                  <div className="mt-3 space-y-2">
                    {grouped.length === 0 && <p className="text-muted text-xs">No sets were logged in this session.</p>}
                    {historyGroupsFor(s).map(grp => {
                      const partKey = `${s.id}:${grp.part}`;
                      const partOpen = openHistoryPart === partKey;
                      return (
                        <div key={grp.part} className="rounded-xl border border-white/10 bg-white/[0.03]">
                          <button
                            onClick={() => setOpenHistoryPart(partOpen ? '' : partKey)}
                            aria-expanded={partOpen}
                            className="w-full flex items-center justify-between px-2.5 py-2"
                          >
                            <span className="text-teal text-[11px] font-bold uppercase tracking-wider">{PART_LABELS[grp.part]?.en || grp.part}</span>
                            <span className="flex items-center gap-1.5 text-muted text-[10px]">
                              {PART_LABELS[grp.part]?.hi} · {grp.rows.length} exercise{grp.rows.length > 1 ? 's' : ''}
                              {partOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </span>
                          </button>
                          {partOpen && (
                          <div className="px-2 pb-2 space-y-2">
                          {grp.rows.map(g => (
                      <div key={g.name} className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start gap-2 mb-1">
                          <ExerciseDemo name={g.name} images={[]} size={34} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{g.name}</p>
                            <p className="text-muted text-[10px]">
                              {g.sets.length} sets · {g.sets[0]?.equipment || 'Equipment not recorded'} · best {Math.max(...g.sets.map(x => Number(x.weightKg || 0)))} kg · {Math.round(volumeOf(g.sets))} kg vol
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {g.sets.slice().sort((a, b) => a.setNumber - b.setNumber).map((row, i) => (
                            <div key={`${row.setNumber}-${i}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/30 border border-white/10 text-white/80 text-[10px] mr-1">
                              {row.setType && row.setType !== 'WORKING' ? `${row.setType} · ` : ''}S{row.setNumber}: {row.weightKg}kg × {row.reps}
                              <button onClick={()=>editHistorySet(row)} aria-label="Edit set" className="text-teal ml-1">Edit</button>
                              <button onClick={()=>deleteHistorySet(row)} aria-label="Delete set" className="text-red-300">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                          </div>
                          )}
                        </div>
                      );
                    })}
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

      {pendingSave && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={e => { if (e.target === e.currentTarget) setPendingSave(null); }}>
          <div className="w-full max-w-md rounded-t-3xl border-t border-teal/25 p-4 space-y-2.5" style={{ background: '#0b1220' }} onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="text-white font-bold">Exercise save karein?</h3>
              <p className="text-muted text-xs mt-1">{pendingSave.name} · {PART_LABELS[pendingSave.muscle]?.en} ({PART_LABELS[pendingSave.muscle]?.hi})</p>
              <p className="text-white/70 text-[11px] mt-2 leading-relaxed">
                Permanent: agli baar is body part me automatic aa jayega. Temporary: sirf aaj ke session me rahega, save nahi hoga.
              </p>
            </div>
            <TealButton onClick={() => { rememberExercise(pendingSave); setPendingSave(null); }} className="w-full text-sm py-2.5">
              Save permanently · Hamesha ke liye
            </TealButton>
            <GhostButton onClick={() => setPendingSave(null)} className="w-full text-sm py-2">
              Temporary · Sirf is session ke liye
            </GhostButton>
          </div>
        </div>
      )}

      {detail && (
        <ExerciseDetail
          exercise={detail}
          onClose={() => setDetail(null)}
          canAdd={Boolean(activeSession)}
          onAdd={(ex) => addExercise({ ...ex, name: ex.name, images: ex.imageUrls, muscle: bodyPartOf(ex.muscleGroup) })}
          onStartSession={(ex) => startSession(SPLIT_FOR_MUSCLE[ex.muscleGroup] || 'Full Body', ex)}
          history={historyByExercise.get(shortName(detail.name).toLowerCase()) || []}
        />
      )}
    </div>
  );
}

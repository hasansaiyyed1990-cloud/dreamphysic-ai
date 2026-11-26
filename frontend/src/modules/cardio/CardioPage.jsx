import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Heart, Play, Pause, Square, Camera, Upload, ChevronRight, Bike, Footprints, Waves, Zap, Timer, Flame, MapPin } from 'lucide-react';
import { api, apiUpload } from '../../shared/api.js';
import { GlassCard, TealButton, GhostButton, Spinner, ErrorMsg, Badge, Chip, CircularProgress, ContentEmptyState } from '../../shared/ui.jsx';
import { getLocalIstDateString } from '../../shared/date.js';
import { HIIT_CIRCUIT_TEMPLATES, HIIT_EXERCISES } from './hiitBodyweightDb.js';

// Isolated live timer — never re-renders parent
const LiveTimer = memo(({ running }) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now() - elapsed * 1000);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [running]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <span className="tab-num text-teal font-bold text-5xl block text-center my-4">
      {h > 0 && `${String(h).padStart(2,'0')}:`}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  );
});

const MODES = [
  { id: 'run', label: 'Run', icon: Footprints },
  { id: 'cycle', label: 'Cycle', icon: Bike },
  { id: 'swim', label: 'Swim', icon: Waves },
  { id: 'hiit', label: 'HIIT', icon: Zap },
  { id: 'walk', label: 'Walk', icon: Footprints },
];

export default function CardioPage() {
  const [mode, setMode] = useState('run');
  const [tab, setTab] = useState('log'); // log | history | ai
  const [sessions, setSessions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [form, setForm] = useState({ distanceKm: '', durationMin: '', notes: '', date: getLocalIstDateString() });
  const [saving, setSaving] = useState(false);
  const [importingPhoto, setImportingPhoto] = useState(false);
  const fileRef = useRef(null);
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedCircuit, setSelectedCircuit] = useState(HIIT_CIRCUIT_TEMPLATES[0]?.id || '');
  const loadControllerRef = useRef(null);
  const reportControllerRef = useRef(null);
  const photoControllerRef = useRef(null);
  const photoRequestIdRef = useRef(0);

  const load = useCallback(async () => {
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    setLoading(true);
    try {
      const [sess, ov, g] = await Promise.allSettled([
        api('/cardio', { signal: controller.signal }),
        api('/cardio/overview', { signal: controller.signal }),
        api('/cardio/goals', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (sess.status === 'fulfilled') setSessions(Array.isArray(sess.value) ? sess.value : []);
      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (g.status === 'fulfilled') setGoals(g.value);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => { loadControllerRef.current?.abort(); reportControllerRef.current?.abort(); photoControllerRef.current?.abort(); }; }, [load]);

  useEffect(() => {
    if (tab !== 'ai') reportControllerRef.current?.abort();
  }, [tab]);

  async function logCardio(e) {
    e.preventDefault();
    const distance = Number.parseFloat(form.distanceKm);
    const durationMinutes = Number.parseInt(form.durationMin, 10);
    if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(durationMinutes) || durationMinutes < 1) {
      setError('Enter a valid distance and a duration of at least one minute.');
      return;
    }
    setSaving(true);
    try {
      const activity = { run: 'RUNNING', cycle: 'CYCLING', swim: 'SWIMMING', hiit: 'HIIT', walk: 'WALKING' }[mode];
      const sessionDate = `${form.date}T${new Date().toTimeString().slice(0, 8)}`;
      await api('/cardio', { method: 'POST', body: {
        distanceKm: distance, durationMinutes, activity, sessionDate,
        caloriesBurned: calories || 0, notes: mode === 'hiit' ? `${form.notes}${form.notes ? ' · ' : ''}${HIIT_CIRCUIT_TEMPLATES.find(c => c.id === selectedCircuit)?.name || 'HIIT circuit'}` : form.notes,
        source: 'MANUAL',
      } });
      setForm(f => ({ ...f, distanceKm: '', durationMin: '', notes: '' }));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function importScreenshot(e) {
    const file = e.target.files[0];
    if (!file) return;
    const requestId = ++photoRequestIdRef.current;
    photoControllerRef.current?.abort();
    const controller = new AbortController();
    photoControllerRef.current = controller;
    setImportingPhoto(true);
    try {
      // The selected File is streamed directly; screenshots are not persisted in web storage.
      const result = await apiUpload('/cardio/import-screenshot', { file, signal: controller.signal });
      if (!result.isCardioScreenshot || !['high', 'medium'].includes(String(result.confidence).toLowerCase())) throw new Error(result.warning || 'Upload a clearer cardio workout summary.');
      if (!controller.signal.aborted && photoRequestIdRef.current === requestId) setForm(f => ({
        ...f,
        distanceKm: result.distanceKm ?? f.distanceKm,
        durationMin: result.durationSeconds ? Math.max(1, Math.round(result.durationSeconds / 60)) : f.durationMin,
        date: result.sessionDate || f.date,
        notes: result.notes || f.notes,
      }));
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      if (photoRequestIdRef.current === requestId) setImportingPhoto(false);
      e.target.value = '';
    }
  }

  async function loadAiReport() {
    reportControllerRef.current?.abort();
    const controller = new AbortController();
    reportControllerRef.current = controller;
    setAiLoading(true);
    try {
      const r = await api('/cardio/ai/weekly-report', { signal: controller.signal });
      if (!controller.signal.aborted) setAiReport(r);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!controller.signal.aborted) setAiLoading(false);
    }
  }

  const validDistance = Number.parseFloat(form.distanceKm);
  const validDuration = Number.parseFloat(form.durationMin);
  const pace = Number.isFinite(validDistance) && validDistance > 0 && Number.isFinite(validDuration) && validDuration > 0
    ? (validDuration / validDistance).toFixed(1)
    : null;

  const calories = Number.isFinite(validDuration) && validDuration > 0
    ? Math.round(validDuration * (mode === 'run' ? 10 : mode === 'cycle' ? 7 : 8))
    : null;
  const weeklyDistance = Number.isFinite(Number(overview?.weeklyDistanceKm)) ? Number(overview.weeklyDistanceKm) : 0;

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Spinner size={36} /></div>;

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Heart size={22} className="text-teal" /> Cardio</h1>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="text-center py-3">
            <Flame size={18} className="text-gold mx-auto mb-1" />
            <p className="tab-num text-gold font-bold text-lg">{overview.todayCalories || 0}</p>
            <p className="text-muted text-[10px]">kcal today</p>
          </GlassCard>
          <GlassCard className="text-center py-3">
            <MapPin size={18} className="text-teal mx-auto mb-1" />
            <p className="tab-num text-teal font-bold text-lg">{weeklyDistance.toFixed(1)}</p>
            <p className="text-muted text-[10px]">km/week</p>
          </GlassCard>
          <GlassCard className="text-center py-3">
            <Timer size={18} className="text-purple mx-auto mb-1" />
            <p className="tab-num text-purple font-bold text-lg">{overview.weeklySessions || 0}</p>
            <p className="text-muted text-[10px]">sessions</p>
          </GlassCard>
        </div>
      )}

      {/* Mode Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border
              ${mode === id ? 'bg-teal border-teal text-bg' : 'border-white/10 text-muted bg-transparent'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['log', 'history', 'ai'].map(t => (
          <Chip key={t} label={t === 'ai' ? '🤖 AI Coach' : t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {tab === 'log' && (
        <>
          {/* Live Timer */}
          <GlassCard accent="teal" className="text-center">
            <p className="text-muted text-xs uppercase tracking-widest mb-1">{MODES.find(m => m.id === mode)?.label} Session</p>
            <LiveTimer running={timerRunning} />
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setTimerRunning(r => !r)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${timerRunning ? 'bg-gold/10 border border-gold' : 'bg-teal border border-teal'}`}
              >
                {timerRunning ? <Pause size={22} className="text-gold" /> : <Play size={22} className="text-bg" />}
              </button>
              {timerRunning && (
                <button
                  onClick={() => setTimerRunning(false)}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/30"
                >
                  <Square size={22} className="text-red-400" />
                </button>
              )}
            </div>
          </GlassCard>

          {/* Log Form */}
          <GlassCard>
            <h3 className="font-semibold text-white mb-3">Log {MODES.find(m => m.id === mode)?.label}</h3>
            <form onSubmit={logCardio} className="space-y-3">
              {mode === 'hiit' && <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <label className="block text-xs text-muted mb-2">Bodyweight circuit preset</label>
                <select value={selectedCircuit} onChange={e => setSelectedCircuit(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-white/10 p-3 text-white text-base">
                  {HIIT_CIRCUIT_TEMPLATES.map(circuit => <option key={circuit.id} value={circuit.id}>{circuit.name} · {circuit.durationMinutes} min</option>)}
                </select>
                <div className="mt-2 flex flex-wrap gap-1.5">{(HIIT_CIRCUIT_TEMPLATES.find(c => c.id === selectedCircuit)?.exerciseIds || []).map(id => {
                  const exercise = HIIT_EXERCISES.find(item => item.id === id);
                  return exercise ? <Badge key={id} color="muted">{exercise.name}</Badge> : null;
                })}</div>
              </div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1.5">Distance (km)</label>
                  <input type="number" step="0.01" min="0" placeholder="5.5"
                    value={form.distanceKm} onChange={e => setForm(f => ({ ...f, distanceKm: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1.5">Duration (min)</label>
                  <input type="number" min="1" placeholder="30"
                    value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>

              {(pace || calories) && (
                <div className="flex gap-3">
                  {pace && <Badge color="teal">⚡ {pace} min/km</Badge>}
                  {calories && <Badge color="gold">🔥 ~{calories} kcal</Badge>}
                </div>
              )}

              <div>
                <label className="text-xs text-muted block mb-1.5">Notes</label>
                <input placeholder="Morning run, felt great…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              <div className="flex gap-2">
                <TealButton type="submit" disabled={saving} className="flex-1">
                  {saving ? <Spinner size={16} /> : 'Save Session'}
                </TealButton>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="btn-ghost flex items-center gap-1.5 px-3 text-xs">
                  {importingPhoto ? <Spinner size={14} /> : <><Camera size={14} /> Import</>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={importScreenshot} />
              </div>
            </form>
          </GlassCard>
        </>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Heart size={36} className="mx-auto mb-3 opacity-30" />
              <ContentEmptyState section="cardio" />
            </div>
          ) : sessions.slice(0, 20).map((s, i) => (
            <GlassCard key={i}>
              <div className="flex items-center justify-between">
                <div>
                  <Badge color={s.activity === 'RUNNING' ? 'teal' : 'purple'}>{s.activity?.replaceAll('_', ' ')}</Badge>
                  <div className="flex gap-3 mt-1.5">
                    {s.distanceKm && <span className="tab-num text-white font-bold">{s.distanceKm}km</span>}
                    {s.durationMinutes && <span className="text-muted text-sm">{s.durationMinutes}min</span>}
                    {s.caloriesBurned && <span className="text-gold text-sm">{s.caloriesBurned}kcal</span>}
                  </div>
                  <p className="text-muted text-xs mt-0.5">{s.sessionDate?.slice(0, 10)}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-4">
          <TealButton onClick={loadAiReport} disabled={aiLoading} className="w-full">
            {aiLoading ? <Spinner size={16} /> : '🤖 Generate Weekly AI Report'}
          </TealButton>
          {aiReport && (
            <GlassCard accent="teal">
              <h3 className="font-semibold text-white mb-2">AI Weekly Report</h3>
              <p className="text-muted text-sm leading-relaxed">{aiReport.report || aiReport.summary || JSON.stringify(aiReport)}</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

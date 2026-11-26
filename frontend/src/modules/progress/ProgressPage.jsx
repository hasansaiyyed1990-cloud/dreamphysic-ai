import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Camera, Plus, Scale, ChevronRight, Award, AlertCircle } from 'lucide-react';
import { api } from '../../shared/api.js';
import { GlassCard, TealButton, PurpleButton, Spinner, ErrorMsg, Badge, CircularProgress, Divider, ContentEmptyState, ScienceTooltip } from '../../shared/ui.jsx';
import { getLocalIstDateString } from '../../shared/date.js';
import { listPrivateImages, savePrivateImage } from '../../shared/privateImageStore.js';

function validStrengthPrs(sessions) {
  const best = new Map();
  for (const session of sessions || []) {
    for (const set of session.sets || []) {
      const weight = Number(set.weightKg);
      if ((set.trackingType || '').toUpperCase() === 'W' || !Number.isFinite(weight) || weight <= 0 || weight > 500) continue;
      const key = (set.exerciseName || '').trim().toLowerCase();
      if (!key) continue;
      const existing = best.get(key);
      if (!existing || weight > existing.weightKg || (weight === existing.weightKg && set.reps > existing.reps)) {
        best.set(key, { exerciseName: set.exerciseName, weightKg: weight, reps: set.reps, achievedAt: set.workoutDate });
      }
    }
  }
  return [...best.values()];
}

function WeightChart({ data }) {
  if (!data?.length) return <ContentEmptyState section="progress" variant="weightTrend" />;
  const W = 320, H = 120, PAD = 24;
  const validData = data.filter(d => Number.isFinite(Number(d.weightKg)) && Number(d.weightKg) > 0);
  if (!validData.length) return <ContentEmptyState section="progress" variant="weightTrend" />;
  const vals = validData.map(d => Number(d.weightKg));
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const pts = vals.map((v, i) => {
    const x = PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - minV) / range) * (H - PAD * 2);
    return `${x},${y}`;
  }).join(' ');
  const area = `M${PAD},${H - PAD} ` + vals.map((v, i) => {
    const x = PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - minV) / range) * (H - PAD * 2);
    return `L${x},${y}`;
  }).join(' ') + ` L${W - PAD},${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wg)" />
      <polyline points={pts} fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Labels */}
      <text x={PAD} y={H - 4} fontSize="9" fill="#64748b">{validData[0]?.date?.slice(5)}</text>
      <text x={W - PAD} y={H - 4} fontSize="9" fill="#64748b" textAnchor="end">{validData[validData.length-1]?.date?.slice(5)}</text>
      <text x={PAD - 2} y={PAD + 4} fontSize="9" fill="#64748b" textAnchor="end">{maxV}</text>
      <text x={PAD - 2} y={H - PAD + 4} fontSize="9" fill="#64748b" textAnchor="end">{minV}</text>
    </svg>
  );
}

export default function ProgressPage() {
  const [weights, setWeights] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [privatePhotos, setPrivatePhotos] = useState([]);
  const [prs, setPrs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = React.useRef(null);
  const loadControllerRef = React.useRef(null);
  const privatePhotoUrlsRef = React.useRef([]);

  const load = useCallback(async () => {
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    setLoading(true);
    try {
      const [w, ph, p, a] = await Promise.allSettled([
        api(`/progress/weight?from=${getLocalIstDateString(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))}&to=${getLocalIstDateString()}`, { signal: controller.signal }),
        api('/progress/physique', { signal: controller.signal }),
        api('/workouts', { signal: controller.signal }),
        api('/progress/alerts', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (w.status === 'fulfilled') setWeights(w.value || []);
      if (ph.status === 'fulfilled') setPhotos(ph.value || []);
      if (p.status === 'fulfilled') setPrs(validStrengthPrs(p.value));
      if (a.status === 'fulfilled') setAlerts(a.value || []);
      try {
        const privateEntries = await listPrivateImages('physique');
        if (!controller.signal.aborted) {
          privatePhotoUrlsRef.current.push(...privateEntries.map(image => image.url));
          setPrivatePhotos(privateEntries);
        } else privateEntries.forEach(image => URL.revokeObjectURL(image.url));
      } catch (storageError) {
        if (!controller.signal.aborted) setError(storageError.message);
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => () => { loadControllerRef.current?.abort(); privatePhotoUrlsRef.current.forEach(URL.revokeObjectURL); }, [load]);
  useEffect(() => { load(); }, [load]);

  async function logWeight(e) {
    e.preventDefault();
    if (!weightInput) return;
    setSavingWeight(true);
    try {
      await api('/progress/weight', { method: 'POST', body: { weightKg: parseFloat(weightInput), date: getLocalIstDateString() } });
      setWeightInput('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingWeight(false);
    }
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      // Progress photos stay private on this device in IndexedDB; no raw image is uploaded.
      const entry = await savePrivateImage(file, 'physique');
      privatePhotoUrlsRef.current.push(entry.url);
      setPrivatePhotos(current => [entry, ...current]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  }

  const latestWeight = weights[weights.length - 1]?.weightKg;
  const firstWeight = weights[0]?.weightKg;
  const change = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null;
  const validPrs = prs;

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Spinner size={36} /></div>;

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">Progress</h1>
            <Badge color="teal">{weights.length} entries</Badge>
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {alerts.slice(0, 2).map((a, i) => (
        <div key={i} className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-xs flex items-center gap-2">
          <AlertCircle size={14} /> {a.message || a}
        </div>
      ))}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="text-center py-4">
          <p className="text-muted text-[10px] mb-1">Current</p>
          <p className="tab-num text-teal font-bold text-xl">{latestWeight ?? '—'}</p>
          <p className="text-muted text-[10px]">kg</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <p className="text-muted text-[10px] mb-1">Change</p>
          <p className={`tab-num font-bold text-xl ${change > 0 ? 'text-gold' : change < 0 ? 'text-teal' : 'text-white'}`}>
            {change !== null ? (change > 0 ? '+' : '') + change : '—'}
          </p>
          <p className="text-muted text-[10px]">kg</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <p className="text-muted text-[10px] mb-1">PRs <ScienceTooltip name="warmupVsWorkingSets" /></p>
          <p className="tab-num text-purple font-bold text-xl">{validPrs.length}</p>
          <p className="text-muted text-[10px]">records</p>
        </GlassCard>
      </div>

      {/* Weight Chart */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp size={16} className="text-teal" /> Weight Trend</h3>
        </div>
        <WeightChart data={weights} />
      </GlassCard>

      {/* Log Weight */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Scale size={16} className="text-teal" /> Log Weight</h3>
        <form onSubmit={logWeight} className="flex gap-2">
          <input
            type="number"
            step="0.1"
            min="30"
            max="250"
            placeholder="e.g. 72.5 kg"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <TealButton type="submit" disabled={savingWeight || !weightInput} className="px-6">
            {savingWeight ? <Spinner size={16} /> : 'Log'}
          </TealButton>
        </form>
      </GlassCard>

      {/* Body Scan / Photos */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2"><Camera size={16} className="text-purple" /> Body Scan Timeline</h3>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
            {uploadingPhoto ? <Spinner size={12} /> : <><Plus size={14} /> Add Photo</>}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} />
        </div>
        {photos.length === 0 && privatePhotos.length === 0 ? (
          <div className="text-center py-6">
            <Camera size={32} className="text-muted mx-auto mb-2" />
            <ContentEmptyState section="progress" variant="bodyScan" />
            <p className="text-muted text-xs mt-1">Add a photo to track your physical transformation.</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {photos.map((p, i) => (
                <div key={i} className="flex-shrink-0 w-24 rounded-xl overflow-hidden border border-white/10">
                {p.photoUrl ? <img src={p.photoUrl} alt="Private progress check-in" className="w-full aspect-square object-cover" /> : <div className="bg-white/5 aspect-square flex items-center justify-center"><Camera size={20} className="text-muted" /></div>}
                <p className="text-muted text-[10px] text-center py-1">{p.date || p.photoDate || p.logDate}</p>
              </div>
            ))}
          </div>
        )}
        {privatePhotos.length > 0 && <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">{privatePhotos.map(photo => <div key={photo.id} className="flex-shrink-0 w-24 rounded-xl overflow-hidden border border-white/10"><img src={photo.url} alt="Private body check-in stored on this device" className="w-full aspect-square object-cover"/><p className="text-muted text-[10px] text-center py-1">{photo.createdAt.slice(0, 10)} · private</p></div>)}</div>}
      </GlassCard>

      {/* PRs */}
      {validPrs.length > 0 && (
        <GlassCard>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Award size={16} className="text-gold" /> Personal Records</h3>
          <div className="space-y-2">
            {validPrs.slice(0, 5).map((pr, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-semibold">{pr.exerciseName}</p>
                <p className="text-muted text-xs">{pr.achievedAt?.slice(0, 10)}</p>
                </div>
                <Badge color="gold">{pr.weightKg}kg × {pr.reps}</Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

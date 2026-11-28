import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Utensils, Camera, Search, Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Droplets, Pencil, Copy, Download, Sparkles, Settings2, X, Check, AlertTriangle, ListPlus, Repeat,
} from 'lucide-react';
import { api, apiUpload } from '../../shared/api.js';
import { GlassCard, TealButton, GhostButton, Spinner, ErrorMsg, Badge, Chip, CircularProgress, ContentEmptyState } from '../../shared/ui.jsx';
import { getLocalIstDateString } from '../../shared/date.js';

const TABS = [
  ['today', 'Today · Aaj'],
  ['micros', 'Nutrients'],
  ['history', 'History'],
  ['scan', 'Scan'],
];

const MICRO_INPUTS = [
  ['sugar', 'Sugar (g)'], ['satFat', 'Saturated fat (g)'], ['sodium', 'Sodium (mg)'],
  ['potassium', 'Potassium (mg)'], ['calcium', 'Calcium (mg)'], ['iron', 'Iron (mg)'],
  ['magnesium', 'Magnesium (mg)'], ['zinc', 'Zinc (mg)'], ['phosphorus', 'Phosphorus (mg)'],
  ['vitaminA', 'Vitamin A (µg)'], ['vitaminC', 'Vitamin C (mg)'], ['vitaminD', 'Vitamin D (µg)'],
  ['vitaminB12', 'Vitamin B12 (µg)'], ['vitaminE', 'Vitamin E (mg)'], ['vitaminK', 'Vitamin K (µg)'],
  ['cholesterol', 'Cholesterol (mg)'], ['transFat', 'Trans fat (g)'],
];

const TARGET_FIELDS = [
  ['calories', 'Calories', 'kcal'], ['proteinG', 'Protein', 'g'], ['carbsG', 'Carbs', 'g'],
  ['fatG', 'Fat', 'g'], ['fiberG', 'Fiber', 'g'], ['waterMl', 'Water', 'ml'],
  ['sodiumMgMax', 'Sodium max', 'mg'], ['sugarGMax', 'Sugar max', 'g'],
];

const STATUS_META = {
  MET: { label: 'On target', color: 'teal' },
  ON_TRACK: { label: 'On track', color: 'teal' },
  BELOW: { label: 'Below target', color: 'gold' },
  OVER_LIMIT: { label: 'Above limit', color: 'red' },
  NO_DATA: { label: 'Data unavailable', color: 'muted' },
};

const fmt = (n, digits = 0) => {
  const v = Number(n || 0);
  return digits ? v.toFixed(digits).replace(/\.0$/, '') : String(Math.round(v));
};
// Local date math: toISOString() UTC me convert karta hai, jisse IST me din ek-ek skip ho jaata tha.
const toIsoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shiftDate = (iso, days) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
};
const dateLabel = (iso) => {
  const today = getLocalIstDateString();
  if (iso === today) return 'Aaj · Today';
  if (iso === shiftDate(today, -1)) return 'Kal · Yesterday';
  if (iso === shiftDate(today, 1)) return 'Kal (aage) · Tomorrow';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};
const titleCase = (s) => String(s || '').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());

function ProgressRow({ label, value, target, unit, inverse = false, hint }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = inverse && target > 0 && value > target;
  const remaining = target - value;
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-white/85 text-xs">{label}</p>
        <p className={`text-[11px] tab-num ${over ? 'text-orange-400' : 'text-muted'}`}>
          {fmt(value, 1)} / {fmt(target, target % 1 ? 1 : 0)} {unit}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden">
        <div className={`h-full rounded-full ${over ? 'bg-orange-400' : 'bg-teal'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-muted mt-0.5">
        {inverse
          ? (over ? `${fmt(value - target, 1)} ${unit} over limit` : `${fmt(Math.max(0, remaining), 1)} ${unit} left`)
          : (remaining > 0 ? `${fmt(remaining, remaining % 1 ? 1 : 0)} ${unit} remaining` : `Target achieved`)}
        {hint ? ` · ${hint}` : ''}
      </p>
    </div>
  );
}

export default function DietPage() {
  const [date, setDate] = useState(getLocalIstDateString());
  const [tab, setTab] = useState('today');
  const [diary, setDiary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [targets, setTargets] = useState(null);
  const [micros, setMicros] = useState([]);
  const [hydration, setHydration] = useState(null);
  const [mission, setMission] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openMeals, setOpenMeals] = useState({});

  // Add-food sheet
  const [addFor, setAddFor] = useState(null); // category name
  const [addTab, setAddTab] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pick, setPick] = useState(null);
  const [amount, setAmount] = useState({ mode: 'g', value: 100 });
  const [quick, setQuick] = useState({ name: '', calories: '', proteinG: '', carbsG: '', fatG: '', fiberG: '' });
  const [custom, setCustom] = useState({ name: '', defaultUnit: 'g', servingGrams: 100, calories: '', proteinG: '', carbsG: '', fatG: '', fiberG: '', micros: {} });
  const [foodEdit, setFoodEdit] = useState(null); // user ke apne custom food ka edit form

  // Meals + targets editors
  const [catEditor, setCatEditor] = useState(null); // {id?, name, timeLabel}
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState(null);
  const [dialog, setDialog] = useState(null); // in-app prompt/confirm (WebView me window.prompt kaam nahi karta)
  const sheetOpen = Boolean(addFor || categoriesOpen || targetsOpen || dialog);

  // Sheet khuli ho to peeche ka page scroll lock karo (phone par sheet ke saath page hilta tha).
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  // Scan
  const scanRef = useRef(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanNote, setScanNote] = useState('');
  const [scan, setScan] = useState(null);
  const [scanItems, setScanItems] = useState([]);
  const [scanCategory, setScanCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [d, c, t, m, h, f, ms] = await Promise.allSettled([
      api(`/nutrition/diary/${date}`),
      api('/nutrition/categories'),
      api('/nutrition/targets'),
      api(`/nutrition/micros/${date}`),
      api(`/nutrition/hydration/${date}`),
      api('/nutrition/favorites'),
      api('/nutrition/mission'),
    ]);
    if (d.status === 'fulfilled') setDiary(d.value);
    if (c.status === 'fulfilled') setCategories(Array.isArray(c.value) ? c.value : []);
    if (t.status === 'fulfilled') setTargets(t.value);
    if (m.status === 'fulfilled') setMicros(Array.isArray(m.value) ? m.value : []);
    if (h.status === 'fulfilled') setHydration(h.value);
    if (f.status === 'fulfilled') setFavorites(Array.isArray(f.value) ? f.value : []);
    if (ms.status === 'fulfilled') setMission(ms.value);
    const failed = [d, c, t].find(r => r.status === 'rejected');
    if (failed) setError(failed.reason?.message || 'Diet data could not load');
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const loadAnalytics = useCallback(async (days) => {
    try {
      const a = await api(`/nutrition/analytics?days=${days}`);
      setAnalytics(a);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    if (tab === 'history') loadAnalytics(analyticsDays);
  }, [tab, analyticsDays, loadAnalytics]);

  useEffect(() => {
    if (!categories.length) return;
    setScanCategory(prev => prev || categories[0].name);
  }, [categories]);

  const entries = diary?.entries || [];
  const byCategory = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      const key = String(e.mealCategory || '').toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return map;
  }, [entries]);

  const calTarget = Math.max(1, Number(targets?.calories || mission?.dailyCalorieBudget || 2000));
  const calEaten = Number(diary?.calories || 0);
  const calRemaining = calTarget - calEaten;
  const proteinT = Number(targets?.proteinG || 0);
  const fiberT = Number(targets?.fiberG || hydration?.fiberTargetG || 25);
  const waterT = Number(targets?.waterMl || hydration?.waterGoalMl || 2500);
  const water = Number(hydration?.waterMl || 0);
  const mealsDone = categories.filter(c => (byCategory.get(c.name.toLowerCase()) || []).length > 0).length;
  const adherence = calTarget > 0 ? Math.min(100, Math.round((Math.min(calEaten, calTarget) / calTarget) * 100)) : 0;
  const proteinPct = proteinT > 0 ? Math.min(100, Math.round((Number(diary?.proteinG || 0) / proteinT) * 100)) : 0;
  const score = Math.round((adherence + proteinPct + Math.min(100, (Number(diary?.fiberG || 0) / (fiberT || 25)) * 100)) / 3);

  async function run(fn) {
    setBusy(true);
    setError('');
    try { await fn(); } finally { setBusy(false); }
  }

  async function addDiaryEntry(payload) {
    await api('/nutrition/diary', { method: 'POST', body: { entryDate: date, ...payload } });
    await load();
  }

  async function searchFoods(q) {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const rows = await api(`/nutrition/foods?search=${encodeURIComponent(q)}`);
      setResults(Array.isArray(rows) ? rows.slice(0, 40) : []);
    } catch (e) { setError(e.message); } finally { setSearching(false); }
  }

  function gramsFor(food) {
    const serving = Number(food?.servingGrams) || 100;
    return amount.mode === 'g' ? Number(amount.value) || 0 : (Number(amount.value) || 0) * serving;
  }

  async function logPickedFood() {
    if (!pick) return;
    const mass = gramsFor(pick);
    if (mass <= 0) { setError('Quantity daalein · Enter a quantity'); return; }
    const factor = mass / 100;
    const micros = {};
    Object.entries(pick.micros || {}).forEach(([k, v]) => { if (Number(v)) micros[k] = Number(v) * factor; });
    await run(async () => {
      await addDiaryEntry({
        mealCategory: addFor,
        foodName: pick.name,
        quantity: amount.mode === 'g' ? Math.round(mass) : Number(amount.value),
        unit: amount.mode === 'g' ? 'g' : (pick.defaultUnit || 'serving'),
        preparationType: pick.preparationType || 'COOKED',
        calories: Number(pick.calories || 0) * factor,
        proteinG: Number(pick.proteinG || 0) * factor,
        carbsG: Number(pick.carbsG || 0) * factor,
        fatG: Number(pick.fatG || 0) * factor,
        fiberG: Number(pick.fiberG || 0) * factor,
        micros,
      });
      setPick(null);
      setAddFor(null);
    });
  }

  async function logQuick() {
    if (!quick.name.trim()) { setError('Food ka naam likhein'); return; }
    await run(async () => {
      await addDiaryEntry({
        mealCategory: addFor,
        foodName: quick.name.trim(),
        quantity: 1,
        unit: 'serving',
        preparationType: 'COOKED',
        calories: Number(quick.calories) || 0,
        proteinG: Number(quick.proteinG) || 0,
        carbsG: Number(quick.carbsG) || 0,
        fatG: Number(quick.fatG) || 0,
        fiberG: Number(quick.fiberG) || 0,
      });
      setQuick({ name: '', calories: '', proteinG: '', carbsG: '', fatG: '', fiberG: '' });
      setAddFor(null);
    });
  }

  async function saveCustomFood(alsoLog) {
    if (!custom.name.trim()) { setError('Food ka naam likhein'); return; }
    const micros = {};
    Object.entries(custom.micros || {}).forEach(([k, v]) => { if (Number(v)) micros[k] = Number(v); });
    await run(async () => {
      const saved = await api('/nutrition/foods/custom', {
        method: 'POST',
        body: {
          name: custom.name.trim(),
          calories: Number(custom.calories) || 0,
          proteinG: Number(custom.proteinG) || 0,
          carbsG: Number(custom.carbsG) || 0,
          fatG: Number(custom.fatG) || 0,
          fiberG: Number(custom.fiberG) || 0,
          defaultUnit: custom.defaultUnit || 'g',
          preparationType: 'COOKED',
          servingGrams: Number(custom.servingGrams) || 100,
          micros,
        },
      });
      if (alsoLog) {
        const factor = (Number(custom.servingGrams) || 100) / 100;
        await addDiaryEntry({
          mealCategory: addFor,
          foodName: saved.name,
          quantity: Number(custom.servingGrams) || 100,
          unit: 'g',
          preparationType: 'COOKED',
          calories: Number(saved.calories || 0) * factor,
          proteinG: Number(saved.proteinG || 0) * factor,
          carbsG: Number(saved.carbsG || 0) * factor,
          fatG: Number(saved.fatG || 0) * factor,
          fiberG: Number(saved.fiberG || 0) * factor,
          micros: Object.fromEntries(Object.entries(saved.micros || {}).map(([k, v]) => [k, Number(v) * factor])),
        });
      }
      setCustom({ name: '', defaultUnit: 'g', servingGrams: 100, calories: '', proteinG: '', carbsG: '', fatG: '', fiberG: '', micros: {} });
      if (alsoLog) setAddFor(null);
    });
  }

  async function saveFoodEdit() {
    if (!foodEdit?.name?.trim()) { setError('Food ka naam likhein'); return; }
    const micros = {};
    Object.entries(foodEdit.micros || {}).forEach(([k, v]) => { if (Number(v)) micros[k] = Number(v); });
    await run(async () => {
      const saved = await api(`/nutrition/foods/${foodEdit.id}`, {
        method: 'PUT',
        body: {
          name: foodEdit.name.trim(),
          calories: Number(foodEdit.calories) || 0,
          proteinG: Number(foodEdit.proteinG) || 0,
          carbsG: Number(foodEdit.carbsG) || 0,
          fatG: Number(foodEdit.fatG) || 0,
          fiberG: Number(foodEdit.fiberG) || 0,
          defaultUnit: foodEdit.defaultUnit || 'g',
          preparationType: 'COOKED',
          servingGrams: Number(foodEdit.servingGrams) || 100,
          micros,
        },
      });
      setFoodEdit(null);
      await searchFoods(saved.name);
    });
  }

  function deleteFood(food) {
    setDialog({
      mode: 'confirm',
      title: `"${food.name}" delete karein?`,
      message: 'Ye sirf aapka custom food library se hatega. Purane diary din apni values ke saath safe rehte hain.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => run(async () => {
        await api(`/nutrition/foods/${food.id}`, { method: 'DELETE' });
        await searchFoods(query || food.name);
      }),
    });
  }

  async function removeEntry(id) {
    await run(async () => {
      await api(`/nutrition/diary/${id}`, { method: 'DELETE' });
      await load();
    });
  }

  async function saveCategory() {
    if (!catEditor?.name?.trim()) { setError('Category ka naam likhein'); return; }
    await run(async () => {
      const body = { name: catEditor.name.trim(), timeLabel: catEditor.timeLabel || '', sortOrder: catEditor.sortOrder };
      if (catEditor.id) await api(`/nutrition/categories/${catEditor.id}`, { method: 'PUT', body });
      else await api('/nutrition/categories', { method: 'POST', body });
      setCatEditor(null);
      await load();
    });
  }

  async function deleteCategory(cat) {
    const target = categories.find(c => c.id !== cat.id);
    if (!target) { setError('Kam se kam ek meal category chahiye'); return; }
    setDialog({
      mode: 'confirm',
      title: `"${cat.name}" delete karein?`,
      message: `Iske foods "${target.name}" me move ho jayenge. History delete nahi hoti.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => run(async () => {
        await api(`/nutrition/categories/${cat.id}?moveTo=${target.id}`, { method: 'DELETE' });
        await load();
      }),
    });
  }

  async function moveCategory(cat, direction) {
    const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = ordered.findIndex(c => c.id === cat.id);
    const swap = ordered[idx + direction];
    if (!swap) return;
    ordered[idx] = swap;
    ordered[idx + direction] = cat;
    await run(async () => {
      await api('/nutrition/categories/reorder', { method: 'POST', body: { ids: ordered.map(c => c.id) } });
      await load();
    });
  }

  async function saveTargets() {
    if (!targetDraft) return;
    await run(async () => {
      const body = {};
      TARGET_FIELDS.forEach(([key]) => { body[key] = Number(targetDraft[key]) || 0; });
      body.micros = Object.fromEntries(Object.entries(targetDraft.micros || {}).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)]));
      const saved = await api('/nutrition/targets', { method: 'PUT', body });
      setTargets(saved);
      setTargetsOpen(false);
      const m = await api(`/nutrition/micros/${date}`);
      setMicros(Array.isArray(m) ? m : []);
    });
  }

  function copyMeal(cat) {
    setDialog({
      mode: 'prompt',
      title: `Copy "${cat}"`,
      label: 'Target meal ka naam likhein',
      value: cat,
      confirmLabel: 'Copy',
      onConfirm: async (targetCat) => {
        if (!targetCat?.trim()) return;
        await run(async () => {
          await api('/nutrition/diary/copy-meal', { method: 'POST', body: { fromDate: date, fromCategory: cat, toDate: date, toCategory: targetCat.trim() } });
          await load();
        });
      },
    });
  }

  function copyDay() {
    setDialog({
      mode: 'prompt',
      title: 'Copy day',
      label: `"${dateLabel(date)}" ka pura din kis date par copy karein? (YYYY-MM-DD)`,
      value: shiftDate(date, 1),
      confirmLabel: 'Copy',
      onConfirm: async (toDate) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate || '')) { setError('Date YYYY-MM-DD format me daalein'); return; }
        await run(async () => {
          await api('/nutrition/diary/copy-day', { method: 'POST', body: { fromDate: date, toDate } });
          setDate(toDate);
        });
      },
    });
  }

  async function saveFavoriteMeal(cat) {
    const items = (byCategory.get(cat.toLowerCase()) || []).map(e => ({
      foodName: e.foodName, quantity: e.quantity, unit: e.unit, preparationType: e.preparationType,
      calories: e.calories, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG, fiberG: e.fiberG,
    }));
    if (!items.length) { setError('Is meal me kuch nahi hai'); return; }
    await run(async () => {
      await api('/nutrition/favorites', { method: 'POST', body: { mealName: `${cat} (${date})`, items } });
      const f = await api('/nutrition/favorites');
      setFavorites(Array.isArray(f) ? f : []);
    });
  }

  async function logFavorite(fav, category) {
    await run(async () => {
      await api(`/nutrition/favorites/${fav.id}/log?date=${date}&mealCategory=${encodeURIComponent(category)}`, { method: 'POST' });
      await load();
    });
  }

  async function addWater(ml) {
    const next = Math.max(0, water + ml);
    await run(async () => {
      const saved = await api(`/nutrition/hydration/${date}`, { method: 'POST', body: { waterMl: next, waterGoalMl: Math.round(waterT), fiberTargetG: fiberT } });
      setHydration(saved);
    });
  }

  async function runScan(file) {
    const form = new FormData();
    form.append('image', file);
    setScanLoading(true);
    setScan(null);
    setError('');
    try {
      const res = await apiUpload('/ai/meal-scan/upload', { file, timeoutMs: 60000, fields: scanNote.trim() ? { prompt: scanNote.trim() } : undefined });
      setScan(res);
      const items = (res.items || []).map(it => ({ ...it, grams: Number(it.quantityG) || 100, include: true }));
      setScanItems(items);
    } catch (e) {
      setError(`${e.message} — Camera scan ke liye AI key configured honi chahiye.`);
    } finally {
      setScanLoading(false);
    }
  }

  async function confirmScan() {
    const chosen = scanItems.filter(i => i.include && i.grams > 0);
    if (!chosen.length) { setError('Koi item select karein'); return; }
    await run(async () => {
      for (const item of chosen) {
        const base = Number(item.quantityG) || item.grams;
        const factor = base > 0 ? item.grams / base : 1;
        await addDiaryEntry({
          mealCategory: scanCategory || categories[0]?.name || 'Lunch',
          foodName: item.foodName,
          quantity: Math.round(item.grams),
          unit: 'g',
          preparationType: 'COOKED',
          calories: Number(item.calories || 0) * factor,
          proteinG: Number(item.proteinG || 0) * factor,
          carbsG: Number(item.carbsG || 0) * factor,
          fatG: Number(item.fatG || 0) * factor,
          fiberG: Number(item.fiberG || 0) * factor,
          scanConfidence: Number.isFinite(Number(item.confidencePercent)) ? Number(item.confidencePercent) / 100 : null,
        });
      }
      setScan(null);
      setScanItems([]);
      setTab('today');
      await load();
    });
  }

  function exportCsv() {
    if (!analytics?.dailyBreakdown?.length) return;
    const rows = [['Date', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)', 'Calorie target met', 'Protein target met']];
    analytics.dailyBreakdown.forEach(d => rows.push([d.date, d.calories, d.proteinG, d.carbsG, d.fatG, d.fiberG, d.calorieTargetMet, d.proteinTargetMet]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrition-${analytics.startDate}-to-${analytics.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Spinner size={36} /></div>;

  // Sheets ko body me portal karo: page root par animate-fade-in ka transform hai, jo
  // position:fixed ko page ke andar bound kar deta tha aur sheet bottom nav ke neeche chhup jaati thi.
  // z-[70]: fixed bottom nav (z-50) ke upar. max-h dvh + safe-area padding: keyboard ke saath scroll ho kar sab fields milte hain.
  const sheet = (content) => createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70" onClick={e => { if (e.target === e.currentTarget) content.onClose?.(); }}>
      <div className="w-full max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-teal/25 p-4 pb-[calc(20px+var(--safe-bottom))] space-y-3" style={{ background: '#0b1220' }} onClick={e => e.stopPropagation()}>
        {content.body}
      </div>
    </div>,
    document.body,
  );

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Utensils size={22} className="text-teal" /> Diet</h1>
          <p className="text-muted text-[11px]">Khana, macros aur micronutrients — sab yahin</p>
        </div>
        <button onClick={() => { setTargetDraft({ ...targets, micros: targets?.micros || {} }); setTargetsOpen(true); }} className="px-2.5 py-1.5 rounded-lg bg-teal/10 border border-teal/20 text-teal text-[11px] flex items-center gap-1">
          <Settings2 size={12} /> Targets
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><ChevronLeft size={15} className="text-muted" /></button>
        <div className="flex-1 text-center">
          <p className="text-white text-sm font-semibold">{dateLabel(date)}</p>
          <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} className="bg-transparent text-muted text-[11px] text-center outline-none" />
        </div>
        <button onClick={() => setDate(shiftDate(date, 1))} aria-label="Next day" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><ChevronRight size={15} className="text-muted" /></button>
        <button onClick={() => setDate(getLocalIstDateString())} className="px-2 py-1.5 rounded-lg border border-white/10 text-[11px] text-white/80">Aaj</button>
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map(([key, label]) => <Chip key={key} label={label} active={tab === key} onClick={() => setTab(key)} />)}
      </div>

      {tab === 'today' && (
        <>
          <GlassCard accent={calRemaining < 0 ? 'red' : 'teal'}>
            <div className="flex items-center gap-4">
              <CircularProgress value={Math.min(calEaten, calTarget)} max={calTarget} size={84} strokeWidth={6} color={calRemaining < 0 ? '#fb923c' : '#2dd4bf'}>
                <div className="text-center">
                  <p className="tab-num text-teal font-bold text-sm">{fmt(calEaten)}</p>
                  <p className="text-muted text-[9px]">kcal</p>
                </div>
              </CircularProgress>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-white text-sm font-semibold">Calories</p>
                  <p className="text-muted text-[11px]">Target {fmt(calTarget)}</p>
                </div>
                {calRemaining >= 0 ? (
                  <p className="text-teal text-xs mt-0.5">{fmt(calRemaining)} kcal remaining</p>
                ) : (
                  <p className="text-orange-400 text-xs mt-0.5 flex items-center gap-1"><AlertTriangle size={12} /> {fmt(-calRemaining)} kcal over target</p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-muted text-[10px]">Protein</p>
                    <p className="text-white text-xs font-semibold">{fmt(diary?.proteinG, 1)} / {fmt(proteinT)} g</p>
                  </div>
                  <div>
                    <p className="text-muted text-[10px]">Fiber</p>
                    <p className="text-white text-xs font-semibold">{fmt(diary?.fiberG, 1)} / {fmt(fiberT)} g</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-0.5">
              <ProgressRow label="Protein" value={Number(diary?.proteinG || 0)} target={proteinT} unit="g" />
              <ProgressRow label="Carbs" value={Number(diary?.carbsG || 0)} target={Number(targets?.carbsG || 0)} unit="g" />
              <ProgressRow label="Fat" value={Number(diary?.fatG || 0)} target={Number(targets?.fatG || 0)} unit="g" />
              <ProgressRow label="Fiber" value={Number(diary?.fiberG || 0)} target={fiberT} unit="g" />
              <ProgressRow label="Sugar" value={Number(diary?.sugarG || 0)} target={Number(targets?.sugarGMax || 50)} unit="g" inverse />
              <ProgressRow label="Sodium" value={Number(diary?.sodiumMg || 0)} target={Number(targets?.sodiumMgMax || 2300)} unit="mg" inverse />
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <Droplets size={16} className="text-teal" />
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">Water · {fmt(water)} / {fmt(waterT)} ml</p>
                <div className="h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden">
                  <div className="h-full bg-teal rounded-full" style={{ width: `${Math.min(100, (water / (waterT || 1)) * 100)}%` }} />
                </div>
              </div>
              <button onClick={() => addWater(250)} className="px-2 py-1 rounded-lg bg-teal/10 border border-teal/20 text-teal text-[11px]">+250</button>
              <button onClick={() => addWater(500)} className="px-2 py-1 rounded-lg bg-teal/10 border border-teal/20 text-teal text-[11px]">+500</button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <p className="text-teal tab-num text-lg font-bold">{mealsDone}/{categories.length || 0}</p>
                <p className="text-muted text-[10px]">Meals done</p>
              </div>
              <div className="text-center">
                <p className="text-teal tab-num text-lg font-bold">{adherence}%</p>
                <p className="text-muted text-[10px]">Adherence</p>
              </div>
              <div className="text-center">
                <p className="text-teal tab-num text-lg font-bold">{score}</p>
                <p className="text-muted text-[10px]">Diet score</p>
              </div>
            </div>
          </GlassCard>

          <div className="flex gap-2">
            <GhostButton onClick={() => setCategoriesOpen(true)} className="flex-1 text-xs py-2 flex items-center justify-center gap-1"><ListPlus size={13} /> Meals</GhostButton>
            <GhostButton onClick={copyDay} className="flex-1 text-xs py-2 flex items-center justify-center gap-1"><Repeat size={13} /> Copy day</GhostButton>
            <GhostButton onClick={() => setTab('scan')} className="flex-1 text-xs py-2 flex items-center justify-center gap-1"><Camera size={13} /> Scan</GhostButton>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted"><ContentEmptyState section="diet" onAction={() => setCategoriesOpen(true)} /></div>
          ) : categories.map(cat => {
            const items = byCategory.get(cat.name.toLowerCase()) || [];
            const kcal = items.reduce((s, e) => s + Number(e.calories || 0), 0);
            const open = openMeals[cat.id] ?? items.length > 0;
            return (
              <GlassCard key={cat.id}>
                <div className="flex items-center gap-2">
                  <button onClick={() => setOpenMeals(o => ({ ...o, [cat.id]: !open }))} className="flex-1 flex items-center gap-2 text-left">
                    {open ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{titleCase(cat.name)}</p>
                      <p className="text-muted text-[10px]">{cat.timeLabel ? `${cat.timeLabel} · ` : ''}{items.length} item{items.length === 1 ? '' : 's'} · {fmt(kcal)} kcal</p>
                    </div>
                  </button>
                  <button onClick={() => { setAddFor(cat.name); setAddTab('search'); setPick(null); setResults([]); }} aria-label={`Add food to ${cat.name}`} className="w-7 h-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center"><Plus size={12} className="text-teal" /></button>
                </div>

                {open && (
                  <div className="mt-2">
                    {items.length === 0 && <p className="text-muted text-[11px] py-1">Kuch add karo — search, quick macros ya photo scan.</p>}
                    {items.map(e => (
                      <div key={e.id} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{e.foodName}</p>
                          <p className="text-muted text-[10px]">
                            {fmt(e.quantity, e.quantity % 1 ? 1 : 0)} {e.unit} · {fmt(e.calories)} kcal · P {fmt(e.proteinG, 1)} · C {fmt(e.carbsG, 1)} · F {fmt(e.fatG, 1)}
                            {e.scanConfidence ? ` · AI ${Math.round(Number(e.scanConfidence) * 100)}%` : ''}
                          </p>
                        </div>
                        <button onClick={() => removeEntry(e.id)} aria-label={`Delete ${e.foodName}`} className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Trash2 size={11} className="text-muted" /></button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <GhostButton onClick={() => copyMeal(cat.name)} className="text-[10px] py-1 px-2 flex items-center gap-1"><Copy size={10} /> Copy</GhostButton>
                      <GhostButton onClick={() => saveFavoriteMeal(cat.name)} className="text-[10px] py-1 px-2">Save as template</GhostButton>
                      <GhostButton onClick={() => deleteCategory(cat)} className="text-[10px] py-1 px-2 text-red-300/80">Delete</GhostButton>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}

          {favorites.length > 0 && (
            <GlassCard>
              <p className="text-white text-xs font-semibold mb-2 flex items-center gap-1"><Sparkles size={13} className="text-teal" /> Saved meals · Templates</p>
              <div className="space-y-1">
                {favorites.map(f => (
                  <div key={f.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/85 text-xs truncate">{f.mealName}</p>
                      <p className="text-muted text-[10px]">{f.totalCalories} kcal · P {fmt(f.totalProteinG, 1)}</p>
                    </div>
                    <button onClick={() => logFavorite(f, categories[0]?.name || 'Lunch')} className="px-2 py-1 rounded-lg bg-teal/10 border border-teal/20 text-teal text-[10px]">Log</button>
                    <button onClick={() => run(async () => { await api(`/nutrition/favorites/${f.id}`, { method: 'DELETE' }); const next = await api('/nutrition/favorites'); setFavorites(Array.isArray(next) ? next : []); })} aria-label="Delete template" className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Trash2 size={10} className="text-muted" /></button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </>
      )}

      {tab === 'micros' && (
        <>
          <GlassCard>
            <p className="text-white text-sm font-semibold mb-1">Vitamins & minerals</p>
            <p className="text-muted text-[11px] mb-2">{dateLabel(date)} · "Data unavailable" ka matlab hai us food ka data nahi mila, zero nahi.</p>
            <div className="space-y-0.5">
              {micros.map(m => {
                const meta = STATUS_META[m.status] || STATUS_META.NO_DATA;
                return (
                  <div key={m.code} className="py-1.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white/85 text-xs">{m.name}</p>
                      <Badge color={meta.color}>{meta.label}</Badge>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-muted text-[10px]">{m.hasData ? `${fmt(m.consumed, 1)} / ${fmt(m.target, 0)} ${m.unit}` : 'Data unavailable'}</p>
                      <p className="text-muted text-[10px]">{m.hasData ? `${fmt(m.percent, 0)}%` : ''}</p>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                      <div className={`h-full ${m.status === 'OVER_LIMIT' ? 'bg-orange-400' : 'bg-teal'}`} style={{ width: `${Math.min(100, m.percent)}%` }} />
                    </div>
                  </div>
                );
              })}
              {micros.length === 0 && <p className="text-muted text-xs py-3">Micronutrient data load nahi hua.</p>}
            </div>
          </GlassCard>
        </>
      )}

      {tab === 'history' && (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[7, 30, 90, 180].map(d => <Chip key={d} label={d === 180 ? '6 months' : `${d} days`} active={analyticsDays === d} onClick={() => setAnalyticsDays(d)} />)}
          </div>

          {!analytics ? <div className="flex justify-center py-10"><Spinner size={26} /></div> : (
            <>
              <GlassCard>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white text-sm font-semibold">Average per day</p>
                  <button onClick={exportCsv} className="px-2 py-1 rounded-lg bg-teal/10 border border-teal/20 text-teal text-[10px] flex items-center gap-1"><Download size={10} /> CSV</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[['Calories', analytics.averageCalories, 'kcal'], ['Protein', analytics.averageProteinG, 'g'], ['Carbs', analytics.averageCarbsG, 'g'], ['Fat', analytics.averageFatG, 'g'], ['Fiber', analytics.averageFiberG, 'g'], ['Consistency', analytics.consistencyScore, '%']].map(([label, val, unit]) => (
                    <div key={label} className="text-center">
                      <p className="text-teal tab-num text-lg font-bold">{fmt(val, unit === '%' ? 0 : 1)}</p>
                      <p className="text-muted text-[10px]">{label} ({unit})</p>
                    </div>
                  ))}
                </div>
                <p className="text-muted text-[10px] mt-2">{analytics.startDate} → {analytics.endDate} · {analytics.missedTargets?.length || 0} days missed a target</p>
              </GlassCard>

              <GlassCard>
                <p className="text-white text-xs font-semibold mb-2">Daily calories</p>
                <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
                  <div className="flex items-end gap-1 h-24" style={{ minWidth: `${Math.min(60, (analytics.dailyBreakdown || []).length) * 7}px` }}>
                    {(analytics.dailyBreakdown || []).slice(-60).map(d => {
                      const max = Math.max(calTarget, ...analytics.dailyBreakdown.map(x => x.calories || 0), 1);
                      const h = Math.max(2, Math.round(((d.calories || 0) / max) * 100));
                      return <div key={d.date} title={`${d.date}: ${fmt(d.calories)} kcal`} className={`w-1.5 shrink-0 rounded-t ${d.calories > calTarget ? 'bg-orange-400' : 'bg-teal/70'}`} style={{ height: `${h}%` }} />;
                    })}
                  </div>
                </div>
                <p className="text-muted text-[10px] mt-1">Orange = target se upar · graph side me scroll hota hai</p>
              </GlassCard>

              <GlassCard>
                <p className="text-white text-xs font-semibold mb-1">Day by day</p>
                <div className="max-h-64 overflow-y-auto">
                  {[...(analytics.dailyBreakdown || [])].reverse().map(d => (
                    <button key={d.date} onClick={() => { setDate(d.date); setTab('today'); }} className="w-full flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0 text-left">
                      <span className="text-muted text-[11px] w-24">{d.date}</span>
                      <span className="text-white/85 text-[11px] flex-1">{fmt(d.calories)} kcal · P {fmt(d.proteinG)}</span>
                      <span className={`text-[10px] ${d.calorieTargetMet ? 'text-teal' : 'text-orange-400'}`}>{d.calorieTargetMet ? 'On target' : 'Off target'}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </>
          )}
        </>
      )}

      {tab === 'scan' && (
        <>
          <GlassCard accent="teal">
            <p className="text-white text-sm font-semibold flex items-center gap-2"><Camera size={15} className="text-teal" /> AI Meal Scan</p>
            <p className="text-muted text-[11px] mt-1">
              Photo se AI alag-alag food items nikalega. Quantity photo se exact nahi hoti — isliye save se pehle grams confirm karo. Hidden oil/ghee AI guess karta hai, isliye values estimate hain.
            </p>
            <input
              ref={scanRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) runScan(f); e.target.value = ''; }}
            />
            <div className="flex gap-2 mt-3">
              <TealButton onClick={() => scanRef.current?.click()} disabled={scanLoading} className="flex-1 text-xs py-2">
                {scanLoading ? <><Spinner size={12} /> Analysing…</> : 'Photo lo / upload karo'}
              </TealButton>
            </div>
            <input
              value={scanNote}
              onChange={e => setScanNote(e.target.value)}
              placeholder="Optional note: '2 chapati, extra oil'"
              className="w-full mt-2 px-3 py-2 rounded-lg text-white text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </GlassCard>

          {scan && (
            <GlassCard>
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold flex-1">{scan.name || 'Meal'}</p>
                {scan.isFood === false && <Badge color="red">Not food</Badge>}
                <Badge color="muted">{Math.round(Number(scan.confidencePercent) || 0)}% identity</Badge>
              </div>
              {scan.description && <p className="text-muted text-[11px] mt-1">{scan.description}</p>}
              <p className="text-[10px] text-orange-300/80 mt-1">{scan.uncertaintyNote || 'Portion estimates need your confirmation.'}</p>

              <div className="mt-2 space-y-2">
                {scanItems.map((item, i) => (
                  <div key={i} className="p-2 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.include}
                        onChange={e => setScanItems(list => list.map((x, idx) => idx === i ? { ...x, include: e.target.checked } : x))}
                        aria-label={`Include ${item.foodName}`}
                      />
                      <p className="text-white text-xs font-semibold flex-1 truncate">{item.foodName}</p>
                      <Badge color={Number(item.confidencePercent) >= 70 ? 'teal' : 'gold'}>{Math.round(Number(item.confidencePercent) || 0)}%</Badge>
                    </div>
                    <p className="text-muted text-[10px] mt-0.5">{item.estimatedServingSize} · {fmt(item.calories)} kcal · P {fmt(item.proteinG, 1)} C {fmt(item.carbsG, 1)} F {fmt(item.fatG, 1)}</p>
                    {item.uncertaintyNote && <p className="text-[10px] text-orange-300/70">{item.uncertaintyNote}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-muted text-[10px]">Portion</span>
                      <input
                        type="number"
                        value={item.grams}
                        min="1"
                        onChange={e => setScanItems(list => list.map((x, idx) => idx === i ? { ...x, grams: Number(e.target.value) || 0 } : x))}
                        className="w-20 px-2 py-1 rounded-lg text-white text-xs text-center outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <span className="text-muted text-[10px]">g</span>
                      {[50, 100, 150, 200].map(g => (
                        <button key={g} onClick={() => setScanItems(list => list.map((x, idx) => idx === i ? { ...x, grams: g } : x))} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/70">{g}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className="text-muted text-[11px]">Meal</span>
                <select
                  value={scanCategory}
                  onChange={e => setScanCategory(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-white text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {categories.map(c => <option key={c.id} value={c.name} style={{ background: '#0b1220' }}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <TealButton onClick={confirmScan} disabled={busy} className="flex-1 text-xs py-2"><Check size={12} /> Confirm & save</TealButton>
                <GhostButton onClick={() => { setScan(null); setScanItems([]); }} className="text-xs py-2 px-3">Discard</GhostButton>
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* Add food sheet */}
      {addFor && sheet({
        onClose: () => setAddFor(null),
        body: (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">Add food</p>
                <p className="text-muted text-[11px]">{titleCase(addFor)} · {dateLabel(date)}</p>
              </div>
              <button onClick={() => setAddFor(null)} aria-label="Close" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><X size={13} className="text-muted" /></button>
            </div>

            <div className="flex gap-2">
              {[['search', 'Search'], ['quick', 'Quick macros'], ['custom', 'New food']].map(([k, l]) => (
                <Chip key={k} label={l} active={addTab === k} onClick={() => setAddTab(k)} />
              ))}
            </div>

            {addTab === 'search' && (
              <>
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchFoods(query)}
                    placeholder="dal, roti, paneer, leg press…"
                    className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <TealButton onClick={() => searchFoods(query)} disabled={searching} className="px-3">{searching ? <Spinner size={12} /> : <Search size={14} />}</TealButton>
                </div>

                {pick ? (
                  <div className="p-3 rounded-xl border border-teal/25 bg-teal/5 space-y-2">
                    <p className="text-white text-sm font-semibold">{pick.name}</p>
                    <p className="text-muted text-[11px]">{fmt(pick.calories)} kcal / 100 g · P {fmt(pick.proteinG, 1)} C {fmt(pick.carbsG, 1)} F {fmt(pick.fatG, 1)} · serving {fmt(pick.servingGrams)} g</p>
                    <div className="flex gap-2">
                      {[['g', 'Grams'], ['serving', pick.defaultUnit || 'serving']].map(([m, l]) => (
                        <Chip key={m} label={l} active={amount.mode === m} onClick={() => setAmount({ mode: m, value: m === 'g' ? 100 : 1 })} />
                      ))}
                    </div>
                    <input
                      type="number"
                      value={amount.value}
                      min="1"
                      onChange={e => setAmount(a => ({ ...a, value: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm text-center outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <p className="text-teal text-xs text-center">
                      {fmt(Number(pick.calories) * gramsFor(pick) / 100)} kcal · P {fmt(Number(pick.proteinG) * gramsFor(pick) / 100, 1)} C {fmt(Number(pick.carbsG) * gramsFor(pick) / 100, 1)} F {fmt(Number(pick.fatG) * gramsFor(pick) / 100, 1)}
                    </p>
                    <div className="flex gap-2">
                      <TealButton onClick={logPickedFood} disabled={busy} className="flex-1 text-xs py-2">Add</TealButton>
                      <GhostButton onClick={() => setPick(null)} className="text-xs py-2 px-3">Back</GhostButton>
                    </div>
                  </div>
                ) : foodEdit ? (
                  <div className="p-3 rounded-xl border border-teal/25 bg-teal/5 space-y-2">
                    <p className="text-white text-sm font-semibold">Edit custom food</p>
                    <input
                      value={foodEdit.name}
                      onChange={e => setFoodEdit(f => ({ ...f, name: e.target.value }))}
                      placeholder="Food name"
                      className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {[['defaultUnit', 'Serving unit'], ['servingGrams', 'Serving grams'], ['calories', 'Calories / serving'], ['proteinG', 'Protein g'], ['carbsG', 'Carbs g'], ['fatG', 'Fat g'], ['fiberG', 'Fiber g']].map(([k, l]) => (
                        <label key={k} className="block">
                          <span className="text-muted text-[10px]">{l}</span>
                          <input
                            value={foodEdit[k] ?? ''}
                            onChange={e => setFoodEdit(f => ({ ...f, [k]: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded-lg text-white text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        </label>
                      ))}
                    </div>
                    <details className="rounded-lg border border-white/10 p-2">
                      <summary className="text-muted text-[11px] cursor-pointer">Micronutrients (optional)</summary>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {MICRO_INPUTS.map(([k, l]) => (
                          <label key={k} className="block">
                            <span className="text-muted text-[10px]">{l}</span>
                            <input
                              value={foodEdit.micros?.[k] ?? ''}
                              onChange={e => setFoodEdit(f => ({ ...f, micros: { ...(f.micros || {}), [k]: e.target.value } }))}
                              className="w-full px-2 py-1.5 rounded-lg text-white text-sm outline-none"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                          </label>
                        ))}
                      </div>
                    </details>
                    <div className="flex gap-2">
                      <TealButton onClick={saveFoodEdit} disabled={busy} className="flex-1 text-xs py-2">Save changes</TealButton>
                      <GhostButton onClick={() => setFoodEdit(null)} className="text-xs py-2 px-3">Cancel</GhostButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {results.map(food => (
                      <div key={food.id} className="flex items-center gap-1 p-2 rounded-lg bg-white/5">
                        <button onClick={() => { setPick(food); setAmount({ mode: 'g', value: Number(food.servingGrams) || 100 }); }} className="flex-1 flex items-center gap-2 text-left min-w-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{food.name}{food.isCustom ? ' · custom' : ''}</p>
                            <p className="text-muted text-[10px]">{fmt(food.calories)} kcal/100g · P {fmt(food.proteinG, 1)} · {food.preparationType.toLowerCase()}</p>
                          </div>
                          <Plus size={12} className="text-teal shrink-0" />
                        </button>
                        {food.isCustom && (
                          <>
                            <button
                              onClick={() => setFoodEdit({ id: food.id, name: food.name, defaultUnit: food.defaultUnit || 'g', servingGrams: food.servingGrams, calories: food.calories, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG, fiberG: food.fiberG, micros: food.micros || {} })}
                              aria-label={`Edit ${food.name}`}
                              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0"
                            ><Pencil size={11} className="text-muted" /></button>
                            <button
                              onClick={() => deleteFood(food)}
                              aria-label={`Delete ${food.name}`}
                              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0"
                            ><Trash2 size={11} className="text-red-300/80" /></button>
                          </>
                        )}
                      </div>
                    ))}
                    {results.length === 0 && <p className="text-muted text-xs py-3 text-center">Search karo (e.g. "dal", "chicken") ya naya food banao.</p>}
                  </div>
                )}
              </>
            )}

            {addTab === 'quick' && (
              <div className="space-y-2">
                <p className="text-muted text-[11px]">Jab exact food na mile — seedha calories/macros daalo.</p>
                <input value={quick.name} onChange={e => setQuick({ ...quick, name: e.target.value })} placeholder="Food name" className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <div className="grid grid-cols-3 gap-2">
                  {[['calories', 'Calories'], ['proteinG', 'Protein'], ['carbsG', 'Carbs'], ['fatG', 'Fat'], ['fiberG', 'Fiber']].map(([k, l]) => (
                    <label key={k} className="block">
                      <span className="text-muted text-[10px]">{l}</span>
                      <input type="number" value={quick[k]} onChange={e => setQuick({ ...quick, [k]: e.target.value })} className="w-full px-2 py-1.5 rounded-lg text-white text-sm text-center outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </label>
                  ))}
                </div>
                <TealButton onClick={logQuick} disabled={busy} className="w-full text-xs py-2">Add quick entry</TealButton>
              </div>
            )}

            {addTab === 'custom' && (
              <div className="space-y-2">
                <input value={custom.name} onChange={e => setCustom({ ...custom, name: e.target.value })} placeholder="Food name (e.g. Ghar ka paneer sabzi)" className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <div className="grid grid-cols-2 gap-2">
                  {[['defaultUnit', 'Serving unit'], ['servingGrams', 'Serving grams'], ['calories', 'Calories / serving'], ['proteinG', 'Protein g'], ['carbsG', 'Carbs g'], ['fatG', 'Fat g'], ['fiberG', 'Fiber g']].map(([k, l]) => (
                    <label key={k} className="block">
                      <span className="text-muted text-[10px]">{l}</span>
                      <input value={custom[k]} onChange={e => setCustom({ ...custom, [k]: e.target.value })} className="w-full px-2 py-1.5 rounded-lg text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </label>
                  ))}
                </div>
                <details className="rounded-lg border border-white/10 p-2">
                  <summary className="text-muted text-[11px] cursor-pointer">Micronutrients (optional)</summary>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {MICRO_INPUTS.map(([k, l]) => (
                      <label key={k} className="block">
                        <span className="text-muted text-[10px]">{l}</span>
                        <input
                          value={custom.micros?.[k] || ''}
                          onChange={e => setCustom({ ...custom, micros: { ...custom.micros, [k]: e.target.value } })}
                          className="w-full px-2 py-1.5 rounded-lg text-white text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </label>
                    ))}
                  </div>
                </details>
                <div className="flex gap-2">
                  <TealButton onClick={() => saveCustomFood(true)} disabled={busy} className="flex-1 text-xs py-2">Save & add now</TealButton>
                  <GhostButton onClick={() => saveCustomFood(false)} className="text-xs py-2 px-3">Save only</GhostButton>
                </div>
              </div>
            )}
          </>
        ),
      })}

      {/* In-app prompt / confirm (Android WebView me window.prompt/confirm reliable nahi hote) */}
      {dialog && sheet({
        onClose: () => setDialog(null),
        body: (
          <>
            <p className="text-white font-bold">{dialog.title}</p>
            {dialog.message && <p className="text-muted text-xs">{dialog.message}</p>}
            {dialog.mode === 'prompt' && (
              <>
                {dialog.label && <p className="text-muted text-[11px]">{dialog.label}</p>}
                <input
                  autoFocus
                  value={dialog.value || ''}
                  onChange={e => setDialog(d => ({ ...d, value: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </>
            )}
            <div className="flex gap-2">
              <TealButton
                onClick={() => { const d = dialog; setDialog(null); d.onConfirm?.(d.value); }}
                className={`flex-1 text-xs py-2 ${dialog.danger ? '!bg-red-500 !text-white' : ''}`}
              >
                {dialog.confirmLabel || 'OK'}
              </TealButton>
              <GhostButton onClick={() => setDialog(null)} className="text-xs py-2 px-3">Cancel</GhostButton>
            </div>
          </>
        ),
      })}

      {/* Meal categories manager */}
      {categoriesOpen && sheet({
        onClose: () => setCategoriesOpen(false),
        body: (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">Meal categories</p>
                <p className="text-muted text-[11px]">Apne meals banao, rename/reorder/delete karo</p>
              </div>
              <button onClick={() => setCategoriesOpen(false)} aria-label="Close" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><X size={13} className="text-muted" /></button>
            </div>

            <div className="space-y-1">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{cat.name}</p>
                    <p className="text-muted text-[10px]">{cat.timeLabel || 'no time'} · {cat.isDefault ? 'default' : 'custom'}</p>
                  </div>
                  <button onClick={() => moveCategory(cat, -1)} disabled={idx === 0} aria-label="Move up" className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-30"><ChevronUp size={11} className="text-muted" /></button>
                  <button onClick={() => moveCategory(cat, 1)} disabled={idx === categories.length - 1} aria-label="Move down" className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-30"><ChevronDown size={11} className="text-muted" /></button>
                  <button onClick={() => setCatEditor({ id: cat.id, name: cat.name, timeLabel: cat.timeLabel || '', sortOrder: cat.sortOrder })} aria-label={`Edit ${cat.name}`} className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Pencil size={10} className="text-muted" /></button>
                  <button onClick={() => deleteCategory(cat)} aria-label={`Delete ${cat.name}`} className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Trash2 size={10} className="text-red-300/80" /></button>
                </div>
              ))}
            </div>

            <div className="p-2 rounded-lg border border-dashed border-teal/30 space-y-2">
              <p className="text-teal text-[11px] font-semibold">{catEditor?.id ? 'Edit category' : 'New category'}</p>
              <input value={catEditor?.name || ''} onChange={e => setCatEditor({ ...(catEditor || {}), name: e.target.value })} placeholder="Name (e.g. Office Snacks)" className="w-full px-2 py-1.5 rounded-lg text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input value={catEditor?.timeLabel || ''} onChange={e => setCatEditor({ ...(catEditor || {}), timeLabel: e.target.value })} placeholder="Time (e.g. 16:30)" className="w-full px-2 py-1.5 rounded-lg text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div className="flex gap-2">
                <TealButton onClick={saveCategory} disabled={busy} className="flex-1 text-xs py-2">{catEditor?.id ? 'Update' : 'Add category'}</TealButton>
                {catEditor?.id && <GhostButton onClick={() => setCatEditor(null)} className="text-xs py-2 px-3">Cancel</GhostButton>}
              </div>
            </div>
          </>
        ),
      })}

      {/* Targets editor */}
      {targetsOpen && targetDraft && sheet({
        onClose: () => setTargetsOpen(false),
        body: (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">Daily targets</p>
                <p className="text-muted text-[11px]">Apne hisaab se set karo — ye prescription nahi hai</p>
              </div>
              <button onClick={() => setTargetsOpen(false)} aria-label="Close" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><X size={13} className="text-muted" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TARGET_FIELDS.map(([k, l, unit]) => (
                <label key={k} className="block">
                  <span className="text-muted text-[10px]">{l} ({unit})</span>
                  <input
                    type="number"
                    value={targetDraft[k] ?? ''}
                    onChange={e => setTargetDraft({ ...targetDraft, [k]: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg text-white text-sm text-center outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </label>
              ))}
            </div>

            <details className="rounded-lg border border-white/10 p-2">
              <summary className="text-muted text-[11px] cursor-pointer">Micronutrient targets (optional)</summary>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {MICRO_INPUTS.map(([k, l]) => (
                  <label key={k} className="block">
                    <span className="text-muted text-[10px]">{l}</span>
                    <input
                      value={targetDraft.micros?.[k] ?? ''}
                      onChange={e => setTargetDraft({ ...targetDraft, micros: { ...(targetDraft.micros || {}), [k]: e.target.value } })}
                      className="w-full px-2 py-1.5 rounded-lg text-white text-sm text-center outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </label>
                ))}
              </div>
            </details>

            <TealButton onClick={saveTargets} disabled={busy} className="w-full text-sm py-2.5">Save targets</TealButton>
          </>
        ),
      })}
    </div>
  );
}

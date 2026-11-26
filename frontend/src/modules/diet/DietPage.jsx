import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Utensils, Camera, Search, Plus, Star, Copy, Trash2, ChevronRight, Scan, Zap } from 'lucide-react';
import { api, apiUpload } from '../../shared/api.js';
import { GlassCard, TealButton, PurpleButton, Spinner, ErrorMsg, Badge, MacroBar, Chip, CircularProgress } from '../../shared/ui.jsx';

export default function DietPage() {
  const dateIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [diary, setDiary] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [mission, setMission] = useState(null);
  const [tab, setTab] = useState('today'); // today | scan | search | favorites
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingEntry, setAddingEntry] = useState(null);
  const scanFileRef = useRef(null);
  const [addForm, setAddForm] = useState({ quantity: 100, unit: 'g' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, fav, m] = await Promise.allSettled([
        api('/nutrition/diary/' + dateIST),
        api('/nutrition/favorites'),
        api('/nutrition/mission'),
      ]);
      if (d.status === 'fulfilled') setDiary(d.value);
      if (fav.status === 'fulfilled') setFavorites(Array.isArray(fav.value) ? fav.value : []);
      if (m.status === 'fulfilled') setMission(m.value);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function scanMeal(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await apiUpload('/ai/meal-scan', { file });
      setScanResult(result);
      setTab('scan');
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  async function searchFood(q) {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const results = await api('/nutrition/foods?query=' + encodeURIComponent(q));
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function addFoodToDiary(food, quantity = 100) {
    try {
      await api('/nutrition/diary', { method: 'POST', body: { foodId: food.id, foodName: food.name, quantity, unit: addForm.unit, mealType: 'LUNCH', logDate: dateIST } });
      load();
      setAddingEntry(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteDiaryEntry(id) {
    try {
      await api('/nutrition/diary/' + id, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function logFavorite(favId) {
    try {
      await api('/nutrition/favorites/' + favId + '/log', { method: 'POST', body: { logDate: dateIST } });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const entries = diary?.entries || [];
  const calGoal = mission?.dailyCalories || diary?.calorieGoal || 2200;
  const calEaten = diary?.totalCalories || 0;
  const protein = diary?.totalProtein || 0;
  const carbs = diary?.totalCarbs || 0;
  const fat = diary?.totalFat || 0;

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Spinner size={36} /></div>;

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Utensils size={22} className="text-teal" /> Diet</h1>
        <div className="flex gap-2">
          <button onClick={() => { scanFileRef.current?.click(); }} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3">
            {scanning ? <Spinner size={12} /> : <><Scan size={14} /> Scan</>}
          </button>
          <input ref={scanFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={scanMeal} />
        </div>
      </div>

      {/* Daily Summary */}
      <GlassCard>
        <div className="flex items-center gap-4 mb-3">
          <CircularProgress value={calEaten} max={calGoal} size={72} strokeWidth={5} color="#2dd4bf">
            <div className="text-center">
              <p className="tab-num text-teal font-bold text-sm">{calEaten}</p>
              <p className="text-muted text-[9px]">kcal</p>
            </div>
          </CircularProgress>
          <div className="flex-1 space-y-1.5">
            <MacroBar label="Protein" value={Math.round(protein)} max={Math.round(calGoal * 0.3 / 4)} color="teal" />
            <MacroBar label="Carbs" value={Math.round(carbs)} max={Math.round(calGoal * 0.45 / 4)} color="gold" />
            <MacroBar label="Fat" value={Math.round(fat)} max={Math.round(calGoal * 0.25 / 9)} color="purple" />
          </div>
        </div>
        <p className="text-muted text-xs text-center">{Math.max(0, calGoal - calEaten)} kcal remaining · Goal: {calGoal}</p>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {['today', 'search', 'favorites', 'scan'].map(t => (
          <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {tab === 'today' && (
        <>
          {entries.length === 0 ? (
            <div className="text-center py-10">
              <Utensils size={36} className="text-muted mx-auto mb-3 opacity-30" />
              <p className="text-muted text-sm">No meals logged today.</p>
              <p className="text-muted text-xs mt-1">Use Scan to auto-log your thali 🍽️</p>
              <TealButton onClick={() => setTab('search')} className="mt-4 text-sm">Search Food</TealButton>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Group by meal type */}
              {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map(meal => {
                const mealEntries = entries.filter(e => (e.mealType || 'LUNCH') === meal);
                if (!mealEntries.length) return null;
                return (
                  <GlassCard key={meal}>
                    <h4 className="text-muted text-xs font-semibold uppercase tracking-widest mb-2">{meal}</h4>
                    {mealEntries.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{entry.foodName}</p>
                          <p className="text-muted text-xs">{entry.quantity}{entry.unit} · {Math.round(entry.calories || 0)} kcal</p>
                        </div>
                        <div className="flex gap-2 text-xs text-muted">
                          <span className="text-teal">{Math.round(entry.protein || 0)}P</span>
                          <span className="text-gold">{Math.round(entry.carbs || 0)}C</span>
                          <span className="text-purple">{Math.round(entry.fat || 0)}F</span>
                        </div>
                        <button onClick={() => deleteDiaryEntry(entry.id)} className="text-red-400/60 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </GlassCard>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'search' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              placeholder="Search food… dal, roti, paneer"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchFood(searchQuery)}
              className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <TealButton onClick={() => searchFood(searchQuery)} disabled={searching} className="px-4">
              {searching ? <Spinner size={14} /> : <Search size={16} />}
            </TealButton>
          </div>
          <div className="space-y-2">
            {searchResults.map((food, i) => (
              <GlassCard key={i}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{food.name}</p>
                    <p className="text-muted text-xs">{food.calories} kcal / 100g · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                  </div>
                  <button onClick={() => addFoodToDiary(food, 100)} className="btn-teal text-xs py-1.5 px-3 flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {tab === 'favorites' && (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <Star size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No favorites yet. Add foods from search!</p>
            </div>
          ) : favorites.map((fav, i) => (
            <GlassCard key={i}>
              <div className="flex items-center gap-3">
                <Star size={16} className="text-gold flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{fav.foodName || fav.name}</p>
                  <p className="text-muted text-xs">{fav.calories} kcal</p>
                </div>
                <button onClick={() => logFavorite(fav.id)} className="btn-teal text-xs py-1.5 px-3 flex items-center gap-1">
                  <Plus size={12} /> Log
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === 'scan' && (
        <div className="space-y-4">
          {!scanResult ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 rounded-full bg-teal/10 border-2 border-dashed border-teal/30 flex items-center justify-center mx-auto mb-4">
                <Camera size={36} className="text-teal" />
              </div>
              <p className="text-white font-semibold mb-2">Scan Your Meal</p>
              <p className="text-muted text-sm mb-4">AI will identify food items and calories from your thali photo</p>
              <TealButton onClick={() => scanFileRef.current?.click()} disabled={scanning} className="mx-auto">
                {scanning ? <><Spinner size={14} /> Scanning…</> : <><Camera size={16} /> Take Photo</>}
              </TealButton>
            </div>
          ) : (
            <>
              <GlassCard accent="teal">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-teal" />
                  <span className="text-teal font-semibold text-sm">AI Scan Results</span>
                  {scanResult.isFood === false && <Badge color="red">Not Food</Badge>}
                  {scanResult.confidence && <Badge color="muted">{Math.round(scanResult.confidence * 100)}% confident</Badge>}
                </div>
                {Array.isArray(scanResult.items) ? scanResult.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-sm">{item.name}</p>
                      <p className="text-muted text-xs">{item.quantity} · {item.calories} kcal</p>
                    </div>
                    <button onClick={() => addFoodToDiary({ id: item.foodId, name: item.name }, item.quantityG || 100)} className="btn-teal text-xs py-1 px-3">Add</button>
                  </div>
                )) : (
                  <p className="text-muted text-sm">{scanResult.summary || 'Scan complete. Check results.'}</p>
                )}
              </GlassCard>
              <TealButton onClick={() => { setScanResult(null); setTab('today'); }} className="w-full">Done</TealButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}

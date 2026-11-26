import React, { useState } from 'react';
import { Sparkles, ArrowRight, Scale, Utensils, Target } from 'lucide-react';
import { api } from '../../shared/api.js';
import { TealButton, ErrorMsg, Spinner } from '../../shared/ui.jsx';

const GOALS = [
  { id: 'FAT_LOSS', label: 'Fat Loss', desc: 'Lean cut & deficit', kcalFactor: 26, deltaKg: -4 },
  { id: 'MUSCLE_GAIN', label: 'Muscle Gain', desc: 'Clean lean bulk', kcalFactor: 34, deltaKg: 4 },
  { id: 'RECOMPOSITION', label: 'Recomp', desc: 'Build muscle & lose fat', kcalFactor: 30, deltaKg: 0 },
];

const DIETS = [
  { id: 'VEG', label: 'Veg' },
  { id: 'NON_VEG', label: 'Non-Veg' },
  { id: 'EGGETARIAN', label: 'Eggetarian' },
];

function dateIST(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export default function FirstTimeSetup({ onComplete, onSkip }) {
  const [goal, setGoal] = useState('MUSCLE_GAIN');
  const [weightKg, setWeightKg] = useState('70');
  const [diet, setDiet] = useState('VEG');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    const weight = parseFloat(weightKg);
    if (!weight || weight < 25 || weight > 250) {
      setError('Enter a valid weight between 25 and 250 kg.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const selected = GOALS.find((g) => g.id === goal) || GOALS[1];
      const maintenanceCalories = Math.round(weight * 31);
      const dailyCalorieBudget = Math.round(weight * selected.kcalFactor);
      const today = dateIST(0);
      const targetDate = dateIST(84);

      localStorage.setItem('dp_diet_pref', diet);

      await Promise.allSettled([
        api('/progress/weight', {
          method: 'POST',
          body: { date: today, weightKg: weight },
        }),
        api('/progress/metabolic', {
          method: 'PUT',
          body: { primaryGoal: goal },
        }),
        api('/nutrition/mission', {
          method: 'POST',
          body: {
            startWeightKg: weight,
            targetWeightKg: Math.max(35, Math.round((weight + selected.deltaKg) * 10) / 10),
            startDate: today,
            targetDate,
            maintenanceCalories,
            dailyCalorieBudget,
          },
        }),
        api('/autopilot/today/generate', { method: 'POST', body: {} }),
      ]);

      onComplete();
    } catch (err) {
      setError(err.message || 'Could not save setup. You can skip and set this later.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen min-h-dvh flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, rgba(45, 212, 191, 0.1) 0%, transparent 60%), #05070c',
      }}
    >
      <div className="w-full max-w-md glass-card-teal p-6 space-y-5 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-teal text-xs font-semibold uppercase tracking-widest">
              <Sparkles size={14} /> Quick Setup
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Personalize your plan</h2>
            <p className="text-muted text-xs mt-1">
              Get instant Indian calorie targets & AI workouts in 10 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-muted hover:text-white text-xs font-semibold px-2 py-1"
          >
            Skip for now
          </button>
        </div>

        <ErrorMsg message={error} onDismiss={() => setError('')} />

        <form onSubmit={handleSave} className="space-y-4">
          {/* Goal */}
          <div>
            <label className="text-xs text-muted flex items-center gap-1.5 mb-2">
              <Target size={13} className="text-teal" /> Your Goal
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    goal === g.id
                      ? 'bg-teal/15 border-teal text-white'
                      : 'border-white/10 text-muted hover:border-white/20'
                  }`}
                >
                  <p className={`text-xs font-bold ${goal === g.id ? 'text-teal' : 'text-white'}`}>
                    {g.label}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5 leading-tight">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="setup-weight" className="text-xs text-muted flex items-center gap-1.5 mb-2">
              <Scale size={13} className="text-teal" /> Current Weight (kg)
            </label>
            <input
              id="setup-weight"
              type="number"
              step="0.1"
              min="25"
              max="250"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="70"
              className="w-full px-4 py-3 rounded-xl text-white text-base outline-none tab-num"
              style={{
                fontSize: '16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* Diet Preference */}
          <div>
            <label className="text-xs text-muted flex items-center gap-1.5 mb-2">
              <Utensils size={13} className="text-teal" /> Diet Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIETS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDiet(d.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    diet === d.id
                      ? 'bg-teal border-teal text-bg'
                      : 'border-white/10 text-muted hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <TealButton type="submit" disabled={saving} className="w-full">
            {saving ? (
              <>
                <Spinner size={16} /> Building your plan…
              </>
            ) : (
              <>
                Save & Start <ArrowRight size={16} />
              </>
            )}
          </TealButton>
        </form>
      </div>
    </div>
  );
}

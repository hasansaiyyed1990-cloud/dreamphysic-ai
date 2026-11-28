import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  Send,
  Mic,
  Camera,
  Scan,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
  Utensils,
  Heart,
  Dumbbell,
  Moon,
  Play,
  Bot,
} from 'lucide-react';
import { api } from '../../shared/api.js';
import { useAuth } from '../../shared/AuthContext.jsx';
import { getLocalIstDateString } from '../../shared/date.js';
import { Spinner, ErrorMsg } from '../../shared/ui.jsx';

const STARTER_CHIPS = [
  { label: '⚡ Stamina Plan', prompt: 'Build me a 10km stamina plan with weekly pacing and recovery.' },
  { label: '🔥 Fat Loss Math', prompt: 'Calculate my realistic fat loss math and daily Indian calorie deficit.' },
  { label: '💪 120g Desi Protein', prompt: 'Give me a practical 120g Indian protein plan using home foods.' },
  { label: '➕ More', prompt: 'Compare my logged 1-month, 3-month, 6-month, and all-time fitness progress.' },
];

function parseCoachPayload(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return {
      structured: true,
      timeline: raw.timeline || raw.verdictAndTimeline || 'Timeline not specified',
      target: raw.target || 'See coach plan',
      baseline: raw.baseline || raw.dataDiagnosis || 'No matching baseline was included in this response.',
      steps: Array.isArray(raw.steps) && raw.steps.length ? raw.steps : [raw.summary || JSON.stringify(raw)],
      kitchenRule: raw.kitchenRule || raw.indianDietRule || 'No specific food adjustment was included.',
      subPlans: raw.subPlans || null,
      rawText: raw.reply || raw.message || '',
    };
  }
  const text = String(raw || '').trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return parseCoachPayload(parsed);
  } catch {
    // Plain Hinglish / markdown text from CoachBrain
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean);

  const timelineMatch = text.match(/(\d+\s*[-–to]+\s*\d+\s*(?:weeks?|months?|days?))/i);
  const targetMatch = text.match(/(?:target|goal)[:\s]+([^\n.]{4,40})/i);
  const kitchenLine = lines.find((l) => /protein|roti|dal|paneer|curd|soya|egg|kcal|kitchen/i.test(l));

  return {
    structured: true,
    timeline: timelineMatch ? timelineMatch[1] : 'Timeline not specified',
    target: targetMatch ? targetMatch[1].trim() : 'See coach plan',
    baseline: lines[0] || 'No logged baseline was included in this response.',
    steps: lines.slice(0, 3).length ? lines.slice(0, 3) : [text],
    kitchenRule: kitchenLine || 'No specific food adjustment was included.',
    subPlans: null,
    rawText: text,
  };
}

const StructuredCoachCard = memo(({ msg, onApplyPlan, onNavigate }) => {
  const data = parseCoachPayload(msg.payload);
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: '#0e131f', border: '1px solid rgba(45, 212, 191, 0.22)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-teal/15 border border-teal/30 flex items-center justify-center">
          <Bot size={16} className="text-teal" />
        </div>
        <div>
          <p className="text-sm font-bold text-white flex items-center gap-1">
            AI Coach <CheckCircle2 size={13} className="text-teal" />
          </p>
          <p className="text-[11px] text-muted">Here&apos;s your personalized plan</p>
        </div>
      </div>

      {/* Timeline & Target Pills */}
      <div className="grid grid-cols-2 gap-2">
        <div className="px-3 py-2 rounded-xl bg-gold/10 border border-gold/30 flex items-center gap-1.5">
          <Clock size={13} className="text-gold flex-shrink-0" />
          <span className="text-[11px] font-bold text-gold truncate tab-num">
            {data.timeline}
          </span>
        </div>
        <div className="px-3 py-2 rounded-xl bg-teal/10 border border-teal/30 flex items-center gap-1.5">
          <Target size={13} className="text-teal flex-shrink-0" />
          <span className="text-[11px] font-bold text-teal truncate tab-num">
            {data.target}
          </span>
        </div>
      </div>

      {/* Baseline Strip */}
      <div className="px-3 py-2 rounded-xl bg-teal/10 border border-teal/25 flex items-center gap-2">
        <BarChart3 size={14} className="text-teal flex-shrink-0" />
        <p className="text-xs text-white truncate">
          <strong className="text-teal">Your Baseline:</strong> {data.baseline}
        </p>
      </div>

      {/* 2-Col Grid: Step-by-Step + Projection SVG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <Calendar size={13} className="text-teal" /> Step-by-Step Plan
          </p>
          {data.steps.slice(0, 3).map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="w-5 h-5 rounded-full bg-teal/20 border border-teal/50 text-teal text-[11px] font-bold flex items-center justify-center flex-shrink-0 tab-num">
                {idx + 1}
              </span>
              <p className="text-xs text-white/90 leading-snug">{step}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-3 flex flex-col justify-between"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-bold text-white mb-1">Progress Projection</p>
          <svg viewBox="0 0 180 60" className="w-full h-14">
            <defs>
              <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M8,50 L45,42 L90,32 L135,20 L172,10 L172,54 L8,54 Z" fill="url(#projGrad)" />
            <polyline
              points="8,50 45,42 90,32 135,20 172,10"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {[
              [8, 50],
              [45, 42],
              [90, 32],
              [135, 20],
              [172, 10],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="2.8" fill="#fbbf24" />
            ))}
          </svg>
          <p className="text-[10px] text-teal font-semibold mt-1">Illustrative only · not a result guarantee</p>
        </div>
      </div>

      {/* Kitchen Rule */}
      <div className="px-3 py-2 rounded-xl bg-gold/10 border border-gold/30 flex items-center gap-2">
        <Utensils size={14} className="text-gold flex-shrink-0" />
        <p className="text-xs text-white leading-snug">
          <strong className="text-gold">Kitchen Rule:</strong> {data.kitchenRule}
        </p>
      </div>

      {/* 4 Sub-Plan Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Cardio Plan', sub: 'Weekly', icon: Heart, tab: 'cardio', color: 'text-teal' },
          { label: 'Diet Plan', sub: 'Macros', icon: Utensils, tab: 'diet', color: 'text-gold' },
          { label: 'Strength Support', sub: 'Compound', icon: Dumbbell, tab: 'workout', color: 'text-purple' },
          { label: 'Recovery', sub: '7-8h Sleep', icon: Moon, tab: 'autopilot', color: 'text-teal' },
        ].map(({ label, sub, icon: Icon, tab, color }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate?.(tab)}
            className="p-2 rounded-xl text-left transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Icon size={13} className={`${color} mb-1`} />
            <p className="text-[11px] font-bold text-white leading-tight">{label}</p>
            <p className="text-[10px] text-muted">{sub}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onApplyPlan(data)}
        className="w-full btn-teal flex items-center justify-center gap-2 py-3 text-xs"
      >
        <Play size={14} /> Review Plan in Cardio &amp; Diet
      </button>
    </div>
  );
});

export default function FitnessAiView({ onNavigate }) {
  const { user } = useAuth() ?? {};
  const firstName = (user?.name || 'Athlete').split(' ')[0];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [listening, setListening] = useState(false);
  const [liveSnap, setLiveSnap] = useState('');

  const abortRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const today = getLocalIstDateString();
    Promise.allSettled([
      api('/progress/weight/weekly'),
      api(`/nutrition/diary/${today}`),
      api('/cardio/overview'),
    ]).then(([w, d, c]) => {
      const parts = [];
      if (w.status === 'fulfilled' && w.value?.endWeightKg) {
        parts.push(`Weight: ${w.value.endWeightKg}kg (7d change: ${w.value.changeKg ?? 0}kg)`);
      }
      if (d.status === 'fulfilled' && d.value) {
        parts.push(`Today's intake: ${Math.round(d.value.calories || 0)} kcal, ${Math.round(d.value.proteinG || 0)}g protein`);
      }
      if (c.status === 'fulfilled' && c.value?.weeklyCalories) {
        parts.push(`Weekly cardio burn: ${c.value.weeklyCalories} kcal`);
      }
      if (parts.length) setLiveSnap(`[Live Snapshot: ${parts.join(' | ')}]\n`);
    }).catch(() => {});
  }, []);

  const hasSpeech =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (overrideText) => {
      const prompt = (overrideText ?? input).trim();
      if (!prompt || busy) return;

      setInput('');
      setError('');
      setMessages((m) => [...m, { role: 'user', text: prompt }]);
      setBusy(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await api('/autopilot/coach', {
          method: 'POST',
          body: { prompt: liveSnap ? `${liveSnap}${prompt}` : prompt },
          signal: controller.signal,
        });
        setMessages((m) => [...m, { role: 'ai', payload: res }]);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      } finally {
        setBusy(false);
      }
    },
    [input, busy]
  );

  function handleVoice() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;
    const rec = new Speech();
    rec.lang = 'en-IN';
    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      if (text) send(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  function handleApplyPlan() {
    setToast('Review coach suggestions before logging them.');
    onNavigate?.('diet');
    setTimeout(() => setToast(''), 2800);
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-132px)] px-4 pt-4 pb-4 space-y-3">
      {/* Coach Welcome + 4 Quick Action Tiles */}
      <div className="grid grid-cols-1 gap-3">
        <div
          className="rounded-2xl p-3.5 flex items-center gap-3"
          style={{ background: '#0e131f', border: '1px solid rgba(45, 212, 191, 0.25)' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-teal/15 border border-teal/35 flex items-center justify-center flex-shrink-0">
            <Bot size={24} className="text-teal" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Hi {firstName}! 👋</p>
            <p className="text-xs text-muted leading-snug mt-0.5">
              Ask me anything about workouts, cardio, diet, fat loss, muscle gain or recovery.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Analyze Food', icon: Camera, tab: 'diet', color: 'text-teal' },
            { label: 'Body Analysis', icon: Scan, tab: 'progress', color: 'text-purple' },
            { label: 'Create Plan', icon: Calendar, tab: 'autopilot', color: 'text-gold' },
            { label: 'Progress Insight', icon: TrendingUp, tab: 'progress', color: 'text-teal' },
          ].map(({ label, icon: Icon, tab, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate?.(tab)}
              className="p-2.5 rounded-xl flex flex-col items-center text-center gap-1.5 active:scale-95 transition-transform"
              style={{ background: '#0e131f', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Icon size={16} className={color} />
              <span className="text-[10px] font-semibold text-white leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {toast && (
        <div className="p-3 rounded-xl bg-teal/15 border border-teal/35 text-teal text-xs font-semibold text-center">
          ✓ {toast}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div
                className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm text-white"
                style={{
                  background: 'rgba(168, 85, 247, 0.14)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                }}
              >
                {m.text}
              </div>
            </div>
          ) : (
            <StructuredCoachCard
              key={i}
              msg={m}
              onApplyPlan={handleApplyPlan}
              onNavigate={onNavigate}
            />
          )
        )}

        {busy && (
          <div
            className="rounded-2xl p-3 flex items-center gap-2 text-xs text-muted"
            style={{ background: '#0e131f', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Spinner size={15} /> Analyzing your workouts, food &amp; recovery…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Starter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
        {STARTER_CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => send(c.prompt)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-white border border-white/15 bg-[#0e131f] hover:border-teal/40"
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div
        className="rounded-2xl p-2 flex items-center gap-2"
        style={{ background: '#0e131f', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask your coach anything..."
          className="flex-1 bg-transparent text-white text-base outline-none px-2 py-1.5"
          style={{ fontSize: '16px' }}
        />
        {hasSpeech && (
          <button
            type="button"
            onClick={handleVoice}
            aria-label="Voice input"
            className={`p-2 rounded-xl ${listening ? 'text-teal bg-teal/15' : 'text-muted hover:text-white'}`}
          >
            <Mic size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={() => send()}
          disabled={busy || !input.trim()}
          aria-label="Send message"
          className="w-10 h-10 rounded-xl bg-teal text-bg flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

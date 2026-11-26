import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Send, Mic, Sparkles, ChevronRight, Plus, RefreshCw, Brain } from 'lucide-react';
import { api } from '../../shared/api.js';
import { GlassCard, TealButton, Spinner, ErrorMsg, Badge } from '../../shared/ui.jsx';
import CoachText from '../../shared/CoachText.jsx';

const QUICK_PROMPTS = [
  { label: '💪 Chest growth plan?', prompt: 'Give me a chest growth plan for this week.' },
  { label: '🔥 Cutting tips?', prompt: 'Give me a cutting plan for fat loss.' },
  { label: '🥗 Protein ideas', prompt: 'Give me high-protein Indian meal ideas for today.' },
  { label: '😴 Fix my sleep?', prompt: 'How can I improve my sleep for better muscle recovery?' },
  { label: '📈 Plateau fix', prompt: 'I am stuck at the same weight. How do I break the plateau?' },
  { label: '🦵 Leg day boost', prompt: 'Give me tips to improve my leg day performance.' },
];

const ChatBubble = memo(({ msg }) => (
  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
    {msg.role === 'ai' && (
      <div className="w-7 h-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
        <Brain size={14} className="text-teal" />
      </div>
    )}
    <div
      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        msg.role === 'user'
          ? 'text-bg font-medium'
          : 'text-white'
      }`}
      style={msg.role === 'user' ? { background: '#2dd4bf' } : { background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {msg.role === 'ai' ? <CoachText text={msg.content} /> : msg.content}
    </div>
  </div>
));

export default function FitnessAIPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hey! I'm your DreamPhysic AI Coach 🧠. I know your weight, workouts, and food logs. Ask me anything — plan, advice, or motivation!" }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadPlan = useCallback(async () => {
    setPlanLoading(true);
    try {
      const data = await api('/autopilot/briefing');
      setPlan(data);
    } catch {
      // silent
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const send = useCallback(async (text) => {
    const prompt = text || input.trim();
    if (!prompt || busy) return;
    setInput('');
    setError('');
    setMessages(m => [...m, { role: 'user', content: prompt }]);
    setBusy(true);
    try {
      const res = await api('/autopilot/coach', { method: 'POST', body: { prompt } });
      const reply = typeof res === 'string' ? res : res?.reply || res?.message || JSON.stringify(res);
      setMessages(m => [...m, { role: 'ai', content: reply }]);
    } catch (e) {
      setError(e.message);
      setMessages(m => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }, [input, busy]);

  return (
    <div className="flex flex-col h-dvh max-h-dvh">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-purple/10 border border-purple/30 flex items-center justify-center">
            <Brain size={20} className="text-purple" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Fitness Coach</h1>
            <p className="text-muted text-xs">Knows your weight · food · workouts</p>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              onClick={() => send(q.prompt)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border border-purple/20 bg-purple/5 text-purple hover:bg-purple/10 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Preview */}
      {plan && (
        <div className="px-4 mb-2 flex-shrink-0">
          <GlassCard accent="purple" className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple flex items-center gap-1"><Sparkles size={12} /> Today's AI Plan</span>
              <button onClick={loadPlan} className="text-muted"><RefreshCw size={12} /></button>
            </div>
            <p className="text-white text-xs leading-relaxed">{plan?.todayBriefing || plan?.summary || 'Your plan is ready'}</p>
          </GlassCard>
        </div>
      )}

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-2" style={{ contentVisibility: 'auto' }}>
        {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
        {busy && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center">
              <Brain size={14} className="text-teal" />
            </div>
            <div className="glass-card px-4 py-3 flex items-center gap-2">
              <Spinner size={14} />
              <span className="text-muted text-sm">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="px-4 pb-3 flex-shrink-0" style={{ paddingBottom: 'calc(12px + 68px + var(--safe-bottom, 0px))' }}>
        <div className="glass-card flex items-end gap-2 p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask your coach anything… (fitness, diet, cardio)"
            rows={1}
            className="flex-1 bg-transparent text-white text-sm outline-none resize-none px-2 py-1.5 max-h-28 overflow-y-auto leading-relaxed"
            style={{ minHeight: 36 }}
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          >
            <Send size={16} className="text-bg" />
          </button>
        </div>
      </div>
    </div>
  );
}

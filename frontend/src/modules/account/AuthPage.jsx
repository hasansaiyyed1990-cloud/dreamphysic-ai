import React, { useState } from 'react';
import { Dumbbell, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../shared/AuthContext.jsx';
import { api } from '../../shared/api.js';
import { TealButton, ErrorMsg } from '../../shared/ui.jsx';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [form, setForm] = useState({ email: '', password: '', name: '', otp: '', newPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const field = (k) => ({
    value: form[k],
    onChange: (e) => setForm(f => ({ ...f, [k]: e.target.value })),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      if (mode === 'login') {
        const data = await api('/auth/login', { method: 'POST', body: { email: form.email.trim().toLowerCase(), password: form.password } });
        login(data.token || data);
      } else if (mode === 'register') {
        const data = await api('/auth/register', { method: 'POST', body: { email: form.email.trim().toLowerCase(), password: form.password, name: form.name || form.email.split('@')[0] } });
        login(data.token || data);
      } else if (mode === 'forgot') {
        if (!otpSent) {
          await api('/auth/forgot-password', { method: 'POST', body: { email: form.email.trim().toLowerCase() } });
          setOtpSent(true);
          setMsg('OTP sent to your email! Check inbox.');
        } else {
          await api('/auth/reset-password', { method: 'POST', body: { email: form.email.trim().toLowerCase(), otp: form.otp, newPassword: form.newPassword } });
          setMsg('Password reset! Please login.');
          setMode('login');
          setOtpSent(false);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(45, 212, 191, 0.08) 0%, transparent 60%), #05070c' }}>
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center mb-4">
            <Dumbbell size={32} className="text-teal" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DreamPhysic <span className="text-teal">AI</span></h1>
          <p className="text-muted text-sm mt-1">Your AI-powered fitness coach</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-5 text-white">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Reset password'}
          </h2>

          <ErrorMsg message={error} onDismiss={() => setError('')} />
          {msg && <div className="p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm mb-4">{msg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-muted block mb-1.5">Your Name</label>
                <input
                  type="text"
                  placeholder="Hasan Saiyyed"
                  {...field('name')}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted block mb-1.5">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                {...field('email')}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {(mode === 'login' || mode === 'register') && (
              <div>
                <label className="text-xs text-muted block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    {...field('password')}
                    className="w-full px-4 py-3 pr-10 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'forgot' && otpSent && (
              <>
                <div>
                  <label className="text-xs text-muted block mb-1.5">OTP Code</label>
                  <input type="text" placeholder="6-digit OTP" {...field('otp')}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1.5">New Password</label>
                  <input type="password" placeholder="Min 8 characters" {...field('newPassword')} minLength={8}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </>
            )}

            <TealButton type="submit" disabled={busy} className="w-full">
              {busy ? 'Please wait…' : mode === 'login' ? <>Sign In <ArrowRight size={16} /></> : mode === 'register' ? <>Create Account <ArrowRight size={16} /></> : otpSent ? 'Reset Password' : 'Send OTP'}
            </TealButton>
          </form>

          <div className="mt-5 space-y-2">
            {mode !== 'login' ? (
              <button onClick={() => { setMode('login'); setOtpSent(false); setError(''); setMsg(''); }} className="text-teal text-xs text-center w-full">← Back to Sign In</button>
            ) : (
              <>
                <button onClick={() => { setMode('register'); setError(''); setMsg(''); }} className="text-teal text-xs text-center w-full">New here? Create account →</button>
                <button onClick={() => { setMode('forgot'); setError(''); setMsg(''); }} className="text-muted text-xs text-center w-full">Forgot password?</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

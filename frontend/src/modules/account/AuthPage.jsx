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
    onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      if (mode === 'login') {
        const data = await api('/auth/login', {
          method: 'POST',
          body: { email: normalizedEmail, password: form.password },
        });
        login(data.token || data, {
          id: data.userId ?? data.id ?? null,
          name: data.name || normalizedEmail.split('@')[0],
          email: data.email || normalizedEmail,
        });
      } else if (mode === 'register') {
        const data = await api('/auth/register', {
          method: 'POST',
          body: {
            email: normalizedEmail,
            password: form.password,
            name: form.name.trim() || normalizedEmail.split('@')[0],
          },
        });
        login(data.token || data, {
          id: data.userId ?? data.id ?? null,
          name: data.name || form.name.trim() || normalizedEmail.split('@')[0],
          email: data.email || normalizedEmail,
          isNewUser: true,
        });
      } else if (mode === 'forgot') {
        if (!otpSent) {
          await api('/auth/forgot-password', { method: 'POST', body: { email: normalizedEmail } });
          setOtpSent(true);
          setMsg('OTP sent to your email! Check inbox.');
        } else {
          await api('/auth/reset-password', {
            method: 'POST',
            body: { email: normalizedEmail, otp: form.otp.trim(), newPassword: form.newPassword },
          });
          setMsg('Password reset! Please sign in.');
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
    <div
      className="min-h-screen min-h-dvh flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, rgba(45, 212, 191, 0.1) 0%, transparent 60%), #05070c',
      }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center mb-4">
            <Dumbbell size={32} className="text-teal" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            DreamPhysic <span className="text-teal">AI</span>
          </h1>
          <p className="text-muted text-sm mt-1">Private Beta · AI Fitness Coach</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6">
          {/* Login / Create Account Segmented Toggle */}
          {mode !== 'forgot' && (
            <div
              className="grid grid-cols-2 p-1 rounded-xl mb-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setMsg(''); }}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'login' ? 'bg-teal text-bg' : 'text-muted hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setMsg(''); }}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'register' ? 'bg-teal text-bg' : 'text-muted hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <h2 className="text-lg font-bold mb-4 text-white">Reset password</h2>
          )}

          <ErrorMsg message={error} onDismiss={() => setError('')} />
          {msg && (
            <div className="p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm mb-4">
              {msg}
            </div>
          )}

          <form
            id="dreamphysic-auth-form"
            name={mode === 'login' ? 'login' : mode === 'register' ? 'register' : 'forgot'}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="text-xs text-muted block mb-1.5">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Your name"
                  {...field('name')}
                  className="w-full px-4 py-3 rounded-xl text-white text-base outline-none transition-colors"
                  style={{
                    fontSize: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="text-xs text-muted block mb-1.5">
                Email
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="you@example.com"
                {...field('email')}
                className="w-full px-4 py-3 rounded-xl text-white text-base outline-none"
                style={{
                  fontSize: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>

            {(mode === 'login' || mode === 'register') && (
              <div>
                <label htmlFor="auth-password" className="text-xs text-muted block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    {...field('password')}
                    className="w-full px-4 py-3 pr-11 rounded-xl text-white text-base outline-none"
                    style={{
                      fontSize: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted p-1"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'forgot' && otpSent && (
              <>
                <div>
                  <label htmlFor="auth-otp" className="text-xs text-muted block mb-1.5">
                    OTP Code
                  </label>
                  <input
                    id="auth-otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit OTP"
                    {...field('otp')}
                    className="w-full px-4 py-3 rounded-xl text-white text-base outline-none"
                    style={{
                      fontSize: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="auth-new-password" className="text-xs text-muted block mb-1.5">
                    New Password
                  </label>
                  <input
                    id="auth-new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min 6 characters"
                    {...field('newPassword')}
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl text-white text-base outline-none"
                    style={{
                      fontSize: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
              </>
            )}

            <TealButton type="submit" disabled={busy} className="w-full">
              {busy ? (
                'Please wait…'
              ) : mode === 'login' ? (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              ) : mode === 'register' ? (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              ) : otpSent ? (
                'Reset Password'
              ) : (
                'Send OTP'
              )}
            </TealButton>
          </form>

          <div className="mt-5 space-y-2">
            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => { setMode('login'); setOtpSent(false); setError(''); setMsg(''); }}
                className="text-teal text-xs text-center w-full"
              >
                ← Back to Sign In
              </button>
            ) : mode === 'login' ? (
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setMsg(''); }}
                className="text-muted text-xs text-center w-full"
              >
                Forgot password?
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

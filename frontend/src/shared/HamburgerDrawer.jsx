import React, { useState, useEffect, memo } from 'react';
import {
  X,
  Home,
  Dumbbell,
  Utensils,
  Heart,
  TrendingUp,
  Navigation,
  Zap,
  User,
  Bug,
  Copy,
  Check,
  MessageCircle,
  LogOut,
} from 'lucide-react';
import { api, getLastApiError } from './api.js';
import { useAuth } from './AuthContext.jsx';

const DRAWER_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'diet', label: 'Diet & Scan', icon: Utensils },
  { id: 'cardio', label: 'Cardio', icon: Heart },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'autopilot', label: 'Autopilot', icon: Navigation },
  { id: 'ai', label: 'AI Coach', icon: Zap },
  { id: 'account', label: 'Account', icon: User },
];

export const HamburgerDrawer = memo(({ open, onClose, activeTab, onNavigate }) => {
  const { user, logout } = useAuth();
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    api('/app-version')
      .then((v) => {
        if (v?.version) setAppVersion(v.version);
        else if (typeof v === 'string') setAppVersion(v);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  function buildDiagnosticSnippet() {
    const status = typeof navigator !== 'undefined' && navigator.onLine ? 'Online' : 'Offline';
    const lastErr = getLastApiError() || 'None';
    const timeIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    return [
      'DreamPhysic AI - Beta Feedback',
      `Screen: ${activeTab}`,
      `Network: ${status}`,
      `Version: ${appVersion}`,
      `Last API Error: ${lastErr}`,
      `Time (IST): ${timeIST}`,
      'Notes: ',
    ].join('\n');
  }

  async function handleCopyFeedback() {
    const text = buildDiagnosticSnippet();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleWhatsAppFeedback() {
    const text = buildDiagnosticSnippet();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="relative z-10 w-72 max-w-[82vw] h-full flex flex-col justify-between p-5 overflow-y-auto"
        style={{
          background: '#0b101d',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white font-bold text-base">
                DreamPhysic <span className="text-teal">AI</span>
              </p>
              <p className="text-muted text-xs truncate max-w-[180px]">
                {user?.name || 'Beta Tester'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 rounded-xl text-muted hover:text-white bg-white/5"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-1">
            {DRAWER_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onNavigate(id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-teal/15 text-teal border border-teal/25'
                      : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Beta Bug Report & Logout */}
        <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
          <div
            className="p-3 rounded-xl space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Bug size={14} className="text-teal" />
              <span>Report Bug / Send Feedback</span>
            </div>
            <p className="text-[11px] text-muted leading-snug">
              Shares screen, network, version & last error (zero tokens/secrets).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyFeedback}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10"
              >
                {copied ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleWhatsAppFeedback}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold bg-teal text-bg"
              >
                <MessageCircle size={13} />
                WhatsApp
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
    </div>
  );
});

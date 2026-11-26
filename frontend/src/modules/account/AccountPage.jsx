import React, { useState, useEffect, useCallback } from 'react';
import { User, LogOut, Bell, Trash2, Shield, ChevronRight, Settings, Info, BatteryFull, Smartphone, Navigation } from 'lucide-react';
import { api } from '../../shared/api.js';
import { useAuth } from '../../shared/AuthContext.jsx';
import { GlassCard, TealButton, PurpleButton, Spinner, ErrorMsg, Badge } from '../../shared/ui.jsx';

export default function AccountPage({ onNavigate }) {
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appVersion, setAppVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ver] = await Promise.allSettled([
          api('/app-version'),
        ]);
        if (ver.status === 'fulfilled') setAppVersion(ver.value);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function logoutAll() {
    setLoggingOutAll(true);
    try {
      await api('/auth/logout-all', { method: 'POST' });
      logout();
    } catch (e) {
      setError(e.message);
      logout(); // force local logout anyway
    } finally {
      setLoggingOutAll(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await api('/user/account', { method: 'DELETE' });
      logout();
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  const QUICK_LINKS = [
    { icon: Navigation, label: 'Autopilot Settings', tab: 'autopilot' },
    { icon: Bell, label: 'Reminders & Notifications', tab: null },
    { icon: BatteryFull, label: 'Battery Saver Help', tab: null },
    { icon: Smartphone, label: 'Android App Settings', tab: null },
  ];

  return (
    <div className="px-4 pt-5 space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">Account</h1>
      </div>

      <ErrorMsg message={error} onDismiss={() => setError('')} />

      {/* Profile */}
      <GlassCard className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/30 flex items-center justify-center flex-shrink-0">
          <User size={28} className="text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg truncate">{user?.name || 'DreamPhysic User'}</p>
          <p className="text-muted text-sm truncate">{user?.email || 'Your profile'}</p>
        </div>
        <Badge color="teal">Pro</Badge>
      </GlassCard>

      {/* Quick Links */}
      <GlassCard>
        <h3 className="text-white font-semibold mb-3 text-sm">Quick Settings</h3>
        <div className="space-y-1">
          {QUICK_LINKS.map(({ icon: Icon, label, tab }) => (
            <button
              key={label}
              onClick={() => tab && onNavigate(tab)}
              className="w-full flex items-center gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg px-2 transition-colors"
            >
              <Icon size={18} className="text-muted" />
              <span className="text-white text-sm flex-1 text-left">{label}</span>
              <ChevronRight size={16} className="text-muted" />
            </button>
          ))}
        </div>
      </GlassCard>

      {/* App Info */}
      {appVersion && (
        <GlassCard>
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm"><Info size={16} className="text-muted" /> App Info</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Version</span>
              <span className="text-white tab-num">{appVersion.version || appVersion}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Build</span>
              <span className="text-white tab-num">{appVersion.buildDate || '—'}</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Security */}
      <GlassCard>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm"><Shield size={16} className="text-purple" /> Security</h3>
        <div className="space-y-3">
          <TealButton onClick={logout} className="w-full flex items-center justify-center gap-2">
            <LogOut size={16} /> Sign Out
          </TealButton>
          <button
            onClick={logoutAll}
            disabled={loggingOutAll}
            className="w-full btn-ghost flex items-center justify-center gap-2 text-sm py-3"
          >
            {loggingOutAll ? <Spinner size={14} /> : <Shield size={16} />} Sign Out All Devices
          </button>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="border-red-500/20">
        <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2 text-sm"><Trash2 size={16} /> Danger Zone</h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 rounded-xl text-red-400 text-sm font-semibold border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors"
          >
            Delete Account & All Data
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm font-semibold">⚠️ This cannot be undone!</p>
              <p className="text-muted text-xs mt-1">All your workouts, meals, progress, and data will be permanently deleted.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 btn-ghost text-sm py-2.5">Cancel</button>
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                {deleting ? <Spinner size={14} /> : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Credits */}
      <div className="text-center py-4">
        <p className="text-muted text-xs">DreamPhysic AI · Built with ❤️ for fitness</p>
        <p className="text-muted text-xs mt-1">Powered by Gemini AI · Spring Boot Backend</p>
      </div>
    </div>
  );
}

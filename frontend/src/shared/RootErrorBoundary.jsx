import React, { Component } from 'react';

export class RootErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application render failed', error, info);
  }

  resetCacheAndReload = () => {
    try {
      localStorage.clear();
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        role="alert"
        className="flex min-h-screen min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center text-white"
        style={{ background: '#05070c' }}
      >
        <h1 className="text-xl font-bold">Dream Physic AI needs a fresh start</h1>
        <p className="max-w-md text-sm text-white/65">The app hit an unexpected error. Reset the local cache and reload to continue.</p>
        <button
          type="button"
          onClick={this.resetCacheAndReload}
          className="rounded-xl border border-teal-300/40 bg-teal-300/15 px-5 py-3 font-semibold text-teal-100 shadow-[0_0_24px_rgba(45,212,191,0.18)]"
        >
          Reset Cache &amp; Reload
        </button>
      </main>
    );
  }
}

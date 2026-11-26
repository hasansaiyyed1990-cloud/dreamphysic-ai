export async function scheduleRestTimerCompletion(seconds) {
  const delay = Math.max(0, Number(seconds) || 0) * 1000;
  try {
    let plugin = window.Capacitor?.Plugins?.LocalNotifications;
    if (!plugin) {
      const moduleName = '@capacitor/local-notifications';
      plugin = (await import(/* @vite-ignore */ moduleName)).LocalNotifications;
    }
    if (plugin) {
      await plugin.requestPermissions();
      await plugin.schedule({ notifications: [{ id: 8124, title: 'Rest complete', body: 'Your next workout set is ready.', schedule: { at: new Date(Date.now() + delay) } }] });
      return () => plugin.cancel({ notifications: [{ id: 8124 }] });
    }
  } catch {
    // Browser and web builds use the timer UI; no image or notification state is persisted.
  }
  const timer = window.setTimeout(() => {
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Rest complete', { body: 'Your next workout set is ready.' });
    }
  }, delay);
  return () => window.clearTimeout(timer);
}

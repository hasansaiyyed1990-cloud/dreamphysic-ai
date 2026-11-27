/**
 * Exercise demo media for the workout screen.
 *
 * Animated GIFs come from ExerciseGymGifsDB: a static, keyless dataset served
 * from the jsDelivr CDN (no API key, no rate limit, long-lived cache).
 * Still frames from the backend exercise library are used as a fallback, and a
 * dumbbell icon is shown when neither is available.
 */

const GIF_CDN = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';
const GIF_INDEX_URL = `${GIF_CDN}/api/en/exercises.json`;

// Hand-checked GIF for every exercise in the built-in swap database, so the
// default workout never shows a "close enough" wrong demonstration.
const CURATED_GIFS = {
  'barbell-bench-press': 'pectorals/barbell-bench-press.gif',
  'dumbbell-bench-press': 'pectorals/dumbbell-bench-press.gif',
  'incline-dumbbell-press': 'pectorals/dumbbell-incline-alternate-press.gif',
  'machine-chest-press': 'pectorals/lever-chest-press.gif',
  'cable-fly': 'pectorals/cable-cross-over-variation.gif',
  'push-up': 'pectorals/push-up.gif',
  'lat-pulldown': 'lats/cable-lat-pulldown-full-range-of-motion.gif',
  'pull-up': 'lats/pull-up.gif',
  'assisted-pull-up': 'lats/assisted-pull-up.gif',
  'straight-arm-pulldown': 'lats/cable-straight-arm-pulldown.gif',
  'wide-grip-seated-row': 'upper-back/lever-seated-row.gif',
  'barbell-row': 'upper-back/barbell-bent-over-row.gif',
  'chest-supported-row': 'upper-back/lever-bent-over-row.gif',
  'seated-cable-row': 'upper-back/cable-seated-row.gif',
  'one-arm-dumbbell-row': 'upper-back/dumbbell-one-arm-bent-over-row.gif',
  deadlift: 'glutes/barbell-deadlift.gif',
  'overhead-press': 'delts/barbell-seated-overhead-press.gif',
  'dumbbell-shoulder-press': 'delts/dumbbell-seated-shoulder-press.gif',
  'lateral-raise': 'delts/dumbbell-lateral-raise.gif',
  'cable-lateral-raise': 'delts/cable-lateral-raise.gif',
  'rear-delt-fly': 'delts/dumbbell-rear-delt-raise.gif',
  'barbell-curl': 'biceps/barbell-curl.gif',
  'dumbbell-curl': 'biceps/dumbbell-biceps-curl.gif',
  'hammer-curl': 'biceps/dumbbell-hammer-curl.gif',
  'cable-curl': 'biceps/cable-curl.gif',
  'cable-pushdown': 'triceps/cable-pushdown.gif',
  'overhead-cable-extension': 'triceps/cable-high-pulley-overhead-tricep-extension.gif',
  'close-grip-bench-press': 'triceps/barbell-close-grip-bench-press.gif',
  'bench-dip': 'triceps/three-bench-dip.gif',
  'barbell-squat': 'glutes/barbell-full-squat-side-pov.gif',
  'leg-press': 'glutes/sled-45-leg-press.gif',
  'romanian-deadlift': 'glutes/barbell-romanian-deadlift.gif',
  'leg-extension': 'quads/lever-leg-extension.gif',
  'leg-curl': 'hamstrings/lever-lying-leg-curl.gif',
  'calf-raise': 'calves/barbell-standing-calf-raise.gif',
  'cable-crunch': 'abs/cable-kneeling-crunch.gif',
  'hanging-leg-raise': 'abs/hanging-leg-raise.gif',
  plank: 'abs/weighted-front-plank.gif',
  'dead-bug': 'abs/dead-bug.gif',
};

export function curatedGifUrl(exerciseId) {
  const path = CURATED_GIFS[String(exerciseId || '').toLowerCase()];
  return path ? `${GIF_CDN}/${path}` : '';
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

let indexPromise = null;

/** Loads (once per session) the name -> GIF index used for user-typed exercises. */
export function loadGifIndex() {
  if (!indexPromise) {
    indexPromise = fetch(GIF_INDEX_URL, { cache: 'force-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : payload?.exercises;
        if (!Array.isArray(list)) return [];
        return list
          .map((item) => {
            const key = normalize(item?.name);
            const url = item?.gifUrl || (item?.file ? `${GIF_CDN}/${item.file}` : '');
            return url ? { key, tokens: key.split(' ').filter(Boolean), url } : null;
          })
          .filter(Boolean);
      })
      .catch(() => []);
  }
  return indexPromise;
}

/**
 * Best-effort match for a free-text exercise name. Every word typed must appear
 * in the candidate name, and the shortest matching name wins.
 */
export function matchGif(index, exerciseName) {
  const query = normalize(exerciseName);
  if (!query || !Array.isArray(index) || index.length === 0) return '';
  const queryTokens = query.split(' ').filter(Boolean);
  let best = '';
  let bestScore = 0;
  for (const item of index) {
    if (item.key === query) return item.url;
    // Library names carry extra words ("barbell bench press medium grip"), so a
    // candidate may miss a word or two as long as most of the name matches.
    const matched = queryTokens.filter((word) => item.tokens.some((token) => token === word || token.startsWith(word))).length;
    const coverage = matched / queryTokens.length;
    if (coverage < 0.6) continue;
    const score = coverage * (2 * queryTokens.length) / (queryTokens.length + item.tokens.length);
    if (score > bestScore) {
      bestScore = score;
      best = item.url;
    }
  }
  return bestScore >= 0.4 ? best : '';
}

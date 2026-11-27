// Body-part organisation + bilingual (English/Hinglish) copy for the workout screen.
// The exercise library groups movement by anatomical muscle ("Lats", "Quadriceps");
// lifters train by body part ("Back", "Legs"), so everything is bucketed here.

export const BODY_PARTS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Other'];

export const PART_MUSCLES = {
  Chest: ['Chest'],
  Back: ['Lats', 'Middle Back', 'Lower Back', 'Traps', 'Back'],
  Shoulders: ['Shoulders', 'Neck'],
  Biceps: ['Biceps', 'Forearms'],
  Triceps: ['Triceps'],
  Legs: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors', 'Legs'],
  Core: ['Abdominals'],
  Other: [],
};

export const PART_LABELS = {
  Chest: { en: 'Chest', hi: 'Seena' },
  Back: { en: 'Back', hi: 'Peeth' },
  Shoulders: { en: 'Shoulders', hi: 'Kandhe' },
  Biceps: { en: 'Biceps', hi: 'Biceps · Baazu' },
  Triceps: { en: 'Triceps', hi: 'Triceps · Baazu ke peeche' },
  Legs: { en: 'Legs', hi: 'Taangein' },
  Core: { en: 'Core', hi: 'Pet / Core' },
  Other: { en: 'Other', hi: 'Baaki' },
};

export function bodyPartOf(muscleGroup) {
  const match = Object.entries(PART_MUSCLES).find(
    ([part, muscles]) => part !== 'Other' && muscles.includes(muscleGroup),
  );
  return match ? match[0] : 'Other';
}

export function bodyPartIndex(exercise) {
  const index = BODY_PARTS.indexOf(exercise?.muscle || 'Other');
  return index === -1 ? BODY_PARTS.length : index;
}

// Short form cues per body part, in Hinglish. Shown above the English steps so a
// beginner understands the movement without translating every sentence.
export const MUSCLE_CUES = {
  Chest: {
    hi: [
      'Bench par shoulder blades ko peeche set kar, chest thoda upar.',
      'Weight ko control se neeche le — bounce bilkul nahi.',
      'Press karte waqt chest squeeze kar, elbow 45° ke aas-paas.',
    ],
  },
  Back: {
    hi: [
      'Pehle shoulders neeche kheencho, phir elbow bend karo.',
      'Weight ko chest/naabhi tak la, jhatka mat do.',
      'Wapas jaate waqt slow release — back straight, jerk nahi.',
    ],
  },
  Shoulders: {
    hi: [
      'Ribs andar rakho, kamar ko mat modna.',
      'Wrist elbow ke upar, seedha upar press karo.',
      'Form saaf hone tak weight halka hi rakho.',
    ],
  },
  Biceps: {
    hi: [
      'Elbow ko body ke paas fix rakho, shoulder se mat kheencho.',
      'Sirf forearm uthao — momentum nahi.',
      'Neeche aate waqt 2–3 second slow.',
    ],
  },
  Triceps: {
    hi: [
      'Elbow ko ek jagah fix rakho, sirf hath neeche-upar.',
      'Poora extension par triceps squeeze kar.',
      'Wapas aate waqt elbow ko aage-peeche mat hilao.',
    ],
  },
  Legs: {
    hi: [
      'Pairon ka poora sole zameen par, heels nahi uthenge.',
      'Knees ko toes ki direction me rakho — andar mat girne do.',
      'Neeche jaate waqt control, upar aate waqt drive from legs.',
    ],
  },
  Core: {
    hi: [
      'Kamar ko zameen/neutral me rakho, lower back arch nahi.',
      'Saans chhodo effort par, andar kheencho wapas aate waqt.',
      'Slow reps fast se better hain — abs me squeeze mehsoos ho.',
    ],
  },
  Other: {
    hi: [
      'Setup comfortable ho tab hi weight badhao.',
      'Har rep control me — jhatka lagne par weight kam kar.',
      'Dard ho to ruk jao, pain ke saath train mat karo.',
    ],
  },
};

export function cuesFor(muscleGroup) {
  return MUSCLE_CUES[bodyPartOf(muscleGroup)]?.hi || MUSCLE_CUES.Other.hi;
}

// Gym me log "latpull down", "legpress", "benchpress" jaisa likhte hain — spaces
// hatakar aur case ignore karke match karo, warna kuch bhi nahi milta.
export function normalizeTerm(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function matchesExercise(entry, rawQuery) {
  const query = normalizeTerm(rawQuery);
  if (!query) return true;
  if (!entry) return false;
  const hay = normalizeTerm(
    `${entry.name || ''} ${entry.muscleGroup || ''} ${entry.equipment || ''} ${(entry.primaryMuscles || []).join(' ')} ${(entry.secondaryMuscles || []).join(' ')}`,
  );
  if (hay.includes(query)) return true;
  const compactHay = hay.replace(/ /g, '');
  const compactQuery = query.replace(/ /g, '');
  if (compactHay.includes(compactQuery)) return true;
  // "latpull down" → words: latpull + down — har word kisi bhi jagah mile to chalega.
  return query.split(' ').filter(Boolean).every(word => hay.includes(word) || compactHay.includes(word));
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

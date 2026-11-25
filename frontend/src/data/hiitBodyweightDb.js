/**
 * HIIT and bodyweight exercise database for DreamPhysic AI.
 */

/**
 * @typedef {'Jumping/Explosive' | 'Core/Cardio' | 'Low-Impact (Apartment/Indoor Friendly)'} HiitCategory
 * @typedef {'Beginner' | 'Intermediate' | 'Advanced'} Difficulty
 */

/**
 * @typedef {Object} HiitExercise
 * @property {string} id
 * @property {string} name
 * @property {HiitCategory} category
 * @property {string[]} targetMuscles
 * @property {Difficulty} difficulty
 * @property {string} beginnerAlternative
 * @property {string} commonMistake
 * @property {number} defaultWorkSeconds
 */

/**
 * @typedef {Object} HiitCircuitTemplate
 * @property {string} id
 * @property {string} name
 * @property {number} durationMinutes
 * @property {number} rounds
 * @property {number} workSeconds
 * @property {number} restSeconds
 * @property {string[]} exerciseIds
 * @property {string} notes
 */

/** @type {Record<HiitCategory, HiitExercise[]>} */
export const HIIT_BODYWEIGHT_DB = {
  'Jumping/Explosive': [
    { id: 'burpee', name: 'Burpee', category: 'Jumping/Explosive', targetMuscles: ['Full Body', 'Chest', 'Legs'], difficulty: 'Advanced', beginnerAlternative: 'Step-back burpee without jump', commonMistake: 'Letting hips sag during the push-up position', defaultWorkSeconds: 30 },
    { id: 'jump-squat', name: 'Jump Squat', category: 'Jumping/Explosive', targetMuscles: ['Quads', 'Glutes', 'Calves'], difficulty: 'Intermediate', beginnerAlternative: 'Bodyweight squat to calf raise', commonMistake: 'Landing with knees caving inward', defaultWorkSeconds: 30 },
    { id: 'jumping-jack', name: 'Jumping Jack', category: 'Jumping/Explosive', targetMuscles: ['Calves', 'Shoulders', 'Cardio'], difficulty: 'Beginner', beginnerAlternative: 'Step jack', commonMistake: 'Half reps with arms not reaching overhead', defaultWorkSeconds: 40 },
    { id: 'high-knees', name: 'High Knees', category: 'Jumping/Explosive', targetMuscles: ['Hip Flexors', 'Core', 'Calves'], difficulty: 'Intermediate', beginnerAlternative: 'Marching in place', commonMistake: 'Leaning back instead of staying tall', defaultWorkSeconds: 30 },
    { id: 'tuck-jump', name: 'Tuck Jump', category: 'Jumping/Explosive', targetMuscles: ['Quads', 'Glutes', 'Core'], difficulty: 'Advanced', beginnerAlternative: 'Jump squat', commonMistake: 'Landing stiff-legged without absorbing force', defaultWorkSeconds: 20 },
    { id: 'skater-jump', name: 'Skater Jump', category: 'Jumping/Explosive', targetMuscles: ['Glutes', 'Quads', 'Obliques'], difficulty: 'Intermediate', beginnerAlternative: 'Lateral step touch', commonMistake: 'Letting the knee collapse inward on landing', defaultWorkSeconds: 30 },
    { id: 'plyo-lunge', name: 'Plyo Lunge', category: 'Jumping/Explosive', targetMuscles: ['Quads', 'Glutes', 'Calves'], difficulty: 'Advanced', beginnerAlternative: 'Reverse lunge', commonMistake: 'Front knee travelling too far forward with poor balance', defaultWorkSeconds: 20 },
  ],
  'Core/Cardio': [
    { id: 'mountain-climber', name: 'Mountain Climber', category: 'Core/Cardio', targetMuscles: ['Core', 'Hip Flexors', 'Shoulders'], difficulty: 'Intermediate', beginnerAlternative: 'Slow mountain climber', commonMistake: 'Hips bouncing high instead of staying level', defaultWorkSeconds: 30 },
    { id: 'bicycle-crunch', name: 'Bicycle Crunch', category: 'Core/Cardio', targetMuscles: ['Abs', 'Obliques'], difficulty: 'Intermediate', beginnerAlternative: 'Dead bug', commonMistake: 'Pulling the neck instead of rotating the ribs', defaultWorkSeconds: 30 },
    { id: 'plank-shoulder-tap', name: 'Plank Shoulder Tap', category: 'Core/Cardio', targetMuscles: ['Core', 'Shoulders', 'Glutes'], difficulty: 'Intermediate', beginnerAlternative: 'Knee plank shoulder tap', commonMistake: 'Rocking hips side to side', defaultWorkSeconds: 30 },
    { id: 'russian-twist', name: 'Russian Twist', category: 'Core/Cardio', targetMuscles: ['Obliques', 'Abs'], difficulty: 'Beginner', beginnerAlternative: 'Feet-down Russian twist', commonMistake: 'Moving only the arms without rotating the torso', defaultWorkSeconds: 30 },
    { id: 'bear-crawl', name: 'Bear Crawl', category: 'Core/Cardio', targetMuscles: ['Core', 'Shoulders', 'Quads'], difficulty: 'Intermediate', beginnerAlternative: 'Bear hold', commonMistake: 'Hips lifting too high and losing core tension', defaultWorkSeconds: 30 },
    { id: 'inchworm', name: 'Inchworm', category: 'Core/Cardio', targetMuscles: ['Core', 'Shoulders', 'Hamstrings'], difficulty: 'Beginner', beginnerAlternative: 'Walkout to plank without push-up', commonMistake: 'Bending knees too much and skipping the plank brace', defaultWorkSeconds: 40 },
    { id: 'flutter-kick', name: 'Flutter Kick', category: 'Core/Cardio', targetMuscles: ['Lower Abs', 'Hip Flexors'], difficulty: 'Intermediate', beginnerAlternative: 'Bent-knee flutter kick', commonMistake: 'Lower back arching off the floor', defaultWorkSeconds: 30 },
  ],
  'Low-Impact (Apartment/Indoor Friendly)': [
    { id: 'step-jack', name: 'Step Jack', category: 'Low-Impact (Apartment/Indoor Friendly)', targetMuscles: ['Calves', 'Shoulders', 'Cardio'], difficulty: 'Beginner', beginnerAlternative: 'Marching in place', commonMistake: 'Moving too slowly to raise heart rate', defaultWorkSeconds: 40 },
    { id: 'standing-knee-raise', name: 'Standing Knee Raise', category: 'Low-Impact (Apartment/Indoor Friendly)', targetMuscles: ['Core', 'Hip Flexors'], difficulty: 'Beginner', beginnerAlternative: 'Marching in place', commonMistake: 'Leaning back to lift the knee', defaultWorkSeconds: 40 },
    { id: 'glute-bridge', name: 'Glute Bridge', category: 'Low-Impact (Apartment/Indoor Friendly)', targetMuscles: ['Glutes', 'Hamstrings'], difficulty: 'Beginner', beginnerAlternative: 'Glute bridge hold', commonMistake: 'Over-arching the lower back at the top', defaultWorkSeconds: 40 },
    { id: 'wall-sit', name: 'Wall Sit', category: 'Low-Impact (Apartment/Indoor Friendly)', targetMuscles: ['Quads', 'Glutes'], difficulty: 'Beginner', beginnerAlternative: 'Higher wall sit', commonMistake: 'Knees caving inward', defaultWorkSeconds: 40 },
    { id: 'bird-dog', name: 'Bird Dog', category: 'Low-Impact (Apartment/Indoor Friendly)', targetMuscles: ['Core', 'Glutes', 'Back'], difficulty: 'Beginner', beginnerAlternative: 'Arm-only bird dog', commonMistake: 'Rotating hips instead of keeping them square', defaultWorkSeconds: 40 },
    { id: 'dead-bug-hiit', name: 'Dead Bug', category: 'Low-Impact (Apartment/Indoor Friendly)', targetMuscles: ['Core'], difficulty: 'Beginner', beginnerAlternative: 'Heel tap dead bug', commonMistake: 'Lower back lifting off the floor', defaultWorkSeconds: 40 },
    { id: 'bodyweight-calf-raise', name: 'Bodyweight Calf Raise', category: 'Low-Impact (Apartment/Indoor Friendly)', targetMuscles: ['Calves'], difficulty: 'Beginner', beginnerAlternative: 'Double-leg calf raise hold', commonMistake: 'Bouncing instead of pausing at the top', defaultWorkSeconds: 40 },
    { id: 'marching-in-place', name: 'Marching in Place', category: 'Low-Impact (Apartment/Indoor Friendly)', targetMuscles: ['Hip Flexors', 'Calves', 'Cardio'], difficulty: 'Beginner', beginnerAlternative: 'Slow march', commonMistake: 'Slouching instead of staying tall', defaultWorkSeconds: 40 },
  ],
};

/** @type {HiitExercise[]} */
export const HIIT_EXERCISES = Object.values(HIIT_BODYWEIGHT_DB).flat();

/** @type {HiitCircuitTemplate[]} */
export const HIIT_CIRCUIT_TEMPLATES = [
  {
    id: '10-min-fat-burn',
    name: '10-Min Fat Burn',
    durationMinutes: 10,
    rounds: 2,
    workSeconds: 30,
    restSeconds: 15,
    exerciseIds: ['jumping-jack', 'jump-squat', 'mountain-climber', 'high-knees', 'burpee'],
    notes: 'Short full-body burner. Use beginner alternatives if form breaks.',
  },
  {
    id: '15-min-apartment-no-jump',
    name: '15-Min Apartment No-Jump',
    durationMinutes: 15,
    rounds: 3,
    workSeconds: 40,
    restSeconds: 20,
    exerciseIds: ['step-jack', 'standing-knee-raise', 'glute-bridge', 'wall-sit', 'marching-in-place'],
    notes: 'Low-noise indoor circuit for apartment training.',
  },
  {
    id: '20-min-stamina-booster',
    name: '20-Min Stamina Booster',
    durationMinutes: 20,
    rounds: 4,
    workSeconds: 30,
    restSeconds: 15,
    exerciseIds: ['high-knees', 'skater-jump', 'mountain-climber', 'jump-squat', 'bear-crawl'],
    notes: 'Builds work capacity with short rests and repeatable rounds.',
  },
  {
    id: 'core-finisher',
    name: 'Core Finisher',
    durationMinutes: 8,
    rounds: 2,
    workSeconds: 30,
    restSeconds: 15,
    exerciseIds: ['dead-bug-hiit', 'plank-shoulder-tap', 'bicycle-crunch', 'flutter-kick', 'bird-dog'],
    notes: 'Use after strength training or as a standalone core session.',
  },
];

export default HIIT_BODYWEIGHT_DB;

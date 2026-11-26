/**
 * Gym exercise swap database for DreamPhysic AI.
 *
 * Alternatives are exercise IDs from this same file so the UI can offer
 * one-tap swaps when a bench or machine is busy.
 */

/**
 * @typedef {'WEIGHT_REPS' | 'BODYWEIGHT_REPS' | 'TIME_SECONDS'} TrackingType
 * @typedef {'PER_HAND' | 'TOTAL'} WeightMode
 * @typedef {'Chest' | 'Back Width' | 'Back Thickness' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Legs' | 'Core'} MuscleGroup
 */

/**
 * @typedef {Object} GymExercise
 * @property {string} id
 * @property {string} name
 * @property {MuscleGroup} muscleGroup
 * @property {TrackingType} defaultTrackingType
 * @property {WeightMode} weightMode
 * @property {number} incrementKg
 * @property {string[]} sameMuscleAlternatives
 */

/** @type {Record<MuscleGroup, GymExercise[]>} */
export const GYM_EXERCISE_SWAP_DB = {
  Chest: [
    { id: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroup: 'Chest', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['dumbbell-bench-press', 'machine-chest-press', 'push-up'] },
    { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscleGroup: 'Chest', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 2.5, sameMuscleAlternatives: ['barbell-bench-press', 'machine-chest-press', 'push-up'] },
    { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 2.5, sameMuscleAlternatives: ['dumbbell-bench-press', 'machine-chest-press', 'cable-fly'] },
    { id: 'machine-chest-press', name: 'Machine Chest Press', muscleGroup: 'Chest', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['dumbbell-bench-press', 'barbell-bench-press', 'push-up'] },
    { id: 'cable-fly', name: 'Cable Fly', muscleGroup: 'Chest', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['dumbbell-bench-press', 'machine-chest-press', 'push-up'] },
    { id: 'push-up', name: 'Push-Up', muscleGroup: 'Chest', defaultTrackingType: 'BODYWEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['dumbbell-bench-press', 'machine-chest-press', 'cable-fly'] },
  ],
  'Back Width': [
    { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back Width', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['assisted-pull-up', 'pull-up', 'straight-arm-pulldown'] },
    { id: 'pull-up', name: 'Pull-Up', muscleGroup: 'Back Width', defaultTrackingType: 'BODYWEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['lat-pulldown', 'assisted-pull-up', 'straight-arm-pulldown'] },
    { id: 'assisted-pull-up', name: 'Assisted Pull-Up', muscleGroup: 'Back Width', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['lat-pulldown', 'pull-up', 'wide-grip-seated-row'] },
    { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', muscleGroup: 'Back Width', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['lat-pulldown', 'assisted-pull-up', 'wide-grip-seated-row'] },
    { id: 'wide-grip-seated-row', name: 'Wide-Grip Seated Row', muscleGroup: 'Back Width', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['lat-pulldown', 'straight-arm-pulldown', 'assisted-pull-up'] },
  ],
  'Back Thickness': [
    { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back Thickness', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['chest-supported-row', 'seated-cable-row', 'one-arm-dumbbell-row'] },
    { id: 'chest-supported-row', name: 'Chest-Supported Row', muscleGroup: 'Back Thickness', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['seated-cable-row', 'barbell-row', 'one-arm-dumbbell-row'] },
    { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroup: 'Back Thickness', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['chest-supported-row', 'one-arm-dumbbell-row', 'barbell-row'] },
    { id: 'one-arm-dumbbell-row', name: 'One-Arm Dumbbell Row', muscleGroup: 'Back Thickness', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 2.5, sameMuscleAlternatives: ['seated-cable-row', 'chest-supported-row', 'barbell-row'] },
    { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back Thickness', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['barbell-row', 'chest-supported-row', 'seated-cable-row'] },
  ],
  Shoulders: [
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['dumbbell-shoulder-press', 'lateral-raise', 'cable-lateral-raise'] },
    { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 2.5, sameMuscleAlternatives: ['overhead-press', 'lateral-raise', 'cable-lateral-raise'] },
    { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 1.25, sameMuscleAlternatives: ['cable-lateral-raise', 'dumbbell-shoulder-press', 'rear-delt-fly'] },
    { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 1.25, sameMuscleAlternatives: ['lateral-raise', 'dumbbell-shoulder-press', 'rear-delt-fly'] },
    { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'Shoulders', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 1.25, sameMuscleAlternatives: ['cable-lateral-raise', 'lateral-raise', 'dumbbell-shoulder-press'] },
  ],
  Biceps: [
    { id: 'barbell-curl', name: 'Barbell Curl', muscleGroup: 'Biceps', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['dumbbell-curl', 'cable-curl', 'hammer-curl'] },
    { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroup: 'Biceps', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 1.25, sameMuscleAlternatives: ['cable-curl', 'barbell-curl', 'hammer-curl'] },
    { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Biceps', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'PER_HAND', incrementKg: 1.25, sameMuscleAlternatives: ['dumbbell-curl', 'cable-curl', 'barbell-curl'] },
    { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'Biceps', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['dumbbell-curl', 'barbell-curl', 'hammer-curl'] },
  ],
  Triceps: [
    { id: 'cable-pushdown', name: 'Cable Pushdown', muscleGroup: 'Triceps', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['overhead-cable-extension', 'close-grip-bench-press', 'bench-dip'] },
    { id: 'overhead-cable-extension', name: 'Overhead Cable Extension', muscleGroup: 'Triceps', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['cable-pushdown', 'close-grip-bench-press', 'bench-dip'] },
    { id: 'close-grip-bench-press', name: 'Close-Grip Bench Press', muscleGroup: 'Triceps', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['cable-pushdown', 'overhead-cable-extension', 'bench-dip'] },
    { id: 'bench-dip', name: 'Bench Dip', muscleGroup: 'Triceps', defaultTrackingType: 'BODYWEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['cable-pushdown', 'overhead-cable-extension', 'close-grip-bench-press'] },
  ],
  Legs: [
    { id: 'barbell-squat', name: 'Barbell Squat', muscleGroup: 'Legs', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['leg-press', 'leg-extension', 'romanian-deadlift'] },
    { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Legs', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['barbell-squat', 'leg-extension', 'leg-curl'] },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Legs', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['leg-curl', 'barbell-squat', 'leg-press'] },
    { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Legs', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['leg-press', 'barbell-squat', 'leg-curl'] },
    { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'Legs', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['romanian-deadlift', 'leg-press', 'leg-extension'] },
    { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'Legs', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 2.5, sameMuscleAlternatives: ['leg-press', 'leg-extension', 'leg-curl'] },
  ],
  Core: [
    { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'Core', defaultTrackingType: 'WEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['hanging-leg-raise', 'dead-bug', 'plank'] },
    { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'Core', defaultTrackingType: 'BODYWEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['cable-crunch', 'dead-bug', 'plank'] },
    { id: 'plank', name: 'Plank', muscleGroup: 'Core', defaultTrackingType: 'TIME_SECONDS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['dead-bug', 'cable-crunch', 'hanging-leg-raise'] },
    { id: 'dead-bug', name: 'Dead Bug', muscleGroup: 'Core', defaultTrackingType: 'BODYWEIGHT_REPS', weightMode: 'TOTAL', incrementKg: 1.25, sameMuscleAlternatives: ['plank', 'cable-crunch', 'hanging-leg-raise'] },
  ],
};

/** @type {GymExercise[]} */
export const GYM_EXERCISES = Object.values(GYM_EXERCISE_SWAP_DB).flat();

export default GYM_EXERCISE_SWAP_DB;

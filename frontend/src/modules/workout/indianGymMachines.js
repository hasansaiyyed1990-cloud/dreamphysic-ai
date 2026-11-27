// Machines jo Indian gyms me sabse zyada milti hain, unke local (gym) naam.
// Library me yehi machines English coaching names se hain ("Lever Chest Press",
// "Sled 45 Leg Press") — gym me koi "pec deck" ya "leg press machine" bolta hai,
// isliye yahan wo naam + verified GIF path + body part rakhe gaye hain.
// `match` = exercise library ka wahi exercise, jisse steps/muscles mil jayein.

export const GIF_BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/';

const RAW = [
  // Chest
  { id: 'chest-press-machine', name: 'Chest Press Machine', hi: 'Machine chest press · seena', muscle: 'Chest', muscleGroup: 'pectorals', gif: 'pectorals/lever-chest-press.gif', match: 'Lever Chest Press', aliases: 'chest press machine bench press machine' },
  { id: 'incline-chest-press-machine', name: 'Incline Chest Press Machine', hi: 'Upper chest ke liye incline machine', muscle: 'Chest', muscleGroup: 'pectorals', gif: 'pectorals/lever-incline-chest-press.gif', match: 'Lever Incline Chest Press', aliases: 'incline chest press upper chest machine' },
  { id: 'pec-deck', name: 'Pec Deck / Butterfly Machine', hi: 'Butterfly machine · chest squeeze', muscle: 'Chest', muscleGroup: 'pectorals', gif: 'pectorals/lever-seated-fly.gif', match: 'Lever Seated Fly', aliases: 'pec deck butterfly chest fly machine' },
  { id: 'cable-crossover', name: 'Cable Crossover', hi: 'Cable crossover · chest ka tamasha', muscle: 'Chest', muscleGroup: 'pectorals', gif: 'pectorals/cable-cross-over-variation.gif', match: 'Cable Cross Over Variation', aliases: 'cable crossover crossover cable fly' },
  { id: 'smith-bench-press', name: 'Smith Machine Bench Press', hi: 'Smith machine par bench press', muscle: 'Chest', muscleGroup: 'pectorals', gif: 'pectorals/smith-bench-press.gif', match: 'Smith Bench Press', aliases: 'smith machine bench press' },

  // Back
  { id: 'lat-pulldown-machine', name: 'Lat Pulldown Machine', hi: 'Lat pulldown · peeth chaudi', muscle: 'Back', muscleGroup: 'lats', gif: 'lats/cable-lat-pulldown-full-range-of-motion.gif', match: 'Cable Lat Pulldown Full Range Of Motion', aliases: 'lat pulldown latpull lat machine' },
  { id: 'front-lat-pulldown-bar', name: 'Front Lat Pulldown (Straight Bar)', hi: 'Seedha bar wala pulldown', muscle: 'Back', muscleGroup: 'lats', gif: 'lats/cable-bar-lateral-pulldown.gif', match: 'Cable Bar Lateral Pulldown', aliases: 'front lat pulldown straight bar pulldown' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', hi: 'Baithe hue cable row · peeth', muscle: 'Back', muscleGroup: 'upper-back', gif: 'upper-back/cable-low-seated-row.gif', match: 'Cable Low Seated Row', aliases: 'seated cable row rowing machine' },
  { id: 't-bar-row-machine', name: 'T-Bar Row (Machine / V-Bar)', hi: 'T-bar row · middle back', muscle: 'Back', muscleGroup: 'upper-back', gif: 'upper-back/lever-bent-over-row-with-v-bar.gif', match: 'Lever Bent Over Row With V Bar', aliases: 't bar row tbar row bent over row machine' },
  { id: 'assisted-pull-up', name: 'Assisted Pull-Up Machine', hi: 'Assisted pull up · back + biceps', muscle: 'Back', muscleGroup: 'lats', gif: 'lats/assisted-pull-up.gif', match: 'Assisted Pull Up', aliases: 'assisted pull up machine pullup' },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', hi: 'Haath seedha rakho, lats ko squeeze', muscle: 'Back', muscleGroup: 'lats', gif: 'lats/cable-pushdown-straight-arm-v-2.gif', match: 'Cable Pushdown Straight Arm v2', aliases: 'straight arm pulldown lat pushdown' },

  // Shoulders
  { id: 'shoulder-press-machine', name: 'Shoulder Press Machine', hi: 'Machine shoulder press · kandhe', muscle: 'Shoulders', muscleGroup: 'delts', gif: 'delts/lever-shoulder-press.gif', match: 'Lever Shoulder Press', aliases: 'shoulder press machine military press machine' },
  { id: 'rear-delt-machine', name: 'Rear Delt Machine (Reverse Pec Deck)', hi: 'Peeche ka delt · reverse butterfly', muscle: 'Shoulders', muscleGroup: 'delts', gif: 'delts/lever-seated-reverse-fly.gif', match: 'Lever Seated Reverse Fly', aliases: 'rear delt machine reverse pec deck back fly' },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', hi: 'Side me haath uthao · kandhe', muscle: 'Shoulders', muscleGroup: 'delts', gif: 'delts/cable-lateral-raise.gif', match: 'Cable Lateral Raise', aliases: 'cable side lateral raise' },
  { id: 'rope-face-pull', name: 'Rope Face Pull', hi: 'Chehre ki taraf rope kheencho · rear delt', muscle: 'Shoulders', muscleGroup: 'delts', gif: 'delts/cable-kneeling-rear-delt-row-with-rope-male.gif', match: 'Cable Kneeling Rear Delt Row With Rope', aliases: 'face pull rope face pull rear delt rope' },

  // Biceps
  { id: 'preacher-curl-machine', name: 'Preacher Curl Machine', hi: 'Preacher bench par biceps', muscle: 'Biceps', muscleGroup: 'biceps', gif: 'biceps/lever-preacher-curl.gif', match: 'Lever Preacher Curl', aliases: 'preacher curl machine biceps machine' },
  { id: 'cable-curl-bar', name: 'Cable Curl (Bar)', hi: 'Cable se biceps curl', muscle: 'Biceps', muscleGroup: 'biceps', gif: 'biceps/cable-curl.gif', match: 'Cable Curl', aliases: 'cable curl bar biceps' },
  { id: 'ez-bar-curl', name: 'EZ-Bar Curl', hi: 'EZ bar curl · wrist easy', muscle: 'Biceps', muscleGroup: 'biceps', gif: 'biceps/ez-barbell-curl.gif', match: 'Ez Barbell Curl', aliases: 'ez bar curl easy bar curl' },
  { id: 'rope-hammer-curl', name: 'Rope Hammer Curl', hi: 'Rope se hammer curl · baazu mota', muscle: 'Biceps', muscleGroup: 'biceps', gif: 'biceps/cable-hammer-curl-with-rope.gif', match: 'Cable Hammer Curl With Rope', aliases: 'rope hammer curl hammer curl cable' },

  // Triceps
  { id: 'triceps-rope-pushdown', name: 'Triceps Rope Pushdown', hi: 'Rope pushdown · triceps', muscle: 'Triceps', muscleGroup: 'triceps', gif: 'triceps/cable-pushdown-with-rope-attachment.gif', match: 'Cable Pushdown With Rope Attachment', aliases: 'rope pushdown triceps pushdown rope' },
  { id: 'v-bar-pushdown', name: 'V-Bar Pushdown', hi: 'V-bar se pushdown', muscle: 'Triceps', muscleGroup: 'triceps', gif: 'triceps/cable-pushdown.gif', match: 'Cable Pushdown', aliases: 'v bar pushdown triceps pushdown bar' },
  { id: 'overhead-rope-extension', name: 'Overhead Rope Extension', hi: 'Sar ke peeche rope · triceps long head', muscle: 'Triceps', muscleGroup: 'triceps', gif: 'triceps/cable-high-pulley-overhead-tricep-extension.gif', match: 'Cable High Pulley Overhead Tricep Extension', aliases: 'overhead triceps extension rope overhead' },
  { id: 'dip-machine', name: 'Dip Machine', hi: 'Machine dip · triceps + chest', muscle: 'Triceps', muscleGroup: 'triceps', gif: 'triceps/lever-seated-dip.gif', match: 'Lever Seated Dip', aliases: 'dip machine seated dip' },
  { id: 'assisted-dip', name: 'Assisted Dip Machine', hi: 'Assisted dip · triceps', muscle: 'Triceps', muscleGroup: 'triceps', gif: 'triceps/assisted-triceps-dip-kneeling.gif', match: 'Assisted Triceps Dip Kneeling', aliases: 'assisted dip machine triceps dip' },

  // Legs
  { id: 'leg-press-machine', name: 'Leg Press Machine', hi: 'Leg press · taangein + glutes', muscle: 'Legs', muscleGroup: 'glutes', gif: 'glutes/sled-45-leg-press.gif', match: 'Sled 45 Leg Press', aliases: 'leg press legpress leg press machine' },
  { id: 'hack-squat-machine', name: 'Hack Squat Machine', hi: 'Hack squat · quads', muscle: 'Legs', muscleGroup: 'glutes', gif: 'glutes/sled-hack-squat.gif', match: 'Sled Hack Squat', aliases: 'hack squat machine' },
  { id: 'leg-extension-machine', name: 'Leg Extension Machine', hi: 'Leg extension · quads alag', muscle: 'Legs', muscleGroup: 'quads', gif: 'quads/lever-leg-extension.gif', match: 'Lever Leg Extension', aliases: 'leg extension machine quads' },
  { id: 'leg-curl-machine', name: 'Leg Curl Machine (Lying)', hi: 'Leg curl · hamstrings', muscle: 'Legs', muscleGroup: 'hamstrings', gif: 'hamstrings/lever-lying-leg-curl.gif', match: 'Lever Lying Leg Curl', aliases: 'leg curl machine hamstring curl' },
  { id: 'seated-calf-raise-machine', name: 'Seated Calf Raise Machine', hi: 'Baithe hue calf raise', muscle: 'Legs', muscleGroup: 'calves', gif: 'calves/lever-seated-calf-raise.gif', match: 'Lever Seated Calf Raise', aliases: 'seated calf raise machine calf machine' },
  { id: 'standing-calf-raise-machine', name: 'Standing Calf Raise Machine', hi: 'Khade hue calf raise', muscle: 'Legs', muscleGroup: 'calves', gif: 'calves/lever-standing-calf-raise.gif', match: 'Lever Standing Calf Raise', aliases: 'standing calf raise machine' },
  { id: 'calf-press-machine', name: 'Calf Press Machine', hi: 'Calf press · pindli', muscle: 'Legs', muscleGroup: 'calves', gif: 'calves/lever-calf-press.gif', match: 'Lever Calf Press', aliases: 'calf press machine' },
  { id: 'smith-squat', name: 'Smith Machine Squat', hi: 'Smith machine squat', muscle: 'Legs', muscleGroup: 'glutes', gif: 'glutes/smith-squat.gif', match: 'Smith Squat', aliases: 'smith machine squat smith squat' },
  { id: 'leg-press-calf-raise', name: 'Leg Press Calf Raise', hi: 'Leg press par calf raise', muscle: 'Legs', muscleGroup: 'calves', gif: 'calves/lever-seated-squat-calf-raise-on-leg-press-machine.gif', match: 'Lever Seated Squat Calf Raise On Leg Press Machine', aliases: 'leg press calf raise' },

  // Core
  { id: 'cable-crunch', name: 'Cable Crunch (Kneeling)', hi: 'Rope se crunch · abs', muscle: 'Core', muscleGroup: 'abs', gif: 'abs/cable-kneeling-crunch.gif', match: 'Cable Kneeling Crunch', aliases: 'cable crunch rope crunch abs' },
  { id: 'cable-seated-crunch', name: 'Cable Seated Crunch', hi: 'Machine par baithe hue crunch', muscle: 'Core', muscleGroup: 'abs', gif: 'abs/cable-seated-crunch.gif', match: 'Cable Seated Crunch', aliases: 'seated crunch machine abs' },
];

export const INDIAN_GYM_MACHINES = RAW.map(m => ({
  ...m,
  equipment: 'machine',
  primaryMuscles: [],
  secondaryMuscles: [],
  imageUrls: [GIF_BASE + m.gif],
  aliases: `${m.name} ${m.hi} ${m.aliases || ''}`,
}));

'use strict';

/**
 * Protocol — Exercise Database
 *
 * Comprehensive exercise library for bodybuilding training.
 * 120+ exercises covering all major muscle groups with equipment tags,
 * primary/secondary muscle mappings, and pre-built workout templates.
 *
 * CATEGORIES:
 *   chest, back, shoulders, biceps, triceps, quads, hamstrings,
 *   glutes, calves, abs, traps, forearms, cardio, compound
 *
 * EQUIPMENT:
 *   barbell, dumbbell, cable, machine, bodyweight, smith,
 *   kettlebell, bands, none
 */

const exercises = [

  // ═══════════════════════════════════════════════════════════════════════════
  //  CHEST
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'flat-barbell-bench-press',
    name: 'Flat Barbell Bench Press',
    category: 'chest',
    equipment: 'barbell',
    musclesPrimary: ['chest'],
    musclesSecondary: ['triceps', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'incline-barbell-bench-press',
    name: 'Incline Barbell Bench Press',
    category: 'chest',
    equipment: 'barbell',
    musclesPrimary: ['upper-chest'],
    musclesSecondary: ['triceps', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'decline-barbell-bench-press',
    name: 'Decline Barbell Bench Press',
    category: 'chest',
    equipment: 'barbell',
    musclesPrimary: ['lower-chest'],
    musclesSecondary: ['triceps', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'flat-dumbbell-bench-press',
    name: 'Flat Dumbbell Bench Press',
    category: 'chest',
    equipment: 'dumbbell',
    musclesPrimary: ['chest'],
    musclesSecondary: ['triceps', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'incline-dumbbell-bench-press',
    name: 'Incline Dumbbell Bench Press',
    category: 'chest',
    equipment: 'dumbbell',
    musclesPrimary: ['upper-chest'],
    musclesSecondary: ['triceps', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'decline-dumbbell-bench-press',
    name: 'Decline Dumbbell Bench Press',
    category: 'chest',
    equipment: 'dumbbell',
    musclesPrimary: ['lower-chest'],
    musclesSecondary: ['triceps', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    category: 'chest',
    equipment: 'cable',
    musclesPrimary: ['chest'],
    musclesSecondary: ['front-delts'],
    isCompound: false,
  },
  {
    id: 'pec-deck',
    name: 'Pec Deck Fly',
    category: 'chest',
    equipment: 'machine',
    musclesPrimary: ['chest'],
    musclesSecondary: ['front-delts'],
    isCompound: false,
  },
  {
    id: 'chest-dips',
    name: 'Dips (Chest)',
    category: 'chest',
    equipment: 'bodyweight',
    musclesPrimary: ['lower-chest'],
    musclesSecondary: ['triceps', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    category: 'chest',
    equipment: 'bodyweight',
    musclesPrimary: ['chest'],
    musclesSecondary: ['triceps', 'front-delts', 'core'],
    isCompound: true,
  },
  {
    id: 'chest-press-machine',
    name: 'Chest Press Machine',
    category: 'chest',
    equipment: 'machine',
    musclesPrimary: ['chest'],
    musclesSecondary: ['triceps', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'landmine-press',
    name: 'Landmine Press',
    category: 'chest',
    equipment: 'barbell',
    musclesPrimary: ['upper-chest'],
    musclesSecondary: ['front-delts', 'triceps', 'core'],
    isCompound: true,
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    category: 'chest',
    equipment: 'dumbbell',
    musclesPrimary: ['chest'],
    musclesSecondary: ['front-delts'],
    isCompound: false,
  },
  {
    id: 'incline-dumbbell-fly',
    name: 'Incline Dumbbell Fly',
    category: 'chest',
    equipment: 'dumbbell',
    musclesPrimary: ['upper-chest'],
    musclesSecondary: ['front-delts'],
    isCompound: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  BACK
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'conventional-deadlift',
    name: 'Deadlift',
    category: 'back',
    equipment: 'barbell',
    musclesPrimary: ['lower-back', 'glutes', 'hamstrings'],
    musclesSecondary: ['traps', 'lats', 'forearms', 'core'],
    isCompound: true,
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'back',
    equipment: 'barbell',
    musclesPrimary: ['lats', 'mid-back'],
    musclesSecondary: ['biceps', 'rear-delts', 'forearms'],
    isCompound: true,
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    category: 'back',
    equipment: 'dumbbell',
    musclesPrimary: ['lats', 'mid-back'],
    musclesSecondary: ['biceps', 'rear-delts'],
    isCompound: true,
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    category: 'back',
    equipment: 'barbell',
    musclesPrimary: ['mid-back', 'lats'],
    musclesSecondary: ['biceps', 'rear-delts', 'forearms'],
    isCompound: true,
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'back',
    equipment: 'cable',
    musclesPrimary: ['lats'],
    musclesSecondary: ['biceps', 'rear-delts', 'mid-back'],
    isCompound: true,
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    category: 'back',
    equipment: 'bodyweight',
    musclesPrimary: ['lats'],
    musclesSecondary: ['biceps', 'rear-delts', 'mid-back', 'forearms'],
    isCompound: true,
  },
  {
    id: 'chin-ups',
    name: 'Chin-Ups',
    category: 'back',
    equipment: 'bodyweight',
    musclesPrimary: ['lats', 'biceps'],
    musclesSecondary: ['mid-back', 'rear-delts', 'forearms'],
    isCompound: true,
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'back',
    equipment: 'cable',
    musclesPrimary: ['mid-back', 'lats'],
    musclesSecondary: ['biceps', 'rear-delts'],
    isCompound: true,
  },
  {
    id: 'seated-row-machine',
    name: 'Seated Row Machine',
    category: 'back',
    equipment: 'machine',
    musclesPrimary: ['mid-back', 'lats'],
    musclesSecondary: ['biceps', 'rear-delts'],
    isCompound: true,
  },
  {
    id: 'chest-supported-row',
    name: 'Chest-Supported Row',
    category: 'back',
    equipment: 'dumbbell',
    musclesPrimary: ['mid-back', 'lats'],
    musclesSecondary: ['biceps', 'rear-delts'],
    isCompound: true,
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    category: 'back',
    equipment: 'cable',
    musclesPrimary: ['rear-delts', 'mid-back'],
    musclesSecondary: ['traps', 'rotator-cuff'],
    isCompound: true,
  },
  {
    id: 'straight-arm-pulldown',
    name: 'Straight-Arm Pulldown',
    category: 'back',
    equipment: 'cable',
    musclesPrimary: ['lats'],
    musclesSecondary: ['rear-delts', 'triceps-long-head'],
    isCompound: false,
  },
  {
    id: 'pendlay-row',
    name: 'Pendlay Row',
    category: 'back',
    equipment: 'barbell',
    musclesPrimary: ['mid-back', 'lats'],
    musclesSecondary: ['biceps', 'rear-delts', 'lower-back'],
    isCompound: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  SHOULDERS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'overhead-press',
    name: 'Overhead Press (Barbell)',
    category: 'shoulders',
    equipment: 'barbell',
    musclesPrimary: ['front-delts', 'mid-delts'],
    musclesSecondary: ['triceps', 'upper-chest', 'core'],
    isCompound: true,
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    category: 'shoulders',
    equipment: 'dumbbell',
    musclesPrimary: ['front-delts', 'mid-delts'],
    musclesSecondary: ['triceps', 'upper-chest'],
    isCompound: true,
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    category: 'shoulders',
    equipment: 'dumbbell',
    musclesPrimary: ['mid-delts'],
    musclesSecondary: ['traps'],
    isCompound: false,
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    category: 'shoulders',
    equipment: 'dumbbell',
    musclesPrimary: ['front-delts'],
    musclesSecondary: ['upper-chest'],
    isCompound: false,
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    category: 'shoulders',
    equipment: 'dumbbell',
    musclesPrimary: ['rear-delts'],
    musclesSecondary: ['mid-back', 'traps'],
    isCompound: false,
  },
  {
    id: 'upright-row',
    name: 'Upright Row',
    category: 'shoulders',
    equipment: 'barbell',
    musclesPrimary: ['mid-delts', 'traps'],
    musclesSecondary: ['front-delts', 'biceps'],
    isCompound: true,
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    category: 'shoulders',
    equipment: 'dumbbell',
    musclesPrimary: ['front-delts', 'mid-delts'],
    musclesSecondary: ['triceps', 'upper-chest'],
    isCompound: true,
  },
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    category: 'shoulders',
    equipment: 'machine',
    musclesPrimary: ['front-delts', 'mid-delts'],
    musclesSecondary: ['triceps'],
    isCompound: true,
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    category: 'shoulders',
    equipment: 'cable',
    musclesPrimary: ['mid-delts'],
    musclesSecondary: ['traps'],
    isCompound: false,
  },
  {
    id: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    category: 'shoulders',
    equipment: 'machine',
    musclesPrimary: ['rear-delts'],
    musclesSecondary: ['mid-back', 'traps'],
    isCompound: false,
  },
  {
    id: 'seated-dumbbell-lateral-raise',
    name: 'Seated Dumbbell Lateral Raise',
    category: 'shoulders',
    equipment: 'dumbbell',
    musclesPrimary: ['mid-delts'],
    musclesSecondary: ['traps'],
    isCompound: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  BICEPS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    category: 'biceps',
    equipment: 'barbell',
    musclesPrimary: ['biceps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    category: 'biceps',
    equipment: 'dumbbell',
    musclesPrimary: ['biceps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    category: 'biceps',
    equipment: 'dumbbell',
    musclesPrimary: ['biceps', 'brachialis'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    category: 'biceps',
    equipment: 'barbell',
    musclesPrimary: ['biceps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    category: 'biceps',
    equipment: 'cable',
    musclesPrimary: ['biceps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    category: 'biceps',
    equipment: 'dumbbell',
    musclesPrimary: ['biceps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'spider-curl',
    name: 'Spider Curl',
    category: 'biceps',
    equipment: 'dumbbell',
    musclesPrimary: ['biceps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'concentration-curl',
    name: 'Concentration Curl',
    category: 'biceps',
    equipment: 'dumbbell',
    musclesPrimary: ['biceps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'ez-bar-curl',
    name: 'EZ-Bar Curl',
    category: 'biceps',
    equipment: 'barbell',
    musclesPrimary: ['biceps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'cable-hammer-curl',
    name: 'Cable Hammer Curl (Rope)',
    category: 'biceps',
    equipment: 'cable',
    musclesPrimary: ['biceps', 'brachialis'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  TRICEPS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    category: 'triceps',
    equipment: 'cable',
    musclesPrimary: ['triceps'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'skull-crusher',
    name: 'Skull Crusher (Lying Tricep Extension)',
    category: 'triceps',
    equipment: 'barbell',
    musclesPrimary: ['triceps'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    category: 'triceps',
    equipment: 'dumbbell',
    musclesPrimary: ['triceps'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'tricep-dips',
    name: 'Dips (Triceps)',
    category: 'triceps',
    equipment: 'bodyweight',
    musclesPrimary: ['triceps'],
    musclesSecondary: ['chest', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    category: 'triceps',
    equipment: 'barbell',
    musclesPrimary: ['triceps'],
    musclesSecondary: ['chest', 'front-delts'],
    isCompound: true,
  },
  {
    id: 'french-press',
    name: 'French Press',
    category: 'triceps',
    equipment: 'barbell',
    musclesPrimary: ['triceps'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'tricep-kickback',
    name: 'Tricep Kickback',
    category: 'triceps',
    equipment: 'dumbbell',
    musclesPrimary: ['triceps'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'cable-overhead-extension',
    name: 'Cable Overhead Extension',
    category: 'triceps',
    equipment: 'cable',
    musclesPrimary: ['triceps'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'diamond-push-ups',
    name: 'Diamond Push-Ups',
    category: 'triceps',
    equipment: 'bodyweight',
    musclesPrimary: ['triceps'],
    musclesSecondary: ['chest', 'front-delts'],
    isCompound: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUADS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    category: 'quads',
    equipment: 'barbell',
    musclesPrimary: ['quads', 'glutes'],
    musclesSecondary: ['hamstrings', 'lower-back', 'core'],
    isCompound: true,
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    category: 'quads',
    equipment: 'barbell',
    musclesPrimary: ['quads'],
    musclesSecondary: ['glutes', 'core', 'upper-back'],
    isCompound: true,
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'quads',
    equipment: 'machine',
    musclesPrimary: ['quads', 'glutes'],
    musclesSecondary: ['hamstrings'],
    isCompound: true,
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'quads',
    equipment: 'machine',
    musclesPrimary: ['quads'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    category: 'quads',
    equipment: 'machine',
    musclesPrimary: ['quads'],
    musclesSecondary: ['glutes'],
    isCompound: true,
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'quads',
    equipment: 'dumbbell',
    musclesPrimary: ['quads', 'glutes'],
    musclesSecondary: ['hamstrings', 'core'],
    isCompound: true,
  },
  {
    id: 'walking-lunges',
    name: 'Walking Lunges',
    category: 'quads',
    equipment: 'dumbbell',
    musclesPrimary: ['quads', 'glutes'],
    musclesSecondary: ['hamstrings', 'core'],
    isCompound: true,
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'quads',
    equipment: 'kettlebell',
    musclesPrimary: ['quads', 'glutes'],
    musclesSecondary: ['core', 'upper-back'],
    isCompound: true,
  },
  {
    id: 'sissy-squat',
    name: 'Sissy Squat',
    category: 'quads',
    equipment: 'bodyweight',
    musclesPrimary: ['quads'],
    musclesSecondary: ['hip-flexors'],
    isCompound: false,
  },
  {
    id: 'smith-machine-squat',
    name: 'Smith Machine Squat',
    category: 'quads',
    equipment: 'smith',
    musclesPrimary: ['quads', 'glutes'],
    musclesSecondary: ['hamstrings'],
    isCompound: true,
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse Lunge',
    category: 'quads',
    equipment: 'dumbbell',
    musclesPrimary: ['quads', 'glutes'],
    musclesSecondary: ['hamstrings', 'core'],
    isCompound: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  HAMSTRINGS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'hamstrings',
    equipment: 'barbell',
    musclesPrimary: ['hamstrings', 'glutes'],
    musclesSecondary: ['lower-back', 'forearms'],
    isCompound: true,
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    category: 'hamstrings',
    equipment: 'machine',
    musclesPrimary: ['hamstrings'],
    musclesSecondary: ['calves'],
    isCompound: false,
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    category: 'hamstrings',
    equipment: 'machine',
    musclesPrimary: ['hamstrings'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'stiff-leg-deadlift',
    name: 'Stiff-Leg Deadlift',
    category: 'hamstrings',
    equipment: 'barbell',
    musclesPrimary: ['hamstrings', 'lower-back'],
    musclesSecondary: ['glutes', 'forearms'],
    isCompound: true,
  },
  {
    id: 'good-morning',
    name: 'Good Morning',
    category: 'hamstrings',
    equipment: 'barbell',
    musclesPrimary: ['hamstrings', 'lower-back'],
    musclesSecondary: ['glutes', 'core'],
    isCompound: true,
  },
  {
    id: 'nordic-curl',
    name: 'Nordic Curl',
    category: 'hamstrings',
    equipment: 'bodyweight',
    musclesPrimary: ['hamstrings'],
    musclesSecondary: ['calves', 'glutes'],
    isCompound: false,
  },
  {
    id: 'dumbbell-romanian-deadlift',
    name: 'Dumbbell Romanian Deadlift',
    category: 'hamstrings',
    equipment: 'dumbbell',
    musclesPrimary: ['hamstrings', 'glutes'],
    musclesSecondary: ['lower-back', 'forearms'],
    isCompound: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  GLUTES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'barbell-hip-thrust',
    name: 'Barbell Hip Thrust',
    category: 'glutes',
    equipment: 'barbell',
    musclesPrimary: ['glutes'],
    musclesSecondary: ['hamstrings', 'core'],
    isCompound: true,
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'glutes',
    equipment: 'bodyweight',
    musclesPrimary: ['glutes'],
    musclesSecondary: ['hamstrings', 'core'],
    isCompound: false,
  },
  {
    id: 'cable-kickback',
    name: 'Cable Kickback',
    category: 'glutes',
    equipment: 'cable',
    musclesPrimary: ['glutes'],
    musclesSecondary: ['hamstrings'],
    isCompound: false,
  },
  {
    id: 'sumo-deadlift',
    name: 'Sumo Deadlift',
    category: 'glutes',
    equipment: 'barbell',
    musclesPrimary: ['glutes', 'quads'],
    musclesSecondary: ['hamstrings', 'lower-back', 'adductors', 'forearms'],
    isCompound: true,
  },
  {
    id: 'glute-ham-raise',
    name: 'Glute Ham Raise',
    category: 'glutes',
    equipment: 'bodyweight',
    musclesPrimary: ['glutes', 'hamstrings'],
    musclesSecondary: ['lower-back', 'calves'],
    isCompound: true,
  },
  {
    id: 'single-leg-hip-thrust',
    name: 'Single-Leg Hip Thrust',
    category: 'glutes',
    equipment: 'bodyweight',
    musclesPrimary: ['glutes'],
    musclesSecondary: ['hamstrings', 'core'],
    isCompound: false,
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull-Through',
    category: 'glutes',
    equipment: 'cable',
    musclesPrimary: ['glutes'],
    musclesSecondary: ['hamstrings', 'lower-back'],
    isCompound: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  CALVES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'calves',
    equipment: 'machine',
    musclesPrimary: ['calves'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    category: 'calves',
    equipment: 'machine',
    musclesPrimary: ['soleus', 'calves'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'leg-press-calf-raise',
    name: 'Leg Press Calf Raise',
    category: 'calves',
    equipment: 'machine',
    musclesPrimary: ['calves'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'donkey-calf-raise',
    name: 'Donkey Calf Raise',
    category: 'calves',
    equipment: 'machine',
    musclesPrimary: ['calves'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'smith-machine-calf-raise',
    name: 'Smith Machine Calf Raise',
    category: 'calves',
    equipment: 'smith',
    musclesPrimary: ['calves'],
    musclesSecondary: [],
    isCompound: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ABS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'crunch',
    name: 'Crunch',
    category: 'abs',
    equipment: 'bodyweight',
    musclesPrimary: ['upper-abs'],
    musclesSecondary: ['obliques'],
    isCompound: false,
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    category: 'abs',
    equipment: 'cable',
    musclesPrimary: ['upper-abs'],
    musclesSecondary: ['obliques'],
    isCompound: false,
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'abs',
    equipment: 'bodyweight',
    musclesPrimary: ['lower-abs'],
    musclesSecondary: ['hip-flexors', 'obliques'],
    isCompound: false,
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    category: 'abs',
    equipment: 'none',
    musclesPrimary: ['abs', 'core'],
    musclesSecondary: ['lats', 'shoulders'],
    isCompound: true,
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'abs',
    equipment: 'bodyweight',
    musclesPrimary: ['core', 'abs'],
    musclesSecondary: ['shoulders', 'glutes'],
    isCompound: false,
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    category: 'abs',
    equipment: 'bodyweight',
    musclesPrimary: ['obliques'],
    musclesSecondary: ['core', 'shoulders'],
    isCompound: false,
  },
  {
    id: 'decline-sit-up',
    name: 'Decline Sit-Up',
    category: 'abs',
    equipment: 'bodyweight',
    musclesPrimary: ['upper-abs'],
    musclesSecondary: ['hip-flexors', 'obliques'],
    isCompound: false,
  },
  {
    id: 'cable-woodchop',
    name: 'Cable Woodchop',
    category: 'abs',
    equipment: 'cable',
    musclesPrimary: ['obliques', 'core'],
    musclesSecondary: ['shoulders', 'hips'],
    isCompound: true,
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    category: 'abs',
    equipment: 'bodyweight',
    musclesPrimary: ['obliques'],
    musclesSecondary: ['upper-abs', 'hip-flexors'],
    isCompound: false,
  },
  {
    id: 'leg-raise',
    name: 'Lying Leg Raise',
    category: 'abs',
    equipment: 'bodyweight',
    musclesPrimary: ['lower-abs'],
    musclesSecondary: ['hip-flexors'],
    isCompound: false,
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'abs',
    equipment: 'bodyweight',
    musclesPrimary: ['core', 'abs'],
    musclesSecondary: ['hip-flexors', 'shoulders', 'quads'],
    isCompound: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  TRAPS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'barbell-shrug',
    name: 'Barbell Shrug',
    category: 'traps',
    equipment: 'barbell',
    musclesPrimary: ['traps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'dumbbell-shrug',
    name: 'Dumbbell Shrug',
    category: 'traps',
    equipment: 'dumbbell',
    musclesPrimary: ['traps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },
  {
    id: 'rack-pull',
    name: 'Rack Pull',
    category: 'traps',
    equipment: 'barbell',
    musclesPrimary: ['traps', 'lower-back'],
    musclesSecondary: ['glutes', 'hamstrings', 'forearms'],
    isCompound: true,
  },
  {
    id: 'smith-machine-shrug',
    name: 'Smith Machine Shrug',
    category: 'traps',
    equipment: 'smith',
    musclesPrimary: ['traps'],
    musclesSecondary: ['forearms'],
    isCompound: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  FOREARMS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'wrist-curl',
    name: 'Wrist Curl',
    category: 'forearms',
    equipment: 'barbell',
    musclesPrimary: ['forearm-flexors'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'reverse-wrist-curl',
    name: 'Reverse Wrist Curl',
    category: 'forearms',
    equipment: 'barbell',
    musclesPrimary: ['forearm-extensors'],
    musclesSecondary: [],
    isCompound: false,
  },
  {
    id: 'farmers-walk',
    name: "Farmer's Walk",
    category: 'forearms',
    equipment: 'dumbbell',
    musclesPrimary: ['forearms', 'traps'],
    musclesSecondary: ['core', 'shoulders', 'calves'],
    isCompound: true,
  },
  {
    id: 'reverse-curl',
    name: 'Reverse Curl',
    category: 'forearms',
    equipment: 'barbell',
    musclesPrimary: ['forearm-extensors', 'brachialis'],
    musclesSecondary: ['biceps'],
    isCompound: false,
  },
  {
    id: 'plate-pinch',
    name: 'Plate Pinch Hold',
    category: 'forearms',
    equipment: 'none',
    musclesPrimary: ['forearms'],
    musclesSecondary: [],
    isCompound: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMPOUND (Full-body / Multi-joint)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'clean-and-press',
    name: 'Clean and Press',
    category: 'compound',
    equipment: 'barbell',
    musclesPrimary: ['shoulders', 'traps', 'quads', 'glutes'],
    musclesSecondary: ['hamstrings', 'lower-back', 'core', 'triceps'],
    isCompound: true,
  },
  {
    id: 'power-clean',
    name: 'Power Clean',
    category: 'compound',
    equipment: 'barbell',
    musclesPrimary: ['traps', 'quads', 'glutes', 'hamstrings'],
    musclesSecondary: ['lower-back', 'forearms', 'shoulders', 'core'],
    isCompound: true,
  },
  {
    id: 'thruster',
    name: 'Thruster',
    category: 'compound',
    equipment: 'barbell',
    musclesPrimary: ['quads', 'glutes', 'shoulders'],
    musclesSecondary: ['triceps', 'core', 'upper-back'],
    isCompound: true,
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    category: 'compound',
    equipment: 'kettlebell',
    musclesPrimary: ['glutes', 'hamstrings'],
    musclesSecondary: ['lower-back', 'shoulders', 'core', 'forearms'],
    isCompound: true,
  },
  {
    id: 'turkish-get-up',
    name: 'Turkish Get-Up',
    category: 'compound',
    equipment: 'kettlebell',
    musclesPrimary: ['shoulders', 'core', 'glutes'],
    musclesSecondary: ['quads', 'triceps', 'lats'],
    isCompound: true,
  },
  {
    id: 'burpees',
    name: 'Burpees',
    category: 'compound',
    equipment: 'bodyweight',
    musclesPrimary: ['quads', 'chest', 'core'],
    musclesSecondary: ['shoulders', 'triceps', 'hamstrings', 'glutes'],
    isCompound: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  CARDIO
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'treadmill',
    name: 'Treadmill',
    category: 'cardio',
    equipment: 'machine',
    musclesPrimary: ['quads', 'hamstrings', 'calves'],
    musclesSecondary: ['glutes', 'core'],
    isCompound: true,
  },
  {
    id: 'stairmaster',
    name: 'Stairmaster',
    category: 'cardio',
    equipment: 'machine',
    musclesPrimary: ['quads', 'glutes', 'calves'],
    musclesSecondary: ['hamstrings', 'core'],
    isCompound: true,
  },
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    category: 'cardio',
    equipment: 'machine',
    musclesPrimary: ['quads', 'hamstrings'],
    musclesSecondary: ['calves', 'glutes'],
    isCompound: true,
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    category: 'cardio',
    equipment: 'machine',
    musclesPrimary: ['quads', 'hamstrings', 'glutes'],
    musclesSecondary: ['calves', 'chest', 'back'],
    isCompound: true,
  },
  {
    id: 'rowing-machine',
    name: 'Rowing Machine',
    category: 'cardio',
    equipment: 'machine',
    musclesPrimary: ['lats', 'quads', 'hamstrings'],
    musclesSecondary: ['biceps', 'shoulders', 'core', 'forearms'],
    isCompound: true,
  },
  {
    id: 'incline-walk',
    name: 'Incline Walk',
    category: 'cardio',
    equipment: 'machine',
    musclesPrimary: ['glutes', 'hamstrings', 'calves'],
    musclesSecondary: ['quads', 'core'],
    isCompound: true,
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    category: 'cardio',
    equipment: 'none',
    musclesPrimary: ['calves', 'quads'],
    musclesSecondary: ['shoulders', 'forearms', 'core'],
    isCompound: true,
  },
  {
    id: 'battle-ropes',
    name: 'Battle Ropes',
    category: 'cardio',
    equipment: 'none',
    musclesPrimary: ['shoulders', 'forearms', 'core'],
    musclesSecondary: ['lats', 'biceps', 'triceps'],
    isCompound: true,
  },
];


// ═══════════════════════════════════════════════════════════════════════════
//  INDEX — O(1) lookup by id
// ═══════════════════════════════════════════════════════════════════════════

const exercisesById = Object.freeze(
  exercises.reduce((map, ex) => {
    map[ex.id] = ex;
    return map;
  }, {})
);


// ═══════════════════════════════════════════════════════════════════════════
//  WORKOUT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const TEMPLATES = [
  {
    id: 'push',
    name: 'Push (Chest/Shoulders/Triceps)',
    exercises: [
      { exerciseId: 'flat-barbell-bench-press', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'incline-dumbbell-bench-press', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'cable-crossover', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'overhead-press', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'lateral-raise', sets: 4, repsMin: 12, repsMax: 15 },
      { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'overhead-tricep-extension', sets: 3, repsMin: 10, repsMax: 12 },
    ],
  },
  {
    id: 'pull',
    name: 'Pull (Back/Biceps)',
    exercises: [
      { exerciseId: 'barbell-row', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'lat-pulldown', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'seated-cable-row', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'dumbbell-row', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'face-pulls', sets: 3, repsMin: 15, repsMax: 20 },
      { exerciseId: 'barbell-curl', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'hammer-curl', sets: 3, repsMin: 10, repsMax: 12 },
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    exercises: [
      { exerciseId: 'barbell-back-squat', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'romanian-deadlift', sets: 4, repsMin: 8, repsMax: 10 },
      { exerciseId: 'leg-press', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'lying-leg-curl', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'leg-extension', sets: 3, repsMin: 12, repsMax: 15 },
      { exerciseId: 'barbell-hip-thrust', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'standing-calf-raise', sets: 4, repsMin: 12, repsMax: 15 },
      { exerciseId: 'seated-calf-raise', sets: 3, repsMin: 15, repsMax: 20 },
    ],
  },
  {
    id: 'upper-body',
    name: 'Upper Body',
    exercises: [
      { exerciseId: 'flat-barbell-bench-press', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'barbell-row', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'dumbbell-shoulder-press', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'lat-pulldown', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'incline-dumbbell-bench-press', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'lateral-raise', sets: 3, repsMin: 12, repsMax: 15 },
      { exerciseId: 'barbell-curl', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 10, repsMax: 12 },
    ],
  },
  {
    id: 'lower-body',
    name: 'Lower Body',
    exercises: [
      { exerciseId: 'barbell-back-squat', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'romanian-deadlift', sets: 4, repsMin: 8, repsMax: 10 },
      { exerciseId: 'bulgarian-split-squat', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'lying-leg-curl', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'hack-squat', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'barbell-hip-thrust', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'standing-calf-raise', sets: 4, repsMin: 12, repsMax: 15 },
      { exerciseId: 'seated-calf-raise', sets: 3, repsMin: 15, repsMax: 20 },
    ],
  },
  {
    id: 'chest-and-back',
    name: 'Chest & Back',
    exercises: [
      { exerciseId: 'flat-barbell-bench-press', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'barbell-row', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'incline-dumbbell-bench-press', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'lat-pulldown', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'cable-crossover', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'seated-cable-row', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'pec-deck', sets: 3, repsMin: 12, repsMax: 15 },
      { exerciseId: 'face-pulls', sets: 3, repsMin: 15, repsMax: 20 },
    ],
  },
  {
    id: 'arms',
    name: 'Arms',
    exercises: [
      { exerciseId: 'barbell-curl', sets: 4, repsMin: 8, repsMax: 10 },
      { exerciseId: 'close-grip-bench-press', sets: 4, repsMin: 8, repsMax: 10 },
      { exerciseId: 'hammer-curl', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'skull-crusher', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'incline-dumbbell-curl', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'concentration-curl', sets: 3, repsMin: 12, repsMax: 15 },
      { exerciseId: 'overhead-tricep-extension', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'wrist-curl', sets: 3, repsMin: 15, repsMax: 20 },
      { exerciseId: 'reverse-wrist-curl', sets: 3, repsMin: 15, repsMax: 20 },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    exercises: [
      { exerciseId: 'barbell-back-squat', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'flat-barbell-bench-press', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'barbell-row', sets: 4, repsMin: 6, repsMax: 8 },
      { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'romanian-deadlift', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'barbell-curl', sets: 2, repsMin: 10, repsMax: 12 },
      { exerciseId: 'tricep-pushdown', sets: 2, repsMin: 10, repsMax: 12 },
      { exerciseId: 'standing-calf-raise', sets: 3, repsMin: 12, repsMax: 15 },
    ],
  },
];


// ═══════════════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all exercises belonging to a category.
 * @param {string} category - One of the valid category values.
 * @returns {Array} Matching exercises.
 */
function getByCategory(category) {
  return exercises.filter(ex => ex.category === category);
}

/**
 * Search exercises by name (case-insensitive substring match).
 * Optionally filter by category and/or equipment.
 * @param {string} query - Search term to match against exercise names.
 * @param {Object} [filters] - Optional filters.
 * @param {string} [filters.category] - Filter by category.
 * @param {string} [filters.equipment] - Filter by equipment type.
 * @returns {Array} Matching exercises, sorted by relevance (exact match first).
 */
function search(query, filters = {}) {
  const q = (query || '').toLowerCase().trim();

  let results = exercises;

  if (filters.category) {
    results = results.filter(ex => ex.category === filters.category);
  }
  if (filters.equipment) {
    results = results.filter(ex => ex.equipment === filters.equipment);
  }

  if (!q) return results;

  results = results.filter(ex => {
    const name = ex.name.toLowerCase();
    const id = ex.id.toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  // Sort: exact name start match first, then alphabetical
  results.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.name.localeCompare(b.name);
  });

  return results;
}

/**
 * Get all exercises that target a specific muscle (primary or secondary).
 * @param {string} muscle - Muscle group name.
 * @param {boolean} [primaryOnly=false] - Only return exercises where muscle is primary.
 * @returns {Array} Matching exercises.
 */
function getByMuscle(muscle, primaryOnly = false) {
  const m = muscle.toLowerCase();
  return exercises.filter(ex => {
    if (ex.musclesPrimary.some(mp => mp.toLowerCase() === m)) return true;
    if (!primaryOnly && ex.musclesSecondary.some(ms => ms.toLowerCase() === m)) return true;
    return false;
  });
}

/**
 * Get all exercises for a given equipment type.
 * @param {string} equipment - Equipment type.
 * @returns {Array} Matching exercises.
 */
function getByEquipment(equipment) {
  return exercises.filter(ex => ex.equipment === equipment);
}

/**
 * Get only compound or only isolation exercises.
 * @param {boolean} compound - true for compound, false for isolation.
 * @returns {Array} Matching exercises.
 */
function getByType(compound) {
  return exercises.filter(ex => ex.isCompound === compound);
}

/**
 * Retrieve a template by id.
 * @param {string} templateId - Template id.
 * @returns {Object|undefined} The template or undefined.
 */
function getTemplate(templateId) {
  return TEMPLATES.find(t => t.id === templateId);
}

/**
 * Expand a template into full exercise objects.
 * Returns an array of { exercise, sets, repsMin, repsMax } objects.
 * @param {string} templateId - Template id.
 * @returns {Array} Expanded exercise list, or empty array if not found.
 */
function expandTemplate(templateId) {
  const template = getTemplate(templateId);
  if (!template) return [];
  return template.exercises.map(entry => ({
    exercise: exercisesById[entry.exerciseId] || null,
    sets: entry.sets,
    repsMin: entry.repsMin,
    repsMax: entry.repsMax,
  }));
}


// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  exercises,
  exercisesById,
  TEMPLATES,
  getByCategory,
  search,
  getByMuscle,
  getByEquipment,
  getByType,
  getTemplate,
  expandTemplate,
};

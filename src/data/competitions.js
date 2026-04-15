'use strict';

/**
 * Protocol — Competition Database
 *
 * Complete reference data for strength sport and fitness competition
 * federations, divisions, shows, weight classes, mandatory poses,
 * peak week protocols, and strongman events.
 *
 * Covers: bodybuilding, powerlifting, strongman, CrossFit, and natural
 * federations.
 */

// ═══════════════════════════════════════════════════════════════════════════
//  FEDERATIONS
// ═══════════════════════════════════════════════════════════════════════════

const FEDERATIONS = [
  { id: 'ifbb-pro', name: 'IFBB Pro League', country: 'International', drugTested: false },
  { id: 'npc', name: 'NPC (National Physique Committee)', country: 'USA', drugTested: false },
  { id: 'nabba', name: 'NABBA', country: 'International', drugTested: false },
  { id: 'wbff', name: 'WBFF', country: 'International', drugTested: false },
  { id: 'ocb', name: 'OCB (Organization of Competitive Bodybuilders)', country: 'USA', drugTested: true },
  { id: 'inba', name: 'INBA/PNBA', country: 'International', drugTested: true },
  { id: 'wnbf', name: 'WNBF', country: 'International', drugTested: true },
  { id: 'ipf', name: 'IPF (International Powerlifting Federation)', country: 'International', drugTested: true },
  { id: 'usapl', name: 'USAPL', country: 'USA', drugTested: true },
  { id: 'uspa', name: 'USPA', country: 'USA', drugTested: false },
  { id: 'wrpf', name: 'WRPF', country: 'International', drugTested: false },
  { id: 'rps', name: 'RPS', country: 'USA', drugTested: false },
  { id: 'strongman-corp', name: 'Strongman Corporation', country: 'USA', drugTested: false },
  { id: 'wus', name: "World's Ultimate Strongman", country: 'International', drugTested: false },
  { id: 'giants-live', name: 'Giants Live', country: 'International', drugTested: false },
  { id: 'crossfit', name: 'CrossFit Games', country: 'International', drugTested: true },
];

// Quick lookup by id
const federationsById = new Map(FEDERATIONS.map(f => [f.id, f]));

// ═══════════════════════════════════════════════════════════════════════════
//  DIVISIONS
// ═══════════════════════════════════════════════════════════════════════════

const DIVISIONS = {
  bodybuilding: [
    { id: 'mens-open', name: "Men's Open Bodybuilding", federation: ['ifbb-pro', 'npc'], gender: 'male', hasWeightClass: false },
    { id: 'mens-212', name: "Men's 212", federation: ['ifbb-pro', 'npc'], gender: 'male', weightLimit: 212 },
    { id: 'classic-physique', name: 'Classic Physique', federation: ['ifbb-pro', 'npc'], gender: 'male', hasHeightWeightRatio: true },
    { id: 'mens-physique', name: "Men's Physique", federation: ['ifbb-pro', 'npc'], gender: 'male' },
    { id: 'bikini', name: 'Bikini', federation: ['ifbb-pro', 'npc'], gender: 'female' },
    { id: 'figure', name: 'Figure', federation: ['ifbb-pro', 'npc'], gender: 'female' },
    { id: 'wellness', name: 'Wellness', federation: ['ifbb-pro', 'npc'], gender: 'female' },
    { id: 'womens-physique', name: "Women's Physique", federation: ['ifbb-pro', 'npc'], gender: 'female' },
    { id: 'womens-bodybuilding', name: "Women's Bodybuilding", federation: ['ifbb-pro'], gender: 'female' },
    { id: 'fitness', name: 'Fitness', federation: ['ifbb-pro', 'npc'], gender: 'female' },
  ],
  powerlifting: [
    { id: 'pl-raw', name: 'Raw (Sleeves)', federation: ['ipf', 'usapl', 'uspa'] },
    { id: 'pl-equipped', name: 'Equipped (Wraps/Suits)', federation: ['ipf', 'usapl'] },
    { id: 'pl-classic-raw', name: 'Classic Raw', federation: ['ipf'] },
  ],
  strongman: [
    { id: 'sm-open', name: 'Open Strongman', federation: ['strongman-corp', 'wus'] },
    { id: 'sm-lightweight', name: 'Lightweight Strongman', federation: ['strongman-corp'] },
    { id: 'sm-masters', name: 'Masters Strongman', federation: ['strongman-corp'] },
    { id: 'sm-womens', name: "Women's Strongman", federation: ['strongman-corp'] },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
//  MAJOR SHOWS
// ═══════════════════════════════════════════════════════════════════════════

const MAJOR_SHOWS = [
  { name: 'Mr. Olympia', federation: 'ifbb-pro', division: ['mens-open', 'mens-212', 'classic-physique', 'mens-physique', 'bikini', 'figure', 'wellness', 'womens-physique', 'fitness'], tier: 'S' },
  { name: 'Arnold Classic', federation: 'ifbb-pro', tier: 'S' },
  { name: 'Arnold Sports Festival', federation: 'ifbb-pro', tier: 'A' },
  { name: 'New York Pro', federation: 'ifbb-pro', tier: 'A' },
  { name: 'Texas Pro', federation: 'ifbb-pro', tier: 'A' },
  { name: 'Chicago Pro', federation: 'ifbb-pro', tier: 'A' },
  { name: 'USA Championships', federation: 'npc', tier: 'A', notes: 'National qualifier for IFBB Pro card' },
  { name: 'North Americans', federation: 'npc', tier: 'A' },
  { name: 'Nationals', federation: 'npc', tier: 'A' },
  { name: "World's Strongest Man", federation: 'wus', tier: 'S' },
  { name: 'Arnold Strongman Classic', federation: 'giants-live', tier: 'S' },
  { name: 'Shaw Classic', federation: 'strongman-corp', tier: 'A' },
  { name: 'IPF World Championships', federation: 'ipf', tier: 'S' },
  { name: 'USAPL Raw Nationals', federation: 'usapl', tier: 'A' },
  { name: 'CrossFit Games', federation: 'crossfit', tier: 'S' },
];

// ═══════════════════════════════════════════════════════════════════════════
//  CLASSIC PHYSIQUE HEIGHT/WEIGHT LIMITS
// ═══════════════════════════════════════════════════════════════════════════

const CLASSIC_PHYSIQUE_LIMITS = [
  { maxHeight: 63, maxWeight: 160 },  // 5'3"
  { maxHeight: 64, maxWeight: 165 },
  { maxHeight: 65, maxWeight: 170 },
  { maxHeight: 66, maxWeight: 175 },
  { maxHeight: 67, maxWeight: 180 },
  { maxHeight: 68, maxWeight: 185 },
  { maxHeight: 69, maxWeight: 190 },
  { maxHeight: 70, maxWeight: 195 },  // 5'10"
  { maxHeight: 71, maxWeight: 200 },
  { maxHeight: 72, maxWeight: 210 },
  { maxHeight: 73, maxWeight: 220 },
  { maxHeight: 74, maxWeight: 230 },
  { maxHeight: 75, maxWeight: 237 },
  { maxHeight: 76, maxWeight: 245 },
  { maxHeight: 77, maxWeight: 252 },
];

// ═══════════════════════════════════════════════════════════════════════════
//  POWERLIFTING WEIGHT CLASSES (IPF, kg)
// ═══════════════════════════════════════════════════════════════════════════

const PL_WEIGHT_CLASSES = {
  male: [59, 66, 74, 83, 93, 105, 120, 'SHW'],
  female: [47, 52, 57, 63, 69, 76, 84, 'SHW'],
};

// ═══════════════════════════════════════════════════════════════════════════
//  STRONGMAN EVENTS
// ═══════════════════════════════════════════════════════════════════════════

const STRONGMAN_EVENTS = [
  'Deadlift', 'Atlas Stones', 'Log Press', 'Farmers Walk', 'Yoke Carry',
  'Tire Flip', 'Car Deadlift', 'Circus Dumbbell', 'Keg Toss', 'Conan Wheel',
  'Hercules Hold', 'Frame Carry', 'Sandbag Carry', 'Axle Press', 'Viking Press',
  'Hussafell Stone', 'Shield Carry', 'Medley', 'Truck Pull', 'Stone Over Bar',
];

// ═══════════════════════════════════════════════════════════════════════════
//  MANDATORY POSES BY DIVISION
// ═══════════════════════════════════════════════════════════════════════════

const MANDATORY_POSES = {
  'mens-open': [
    'Front Double Bicep', 'Front Lat Spread', 'Side Chest',
    'Back Double Bicep', 'Back Lat Spread', 'Side Tricep',
    'Abs & Thigh', 'Most Muscular',
  ],
  'classic-physique': [
    'Front Double Bicep', 'Side Chest', 'Back Double Bicep',
    'Abs & Thigh', 'Favorite Classic Pose',
  ],
  'mens-physique': [
    'Front Pose', 'Back Pose', 'Side Pose (L)', 'Side Pose (R)',
  ],
  'bikini': [
    'Front Pose', 'Back Pose', 'Model Walk', 'T-Walk',
  ],
  'figure': [
    'Front Pose', 'Back Pose', 'Side Pose (L)', 'Side Pose (R)', 'Quarter Turns',
  ],
  'wellness': [
    'Front Pose', 'Back Pose', 'Side Pose (L)', 'Side Pose (R)',
  ],
  'womens-physique': [
    'Front Double Bicep', 'Side Chest', 'Back Double Bicep',
    'Abs & Thigh', 'Side Tricep', 'Favorite Pose',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
//  PEAK WEEK TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

const PEAK_WEEK = {
  days: [
    { day: 7, label: 'Sunday (7 out)', water: '2.5 gal', sodium: '5000-8000mg', carbs: 'Depletion (50g)', training: 'Depletion workout - full body high rep', notes: 'Start water loading, high sodium' },
    { day: 6, label: 'Monday (6 out)', water: '2.5 gal', sodium: '5000-8000mg', carbs: 'Depletion (50g)', training: 'Depletion workout - upper', notes: 'Continue water/sodium loading' },
    { day: 5, label: 'Tuesday (5 out)', water: '2.5 gal', sodium: '5000-8000mg', carbs: 'Depletion (30g)', training: 'Light depletion - lower', notes: 'Last depletion workout' },
    { day: 4, label: 'Wednesday (4 out)', water: '2 gal', sodium: '3000mg', carbs: 'Begin load (300-500g)', training: 'Rest', notes: 'Start carb loading, begin sodium taper' },
    { day: 3, label: 'Thursday (3 out)', water: '1 gal', sodium: '2000mg', carbs: 'Load (400-600g)', training: 'Light pump - 15 min', notes: 'Reduce water, continue carb load' },
    { day: 2, label: 'Friday (2 out)', water: '0.5 gal', sodium: '1000mg', carbs: 'Moderate (200-300g)', training: 'Light pump - 10 min', notes: 'Minimal water, assess in mirror' },
    { day: 1, label: 'Saturday (SHOW DAY)', water: 'Sips only', sodium: 'Minimal', carbs: 'Small meals every 2-3hrs', training: 'Pump up 30 min before stage', notes: 'Rice cakes, honey, dark chocolate. Pump up backstage.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all federations, optionally filtered by drug-tested status.
 * @param {{ drugTested?: boolean }} [opts]
 * @returns {Array}
 */
function getFederations(opts = {}) {
  if (opts.drugTested !== undefined) {
    return FEDERATIONS.filter(f => f.drugTested === opts.drugTested);
  }
  return FEDERATIONS;
}

/**
 * Get divisions for a sport ('bodybuilding', 'powerlifting', 'strongman').
 * Returns empty array for unknown sport.
 * @param {string} sport
 * @returns {Array}
 */
function getDivisions(sport) {
  return DIVISIONS[sport] || [];
}

/**
 * Get mandatory poses for a division id.
 * @param {string} divisionId  e.g. 'mens-open', 'bikini'
 * @returns {string[]|null}  Array of pose names, or null if unknown division
 */
function getMandatoryPoses(divisionId) {
  return MANDATORY_POSES[divisionId] || null;
}

/**
 * Get Classic Physique weight limit for a given height in inches.
 * Returns the row whose maxHeight >= heightInches, or the highest row
 * if the athlete is taller than all listed heights.
 * @param {number} heightInches
 * @returns {{ maxHeight: number, maxWeight: number }|null}
 */
function getClassicPhysiqueLimit(heightInches) {
  if (typeof heightInches !== 'number' || heightInches <= 0) return null;
  for (const row of CLASSIC_PHYSIQUE_LIMITS) {
    if (heightInches <= row.maxHeight) return row;
  }
  // Taller than chart — return highest entry
  return CLASSIC_PHYSIQUE_LIMITS[CLASSIC_PHYSIQUE_LIMITS.length - 1];
}

/**
 * Get the IPF weight class for a given body weight in kg and gender.
 * Returns the class ceiling (number) or 'SHW'.
 * @param {number} weightKg
 * @param {'male'|'female'} gender
 * @returns {number|string|null}
 */
function getPLWeightClass(weightKg, gender) {
  const classes = PL_WEIGHT_CLASSES[gender];
  if (!classes) return null;
  for (const cls of classes) {
    if (cls === 'SHW') return 'SHW';
    if (weightKg <= cls) return cls;
  }
  return 'SHW';
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  FEDERATIONS,
  federationsById,
  DIVISIONS,
  MAJOR_SHOWS,
  CLASSIC_PHYSIQUE_LIMITS,
  PL_WEIGHT_CLASSES,
  STRONGMAN_EVENTS,
  MANDATORY_POSES,
  PEAK_WEEK,
  getFederations,
  getDivisions,
  getMandatoryPoses,
  getClassicPhysiqueLimit,
  getPLWeightClass,
};

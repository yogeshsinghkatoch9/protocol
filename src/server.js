'use strict';

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');
const crypto = require('crypto');

const db        = require('./db');
const getDb     = db.getDb;
const compoundsModule = require('./data/compounds');
const competitionsData = require('./data/competitions');
const exercisesModule = require('./data/exercises');

// Normalize compound access — agents exported different shapes
const compounds = {
  getAll: () => compoundsModule.compounds || compoundsModule,
  getById: (id) => {
    if (compoundsModule.findCompound) return compoundsModule.findCompound(id);
    if (compoundsModule.compoundsById) return compoundsModule.compoundsById.get(id);
    const all = compoundsModule.compounds || compoundsModule;
    return Array.isArray(all) ? all.find(c => c.id === id) : null;
  },
};

const PORT     = 3888;
const WEB_ROOT = path.join(__dirname, 'web');

// ---------------------------------------------------------------------------
// MIME types for static file serving
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4':  'video/mp4',
  '.map':  'application/json',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the full request body as a string, then JSON.parse it. */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

/** Send a JSON response. */
function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':  'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/** Send a plain error. */
function error(res, message, status = 400) {
  json(res, { error: message }, status);
}

/** Parse query string params from a URL. */
function query(reqUrl) {
  const parsed = url.parse(reqUrl, true);
  return parsed.query;
}

/** Escape a value for CSV output. */
function csvEscape(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Guess muscle groups from an exercise name when not found in the exercise database.
 * Returns an array of muscle group strings.
 */
function guessMuscleGroup(name) {
  const n = (name || '').toLowerCase();
  const groups = [];
  if (n.includes('bench') || n.includes('chest') || n.includes('pec') || n.includes('fly')) groups.push('chest');
  if (n.includes('squat') || n.includes('leg press') || n.includes('extension') || n.includes('lunge')) groups.push('quads');
  if (n.includes('deadlift') || n.includes('row') || n.includes('pull') || n.includes('lat')) groups.push('back');
  if (n.includes('curl') && !n.includes('leg')) groups.push('biceps');
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('skull') || n.includes('dip')) groups.push('triceps');
  if (n.includes('shoulder') || n.includes('press') || n.includes('lateral') || n.includes('delt')) groups.push('shoulders');
  if (n.includes('hamstring') || n.includes('leg curl') || n.includes('romanian')) groups.push('hamstrings');
  if (n.includes('calf') || n.includes('calve')) groups.push('calves');
  if (n.includes('glute') || n.includes('hip thrust')) groups.push('glutes');
  if (n.includes('ab') || n.includes('crunch') || n.includes('plank') || n.includes('sit-up')) groups.push('abs');
  if (n.includes('shrug') || n.includes('trap')) groups.push('traps');
  if (groups.length === 0) groups.push('other');
  return groups;
}

/** Match a route pattern like /api/cycles/:id and return params. */
function matchRoute(pattern, pathname) {
  const patternParts = pattern.split('/');
  const pathParts    = pathname.split('/');
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

/** Serve a static file from WEB_ROOT. */
function serveStatic(res, filePath) {
  // Prevent directory traversal
  const resolved = path.resolve(WEB_ROOT, filePath);
  if (!resolved.startsWith(WEB_ROOT)) {
    error(res, 'Forbidden', 403);
    return;
  }

  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) {
      error(res, 'Not found', 404);
      return;
    }
    const ext  = path.extname(resolved).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type':   mime,
      'Content-Length':  stats.size,
      'Cache-Control':  'public, max-age=3600',
    });
    fs.createReadStream(resolved).pipe(res);
  });
}

// ---------------------------------------------------------------------------
// Pharmacokinetics engine
// ---------------------------------------------------------------------------

/**
 * Simple first-order pharmacokinetic model.
 * Given a list of doses [{dose_mg, taken_at, half_life_hours}],
 * returns blood concentration curve points [{time, concentration}].
 *
 * Uses superposition principle: total concentration at any time t is the
 * sum of individual dose contributions: C_i(t) = dose * (0.5)^((t - t_dose) / t_half)
 */
function calculateConcentrationCurve(doses, { hours = 720, resolution_hours = 2 } = {}) {
  if (!doses.length) return [];

  // Sort by time
  const sorted = doses
    .map(d => ({
      dose_mg:         d.dose_mg,
      taken_at:        new Date(d.taken_at).getTime(),
      half_life_hours: d.half_life_hours,
    }))
    .sort((a, b) => a.taken_at - b.taken_at);

  const start = sorted[0].taken_at;
  const end   = start + hours * 3600000;
  const points = [];

  for (let t = start; t <= end; t += resolution_hours * 3600000) {
    let concentration = 0;
    for (const d of sorted) {
      if (t < d.taken_at) continue;
      const elapsed_hours = (t - d.taken_at) / 3600000;
      concentration += d.dose_mg * Math.pow(0.5, elapsed_hours / d.half_life_hours);
    }
    points.push({
      time: new Date(t).toISOString(),
      hours_from_start: (t - start) / 3600000,
      concentration: Math.round(concentration * 1000) / 1000,
    });
  }

  return points;
}

/**
 * Calculate clearance time — time until blood concentration drops below
 * a threshold (default 1% of last dose) after the last dose.
 */
function calculateClearance(doses, { threshold_pct = 1 } = {}) {
  if (!doses.length) return null;

  const sorted = doses
    .map(d => ({
      dose_mg:         d.dose_mg,
      taken_at:        new Date(d.taken_at).getTime(),
      half_life_hours: d.half_life_hours,
      compound_id:     d.compound_id,
    }))
    .sort((a, b) => a.taken_at - b.taken_at);

  const lastDoseTime = sorted[sorted.length - 1].taken_at;

  // Per-compound clearance
  const compoundClearance = {};
  for (const d of sorted) {
    const peakContribution = d.dose_mg;
    const thresholdConc    = peakContribution * (threshold_pct / 100);
    // dose * 0.5^(t/t_half) = threshold  =>  t = t_half * log2(dose/threshold)
    const clearHours = d.half_life_hours * Math.log2(d.dose_mg / thresholdConc);
    const clearTime  = d.taken_at + clearHours * 3600000;

    if (!compoundClearance[d.compound_id] || clearTime > compoundClearance[d.compound_id].clear_time) {
      compoundClearance[d.compound_id] = {
        compound_id:     d.compound_id,
        half_life_hours: d.half_life_hours,
        clear_time:      clearTime,
        clear_date:      new Date(clearTime).toISOString(),
        hours_from_last_dose: (clearTime - lastDoseTime) / 3600000,
      };
    }
  }

  // Overall clearance = latest compound clearance
  const allClear = Object.values(compoundClearance);
  allClear.sort((a, b) => b.clear_time - a.clear_time);

  return {
    per_compound: allClear,
    full_clearance: allClear[0] || null,
  };
}

/**
 * Calculate optimal PCT start date.
 * Rule of thumb: wait until the longest-estered compound drops to ~10% of
 * its steady-state contribution, which is approximately 4-5 half-lives
 * after the last injection. HCG is excluded from this calculation.
 */
function calculatePCTStart(doses) {
  // Filter out PCT/HCG compounds
  const pctExclusions = new Set(['hcg', 'nolvadex', 'clomid']);
  const relevantDoses = doses.filter(d => !pctExclusions.has(d.compound_id));

  if (!relevantDoses.length) return null;

  const sorted = relevantDoses
    .map(d => ({
      dose_mg:         d.dose_mg,
      taken_at:        new Date(d.taken_at).getTime(),
      half_life_hours: d.half_life_hours,
      compound_id:     d.compound_id,
    }))
    .sort((a, b) => a.taken_at - b.taken_at);

  // For each compound, find the last dose and calculate wait time
  const compoundLast = {};
  for (const d of sorted) {
    compoundLast[d.compound_id] = d;
  }

  let latestPCTStart = 0;
  const details = [];

  for (const [compId, d] of Object.entries(compoundLast)) {
    // Wait ~5 half-lives for clearance to ~3% residual
    const waitHours  = d.half_life_hours * 5;
    const pctStart   = d.taken_at + waitHours * 3600000;

    details.push({
      compound_id:     compId,
      last_dose:       new Date(d.taken_at).toISOString(),
      half_life_hours: d.half_life_hours,
      wait_hours:      waitHours,
      wait_days:       Math.round(waitHours / 24 * 10) / 10,
      pct_start_date:  new Date(pctStart).toISOString(),
    });

    if (pctStart > latestPCTStart) latestPCTStart = pctStart;
  }

  details.sort((a, b) => new Date(b.pct_start_date) - new Date(a.pct_start_date));

  return {
    recommended_start: new Date(latestPCTStart).toISOString(),
    limiting_compound: details[0]?.compound_id,
    per_compound: details,
  };
}

// ---------------------------------------------------------------------------
// Strength sport calculators
// ---------------------------------------------------------------------------

/**
 * Calculate Wilks score.
 * Formula: wilks = total * 500 / (a + b*x + c*x^2 + d*x^3 + e*x^4 + f*x^5)
 * where x = bodyweight in kg.
 *
 * Standard Wilks coefficients (2020 revision not used — classic coefficients).
 */
function calculateWilks(totalKg, bodyweightKg, gender = 'male') {
  const x = bodyweightKg;

  // Male coefficients
  let a = -216.0475144;
  let b = 16.2606339;
  let c = -0.002388645;
  let d = -0.00113732;
  let e = 7.01863e-6;
  let f = -1.291e-8;

  if (gender === 'female') {
    a = 594.31747775582;
    b = -27.23842536447;
    c = 0.82112226871;
    d = -0.00930733913;
    e = 4.731582e-5;
    f = -9.054e-8;
  }

  const denom = a + b * x + c * Math.pow(x, 2) + d * Math.pow(x, 3) + e * Math.pow(x, 4) + f * Math.pow(x, 5);
  if (denom <= 0) return 0;
  const wilks = totalKg * 500 / denom;
  return Math.round(wilks * 100) / 100;
}

/**
 * Calculate DOTS score.
 * Formula: dots = total * 500 / (A + B*bw + C*bw^2 + D*bw^3 + E*bw^4)
 */
function calculateDOTS(totalKg, bodyweightKg, gender = 'male') {
  const bw = bodyweightKg;

  // Male coefficients
  let A = -307.75076;
  let B = 24.0900756;
  let C = -0.1918759221;
  let D = 0.0007391293;
  let E = -0.000001093;

  if (gender === 'female') {
    A = -57.96288;
    B = 13.6175032;
    C = -0.1126655495;
    D = 0.0005158568;
    E = -0.0000010706;
  }

  const denom = A + B * bw + C * Math.pow(bw, 2) + D * Math.pow(bw, 3) + E * Math.pow(bw, 4);
  if (denom <= 0) return 0;
  const dots = totalKg * 500 / denom;
  return Math.round(dots * 100) / 100;
}

/**
 * Calculate estimated 1RM using the Epley formula.
 * 1RM = weight * (1 + reps / 30)
 * For reps = 1, returns the weight itself.
 */
function calculate1RM(weight, reps) {
  if (reps <= 1) return weight;
  const estimated = weight * (1 + reps / 30);
  return Math.round(estimated * 10) / 10;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
async function handleRequest(req, res) {
  // CORS headers on every response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method   = req.method;

  let params;

  try {
    // ── Static files ────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/') {
      serveStatic(res, 'index.html');
      return;
    }
    if (method === 'GET' && pathname === '/sw.js') {
      serveStatic(res, 'sw.js');
      return;
    }
    if (method === 'GET' && pathname === '/manifest.json') {
      serveStatic(res, 'manifest.json');
      return;
    }

    // Serve anything else from web/ for non-API paths
    if (method === 'GET' && !pathname.startsWith('/api/')) {
      serveStatic(res, pathname.slice(1));
      return;
    }

    // ── Compounds (static DB) ───────────────────────────────────────
    if (method === 'GET' && pathname === '/api/compounds') {
      return json(res, compounds.getAll());
    }

    if (method === 'GET' && (params = matchRoute('/api/compounds/:id', pathname))) {
      const compound = compounds.getById(params.id);
      if (!compound) return error(res, 'Compound not found', 404);
      return json(res, compound);
    }

    // ── Cycles ──────────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/cycles') {
      return json(res, db.cycles.list());
    }

    if (method === 'POST' && pathname === '/api/cycles') {
      const body = await parseBody(req);
      if (!body.name || !body.start_date) return error(res, 'name and start_date required');
      return json(res, db.cycles.create(body), 201);
    }

    if (method === 'PUT' && (params = matchRoute('/api/cycles/:id', pathname))) {
      const existing = db.cycles.getById(Number(params.id));
      if (!existing) return error(res, 'Cycle not found', 404);
      const body = await parseBody(req);
      return json(res, db.cycles.update(Number(params.id), body));
    }

    if (method === 'DELETE' && (params = matchRoute('/api/cycles/:id', pathname))) {
      const existing = db.cycles.getById(Number(params.id));
      if (!existing) return error(res, 'Cycle not found', 404);
      db.cycles.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Cycle Compounds ─────────────────────────────────────────────
    if (method === 'GET' && (params = matchRoute('/api/cycles/:id/compounds', pathname))) {
      return json(res, db.cycleCompounds.listByCycle(Number(params.id)));
    }

    if (method === 'POST' && (params = matchRoute('/api/cycles/:id/compounds', pathname))) {
      const body = await parseBody(req);
      body.cycle_id = Number(params.id);
      if (!body.compound_id || body.dose_mg == null || !body.frequency || !body.start_date) {
        return error(res, 'compound_id, dose_mg, frequency, and start_date required');
      }
      return json(res, db.cycleCompounds.create(body), 201);
    }

    if (method === 'DELETE' && (params = matchRoute('/api/cycle-compounds/:id', pathname))) {
      const existing = db.cycleCompounds.getById(Number(params.id));
      if (!existing) return error(res, 'Cycle compound not found', 404);
      db.cycleCompounds.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Dose Log ────────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/doses') {
      const q = query(req.url);
      return json(res, db.doseLog.list({ from: q.from, to: q.to }));
    }

    if (method === 'POST' && pathname === '/api/doses') {
      const body = await parseBody(req);
      if (!body.compound_id || body.dose_mg == null || !body.taken_at) {
        return error(res, 'compound_id, dose_mg, and taken_at required');
      }
      return json(res, db.doseLog.create(body), 201);
    }

    if (method === 'DELETE' && (params = matchRoute('/api/doses/:id', pathname))) {
      const existing = db.doseLog.getById(Number(params.id));
      if (!existing) return error(res, 'Dose not found', 404);
      db.doseLog.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Blood Work ──────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/bloodwork') {
      return json(res, db.bloodWork.list());
    }

    if (method === 'POST' && pathname === '/api/bloodwork') {
      const body = await parseBody(req);
      if (!body.date) return error(res, 'date required');
      if (!body.markers || !Array.isArray(body.markers) || body.markers.length === 0) {
        return error(res, 'markers array required');
      }
      return json(res, db.bloodWork.create(body), 201);
    }

    if (method === 'GET' && (params = matchRoute('/api/bloodwork/:id', pathname))) {
      const panel = db.bloodWork.getById(Number(params.id));
      if (!panel) return error(res, 'Blood work panel not found', 404);
      return json(res, panel);
    }

    if (method === 'DELETE' && (params = matchRoute('/api/bloodwork/:id', pathname))) {
      const existing = db.bloodWork.getById(Number(params.id));
      if (!existing) return error(res, 'Blood work panel not found', 404);
      db.bloodWork.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Blood Marker Trends ─────────────────────────────────────────
    if (method === 'GET' && (params = matchRoute('/api/markers/:marker/trend', pathname))) {
      return json(res, db.bloodMarkers.trend(params.marker));
    }

    // ── Measurements ────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/measurements') {
      return json(res, db.measurements.list());
    }

    if (method === 'POST' && pathname === '/api/measurements') {
      const body = await parseBody(req);
      if (!body.date) return error(res, 'date required');
      return json(res, db.measurements.create(body), 201);
    }

    if (method === 'DELETE' && (params = matchRoute('/api/measurements/:id', pathname))) {
      const existing = db.measurements.getById(Number(params.id));
      if (!existing) return error(res, 'Measurement not found', 404);
      db.measurements.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Side Effects ────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/side-effects') {
      const q = query(req.url);
      return json(res, db.sideEffects.list({ from: q.from, to: q.to }));
    }

    if (method === 'POST' && pathname === '/api/side-effects') {
      const body = await parseBody(req);
      if (!body.date || !body.symptom) return error(res, 'date and symptom required');
      return json(res, db.sideEffects.create(body), 201);
    }

    if (method === 'DELETE' && (params = matchRoute('/api/side-effects/:id', pathname))) {
      const existing = db.sideEffects.getById(Number(params.id));
      if (!existing) return error(res, 'Side effect not found', 404);
      db.sideEffects.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Pharma Calculations ─────────────────────────────────────────
    if (method === 'POST' && pathname === '/api/pharma/curve') {
      const body = await parseBody(req);
      if (!body.doses || !Array.isArray(body.doses)) {
        return error(res, 'doses array required');
      }
      // Enrich doses with half-life from compound database
      const enriched = body.doses.map(d => {
        const compound = compounds.getById(d.compound_id);
        return {
          ...d,
          half_life_hours: d.half_life_hours || (compound ? compound.half_life_hours : 24),
        };
      });
      const curve = calculateConcentrationCurve(enriched, body.options || {});
      return json(res, { curve });
    }

    if (method === 'POST' && pathname === '/api/pharma/clearance') {
      const body = await parseBody(req);
      if (!body.doses || !Array.isArray(body.doses)) {
        return error(res, 'doses array required');
      }
      const enriched = body.doses.map(d => {
        const compound = compounds.getById(d.compound_id);
        return {
          ...d,
          half_life_hours: d.half_life_hours || (compound ? compound.half_life_hours : 24),
        };
      });
      const result = calculateClearance(enriched, body.options || {});
      return json(res, result);
    }

    if (method === 'POST' && pathname === '/api/pharma/pct-start') {
      const body = await parseBody(req);
      if (!body.doses || !Array.isArray(body.doses)) {
        return error(res, 'doses array required');
      }
      const enriched = body.doses.map(d => {
        const compound = compounds.getById(d.compound_id);
        return {
          ...d,
          half_life_hours: d.half_life_hours || (compound ? compound.half_life_hours : 24),
        };
      });
      const result = calculatePCTStart(enriched);
      if (!result) return error(res, 'No relevant compounds found for PCT calculation');
      return json(res, result);
    }

    // ── Workouts ─────────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/workouts') {
      const q = query(req.url);
      return json(res, db.workouts.list({ from: q.from, to: q.to }));
    }

    if (method === 'POST' && pathname === '/api/workouts') {
      const body = await parseBody(req);
      if (!body.date) return error(res, 'date required');
      return json(res, db.workouts.create(body), 201);
    }

    if (method === 'GET' && (params = matchRoute('/api/workouts/:id', pathname))) {
      const workout = db.workouts.getById(Number(params.id));
      if (!workout) return error(res, 'Workout not found', 404);
      return json(res, workout);
    }

    if (method === 'DELETE' && (params = matchRoute('/api/workouts/:id', pathname))) {
      const existing = db.workouts.getById(Number(params.id));
      if (!existing) return error(res, 'Workout not found', 404);
      db.workouts.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Workout Templates ───────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/workout-templates') {
      return json(res, db.workoutTemplates.list());
    }

    if (method === 'POST' && pathname === '/api/workout-templates') {
      const body = await parseBody(req);
      if (!body.name || !body.exercises) return error(res, 'name and exercises required');
      return json(res, db.workoutTemplates.create(body), 201);
    }

    if (method === 'DELETE' && (params = matchRoute('/api/workout-templates/:id', pathname))) {
      const existing = db.workoutTemplates.getById(Number(params.id));
      if (!existing) return error(res, 'Template not found', 404);
      db.workoutTemplates.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Exercise Stats ──────────────────────────────────────────────
    if (method === 'GET' && (params = matchRoute('/api/exercises/:exercise/history', pathname))) {
      return json(res, db.workoutSets.listByExercise(params.exercise));
    }

    if (method === 'GET' && pathname === '/api/exercises/volume') {
      const q = query(req.url);
      if (!q.from || !q.to) return error(res, 'from and to query params required');
      return json(res, db.workoutSets.volumeByDateRange({ from: q.from, to: q.to }));
    }

    // ── Wellness ────────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/wellness/today') {
      const today = new Date().toISOString().slice(0, 10);
      const entry = db.wellness.getByDate(today);
      return json(res, entry || null);
    }

    if (method === 'GET' && pathname === '/api/wellness') {
      const q = query(req.url);
      return json(res, db.wellness.list({ from: q.from, to: q.to }));
    }

    if (method === 'POST' && pathname === '/api/wellness') {
      const body = await parseBody(req);
      if (!body.date) return error(res, 'date required');
      return json(res, db.wellness.upsert(body), 201);
    }

    // ── Progress Photos ─────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/photos') {
      return json(res, db.progressPhotos.list());
    }

    if (method === 'POST' && pathname === '/api/photos') {
      const body = await parseBody(req);
      if (!body.date || !body.photo_data) return error(res, 'date and photo_data required');
      return json(res, db.progressPhotos.create(body), 201);
    }

    if (method === 'GET' && (params = matchRoute('/api/photos/:id', pathname))) {
      const photo = db.progressPhotos.getById(Number(params.id));
      if (!photo) return error(res, 'Photo not found', 404);
      return json(res, photo);
    }

    if (method === 'DELETE' && (params = matchRoute('/api/photos/:id', pathname))) {
      const existing = db.progressPhotos.getById(Number(params.id));
      if (!existing) return error(res, 'Photo not found', 404);
      db.progressPhotos.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Export ───────────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/export/json') {
      const data = {
        profile: db.profile.get(),
        cycles: db.cycles.list(),
        measurements: db.measurements.list(),
        sideEffects: db.sideEffects.list(),
        bloodWork: db.bloodWork.list(),
        doseLog: db.doseLog.list(),
        workouts: db.workouts.list().map(w => db.workouts.getById(w.id)),
        wellness: db.wellness.list(),
        progressPhotos: db.progressPhotos.list(),
        workoutTemplates: db.workoutTemplates.list(),
        exportedAt: new Date().toISOString()
      };
      const body = JSON.stringify(data, null, 2);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="protocol-export.json"',
        'Content-Length': Buffer.byteLength(body),
      });
      res.end(body);
      return;
    }

    if (method === 'GET' && pathname === '/api/export/csv') {
      const lines = [];

      // Measurements CSV
      lines.push('=== MEASUREMENTS ===');
      lines.push('date,weight,body_fat,neck,chest,shoulders,left_arm,right_arm,waist,hips,left_quad,right_quad,left_calf,right_calf,notes');
      for (const m of db.measurements.list()) {
        lines.push([m.date, m.weight, m.body_fat, m.neck, m.chest, m.shoulders, m.left_arm, m.right_arm, m.waist, m.hips, m.left_quad, m.right_quad, m.left_calf, m.right_calf, csvEscape(m.notes)].join(','));
      }

      // Dose Log CSV
      lines.push('');
      lines.push('=== DOSE LOG ===');
      lines.push('compound_id,dose_mg,taken_at,injection_site,notes');
      for (const d of db.doseLog.list()) {
        lines.push([d.compound_id, d.dose_mg, d.taken_at, d.injection_site, csvEscape(d.notes)].join(','));
      }

      // Side Effects CSV
      lines.push('');
      lines.push('=== SIDE EFFECTS ===');
      lines.push('date,symptom,severity,suspected_compound,notes');
      for (const s of db.sideEffects.list()) {
        lines.push([s.date, csvEscape(s.symptom), s.severity, s.suspected_compound, csvEscape(s.notes)].join(','));
      }

      // Workouts CSV
      lines.push('');
      lines.push('=== WORKOUTS ===');
      lines.push('date,workout_name,exercise,set_number,weight,reps,rpe,set_type,notes');
      for (const w of db.workouts.list()) {
        const full = db.workouts.getById(w.id);
        for (const s of full.sets) {
          lines.push([w.date, csvEscape(w.name), csvEscape(s.exercise), s.set_number, s.weight, s.reps, s.rpe, s.set_type, csvEscape(s.notes)].join(','));
        }
      }

      // Wellness CSV
      lines.push('');
      lines.push('=== WELLNESS ===');
      lines.push('date,sleep_hours,sleep_quality,energy,mood,libido,joint_pain,appetite,stress,notes');
      for (const w of db.wellness.list()) {
        lines.push([w.date, w.sleep_hours, w.sleep_quality, w.energy, w.mood, w.libido, w.joint_pain, w.appetite, w.stress, csvEscape(w.notes)].join(','));
      }

      const csvBody = lines.join('\n');
      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="protocol-export.csv"',
        'Content-Length': Buffer.byteLength(csvBody),
      });
      res.end(csvBody);
      return;
    }

    // ── Interaction Checker ─────────────────────────────────────────
    if (method === 'POST' && pathname === '/api/interactions/check') {
      const body = await parseBody(req);
      if (!body.compound_ids || !Array.isArray(body.compound_ids)) {
        return error(res, 'compound_ids array required');
      }

      const warnings = [];
      const compoundList = body.compound_ids
        .map(id => compounds.getById(id))
        .filter(Boolean);
      const compoundIds = new Set(body.compound_ids);
      const categories = new Set(compoundList.map(c => c.category));
      const classes = new Set(compoundList.map(c => c.class || ''));

      // 1. Check avoidWith cross-references (deduplicate bidirectional pairs)
      const seenPairs = new Set();
      for (const c of compoundList) {
        if (c.avoidWith && Array.isArray(c.avoidWith)) {
          for (const avoid of c.avoidWith) {
            if (compoundIds.has(avoid)) {
              const pairKey = [c.id, avoid].sort().join('|');
              if (seenPairs.has(pairKey)) continue;
              seenPairs.add(pairKey);
              const other = compounds.getById(avoid);
              warnings.push({
                severity: 'danger',
                message: `${c.name} should not be combined with ${other ? other.name : avoid}. Check the compound notes for details.`
              });
            }
          }
        }
      }

      // 2. 19-nors without prolactin control
      const has19Nor = compoundList.some(c =>
        (c.class || '').toLowerCase().includes('19-nortestosterone') || c.progestogenic === true
      );
      const hasProlactinControl = compoundList.some(c => c.category === 'prolactin-control');
      if (has19Nor && !hasProlactinControl) {
        warnings.push({
          severity: 'warning',
          message: '19-nor compound detected (nandrolone/trenbolone) without prolactin control. Consider adding cabergoline or pramipexole.'
        });
      }

      // 3. Oral AAS without liver support
      const hasOral = categories.has('oral-aas');
      const hasLiverSupport = categories.has('liver-support');
      if (hasOral && !hasLiverSupport) {
        warnings.push({
          severity: 'warning',
          message: 'Oral AAS detected without liver support. Consider adding TUDCA or NAC.'
        });
      }

      // 4. High-aromatizing compounds without AI
      const hasHighAromat = compoundList.some(c => c.aromatization === 'high');
      const hasAI = categories.has('ai');
      if (hasHighAromat && !hasAI) {
        warnings.push({
          severity: 'warning',
          message: 'High-aromatizing compound detected without an aromatase inhibitor. Consider adding anastrozole or exemestane.'
        });
      }

      // Deduplicate warnings (avoidWith may fire from both sides)
      const seen = new Set();
      const unique = warnings.filter(w => {
        const key = w.message;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return json(res, unique);
    }

    // ── Pinning Calculator ──────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/calc/volume') {
      const q = query(req.url);
      const dose_mg = parseFloat(q.dose_mg);
      const concentration = parseFloat(q.concentration);
      if (isNaN(dose_mg) || isNaN(concentration) || concentration <= 0) {
        return error(res, 'dose_mg and concentration (mg/ml) required as positive numbers');
      }
      const volume_ml = Math.round((dose_mg / concentration) * 1000) / 1000;
      return json(res, { dose_mg, concentration, volume_ml });
    }

    // ── Competitions ────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/competitions') {
      return json(res, db.competitions.list());
    }

    if (method === 'POST' && pathname === '/api/competitions') {
      const body = await parseBody(req);
      if (!body.name || !body.show_date) return error(res, 'name and show_date required');
      return json(res, db.competitions.create(body), 201);
    }

    if (method === 'PUT' && (params = matchRoute('/api/competitions/:id', pathname))) {
      const existing = db.competitions.getById(Number(params.id));
      if (!existing) return error(res, 'Competition not found', 404);
      const body = await parseBody(req);
      return json(res, db.competitions.update(Number(params.id), body));
    }

    if (method === 'DELETE' && (params = matchRoute('/api/competitions/:id', pathname))) {
      const existing = db.competitions.getById(Number(params.id));
      if (!existing) return error(res, 'Competition not found', 404);
      db.competitions.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Peak Week Log ───────────────────────────────────────────────
    if (method === 'GET' && (params = matchRoute('/api/competitions/:id/peak-week', pathname))) {
      const existing = db.competitions.getById(Number(params.id));
      if (!existing) return error(res, 'Competition not found', 404);
      return json(res, db.peakWeekLog.listByCompetition(Number(params.id)));
    }

    if (method === 'POST' && (params = matchRoute('/api/competitions/:id/peak-week', pathname))) {
      const existing = db.competitions.getById(Number(params.id));
      if (!existing) return error(res, 'Competition not found', 404);
      const body = await parseBody(req);
      if (body.day_out == null) return error(res, 'day_out required');
      body.competition_id = Number(params.id);
      return json(res, db.peakWeekLog.create(body), 201);
    }

    // ── Posing Log ──────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/posing') {
      return json(res, db.posingLog.list());
    }

    if (method === 'POST' && pathname === '/api/posing') {
      const body = await parseBody(req);
      if (!body.date) return error(res, 'date required');
      return json(res, db.posingLog.create(body), 201);
    }

    // ── Powerlifting Meets ──────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/pl-meets') {
      return json(res, db.plMeets.list());
    }

    if (method === 'POST' && pathname === '/api/pl-meets') {
      const body = await parseBody(req);
      if (!body.name || !body.date) return error(res, 'name and date required');
      return json(res, db.plMeets.create(body), 201);
    }

    // ── 1RM Log ─────────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/one-rm') {
      return json(res, db.oneRmLog.list());
    }

    if (method === 'POST' && pathname === '/api/one-rm') {
      const body = await parseBody(req);
      if (!body.date || !body.exercise || body.weight == null) {
        return error(res, 'date, exercise, and weight required');
      }
      return json(res, db.oneRmLog.create(body), 201);
    }

    if (method === 'GET' && (params = matchRoute('/api/one-rm/:exercise/history', pathname))) {
      return json(res, db.oneRmLog.historyByExercise(params.exercise));
    }

    // ── Strongman Events ────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/strongman-events') {
      return json(res, db.strongmanEvents.list());
    }

    if (method === 'POST' && pathname === '/api/strongman-events') {
      const body = await parseBody(req);
      if (!body.date || !body.event_name) return error(res, 'date and event_name required');
      return json(res, db.strongmanEvents.create(body), 201);
    }

    // ── Sport Profile ───────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/sport-profile') {
      return json(res, db.sportProfile.get());
    }

    if (method === 'PUT' && pathname === '/api/sport-profile') {
      const body = await parseBody(req);
      return json(res, db.sportProfile.update(body));
    }

    // ── Competition Static Data ─────────────────────────────────────
    if (method === 'GET' && pathname === '/api/federations') {
      return json(res, competitionsData.getFederations());
    }

    if (method === 'GET' && (params = matchRoute('/api/divisions/:sport', pathname))) {
      return json(res, competitionsData.getDivisions(params.sport));
    }

    if (method === 'GET' && (params = matchRoute('/api/poses/:division', pathname))) {
      const poses = competitionsData.getMandatoryPoses(params.division);
      if (!poses) return error(res, 'Unknown division', 404);
      return json(res, poses);
    }

    if (method === 'GET' && pathname === '/api/peak-week-template') {
      return json(res, competitionsData.PEAK_WEEK);
    }

    if (method === 'GET' && pathname === '/api/classic-limit') {
      const q = query(req.url);
      const height = parseFloat(q.height);
      if (isNaN(height)) return error(res, 'height query param required (inches)');
      const limit = competitionsData.getClassicPhysiqueLimit(height);
      if (!limit) return error(res, 'Invalid height');
      return json(res, limit);
    }

    if (method === 'GET' && pathname === '/api/strongman-event-types') {
      return json(res, competitionsData.STRONGMAN_EVENTS);
    }

    // ── Strength Calculators ────────────────────────────────────────

    // Wilks Score
    if (method === 'GET' && pathname === '/api/calc/wilks') {
      const q = query(req.url);
      const total = parseFloat(q.total);
      const bodyweight = parseFloat(q.bodyweight);
      const gender = q.gender || 'male';
      if (isNaN(total) || isNaN(bodyweight) || bodyweight <= 0) {
        return error(res, 'total and bodyweight required as positive numbers');
      }
      const wilks = calculateWilks(total, bodyweight, gender);
      return json(res, { total, bodyweight, gender, wilks });
    }

    // DOTS Score
    if (method === 'GET' && pathname === '/api/calc/dots') {
      const q = query(req.url);
      const total = parseFloat(q.total);
      const bodyweight = parseFloat(q.bodyweight);
      const gender = q.gender || 'male';
      if (isNaN(total) || isNaN(bodyweight) || bodyweight <= 0) {
        return error(res, 'total and bodyweight required as positive numbers');
      }
      const dots = calculateDOTS(total, bodyweight, gender);
      return json(res, { total, bodyweight, gender, dots });
    }

    // Estimated 1RM (Epley)
    if (method === 'GET' && pathname === '/api/calc/1rm') {
      const q = query(req.url);
      const weight = parseFloat(q.weight);
      const reps = parseInt(q.reps, 10);
      if (isNaN(weight) || isNaN(reps) || reps < 1) {
        return error(res, 'weight and reps required (reps >= 1)');
      }
      const estimated = calculate1RM(weight, reps);
      return json(res, { weight, reps, estimated_1rm: estimated });
    }

    // ── Exercises (static DB from exercises.js) ─────────────────────
    if (method === 'GET' && pathname === '/api/exercises') {
      return json(res, exercisesModule.exercises);
    }

    if (method === 'GET' && pathname === '/api/exercises/search') {
      const q = query(req.url);
      const results = exercisesModule.search(q.q || '', {
        category: q.category,
        equipment: q.equipment,
      });
      return json(res, results);
    }

    if (method === 'GET' && pathname === '/api/exercises/templates') {
      return json(res, exercisesModule.TEMPLATES);
    }

    // ── Reminders ───────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/reminders/due') {
      const due = db.reminders.getDue();
      return json(res, due);
    }

    if (method === 'GET' && pathname === '/api/reminders') {
      return json(res, db.reminders.list());
    }

    if (method === 'POST' && pathname === '/api/reminders') {
      const body = await parseBody(req);
      if (!body.compound_id || !body.label || body.frequency_hours == null) {
        return error(res, 'compound_id, label, and frequency_hours required');
      }
      return json(res, db.reminders.create(body), 201);
    }

    if (method === 'PUT' && (params = matchRoute('/api/reminders/:id', pathname))) {
      const existing = db.reminders.getById(Number(params.id));
      if (!existing) return error(res, 'Reminder not found', 404);
      const body = await parseBody(req);
      return json(res, db.reminders.update(Number(params.id), body));
    }

    if (method === 'DELETE' && (params = matchRoute('/api/reminders/:id', pathname))) {
      const existing = db.reminders.getById(Number(params.id));
      if (!existing) return error(res, 'Reminder not found', 404);
      db.reminders.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Unit Converter ──────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/calc/convert') {
      const q = query(req.url);
      const value = parseFloat(q.value);
      const from = (q.from || '').toLowerCase();
      const to = (q.to || '').toLowerCase();
      const concentration = parseFloat(q.concentration) || null;
      const compound = (q.compound || '').toLowerCase();

      if (isNaN(value)) return error(res, 'value query param required as a number');
      if (!from || !to) return error(res, 'from and to query params required (mg, mL, IU, mcg)');

      let result = null;
      let notes = null;

      // mg <-> mcg
      if (from === 'mg' && to === 'mcg') {
        result = value * 1000;
      } else if (from === 'mcg' && to === 'mg') {
        result = value / 1000;
      }
      // mg <-> mL (needs concentration)
      else if (from === 'mg' && to === 'ml') {
        if (!concentration) return error(res, 'concentration (mg/mL) required for mg to mL conversion');
        result = value / concentration;
        notes = `Using concentration ${concentration} mg/mL`;
      } else if (from === 'ml' && to === 'mg') {
        if (!concentration) return error(res, 'concentration (mg/mL) required for mL to mg conversion');
        result = value * concentration;
        notes = `Using concentration ${concentration} mg/mL`;
      }
      // IU <-> mg (compound-specific)
      else if (from === 'iu' && to === 'mg') {
        const factors = { hgh: 0.33, hcg: 0.001, insulin: 0.0347 };
        const factor = factors[compound];
        if (!factor) return error(res, 'compound query param required for IU conversion (hgh, hcg, insulin)');
        result = value * factor;
        notes = `1 IU = ${factor} mg for ${compound.toUpperCase()}`;
      } else if (from === 'mg' && to === 'iu') {
        const factors = { hgh: 0.33, hcg: 0.001, insulin: 0.0347 };
        const factor = factors[compound];
        if (!factor) return error(res, 'compound query param required for IU conversion (hgh, hcg, insulin)');
        result = value / factor;
        notes = `1 IU = ${factor} mg for ${compound.toUpperCase()}`;
      }
      // mcg <-> mL
      else if (from === 'mcg' && to === 'ml') {
        if (!concentration) return error(res, 'concentration (mcg/mL) required');
        result = value / concentration;
        notes = `Using concentration ${concentration} mcg/mL`;
      } else if (from === 'ml' && to === 'mcg') {
        if (!concentration) return error(res, 'concentration (mcg/mL) required');
        result = value * concentration;
        notes = `Using concentration ${concentration} mcg/mL`;
      }
      // IU <-> mcg
      else if (from === 'iu' && to === 'mcg') {
        const factors = { hgh: 0.33, hcg: 0.001, insulin: 0.0347 };
        const factor = factors[compound];
        if (!factor) return error(res, 'compound query param required for IU conversion (hgh, hcg, insulin)');
        result = value * factor * 1000;
        notes = `1 IU = ${factor * 1000} mcg for ${compound.toUpperCase()}`;
      } else if (from === 'mcg' && to === 'iu') {
        const factors = { hgh: 0.33, hcg: 0.001, insulin: 0.0347 };
        const factor = factors[compound];
        if (!factor) return error(res, 'compound query param required for IU conversion (hgh, hcg, insulin)');
        result = value / (factor * 1000);
        notes = `1 IU = ${factor * 1000} mcg for ${compound.toUpperCase()}`;
      }
      else {
        return error(res, `Unsupported conversion: ${from} to ${to}`);
      }

      result = Math.round(result * 10000) / 10000;
      const response = { value, from, to, result };
      if (notes) response.notes = notes;
      if (compound) response.compound = compound;
      return json(res, response);
    }

    // ── Readiness Score ─────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/readiness') {
      const today = new Date().toISOString().slice(0, 10);
      const entry = db.wellness.getByDate(today);
      if (!entry) return json(res, { error: 'No wellness check-in for today', score: null });

      const sleep_score     = Math.min(20, ((entry.sleep_hours || 0) / 8.0) * 20);
      const sleep_qual_score = ((entry.sleep_quality || 0) / 5) * 15;
      const energy_score    = ((entry.energy || 0) / 5) * 20;
      const mood_score      = ((entry.mood || 0) / 5) * 10;
      const libido_score    = ((entry.libido || 0) / 5) * 5;
      const joint_score     = ((6 - (entry.joint_pain || 0)) / 5) * 15;
      const appetite_score  = ((entry.appetite || 0) / 5) * 5;
      const stress_score    = ((6 - (entry.stress || 0)) / 5) * 10;

      const total = Math.round(
        (sleep_score + sleep_qual_score + energy_score + mood_score +
         libido_score + joint_score + appetite_score + stress_score) * 10
      ) / 10;

      const score = Math.min(100, Math.max(0, total));

      let recommendation;
      if (score >= 80) recommendation = 'Train hard — you\'re recovered';
      else if (score >= 60) recommendation = 'Moderate intensity — don\'t push PRs';
      else recommendation = 'Light session or rest — recovery is low';

      return json(res, {
        date: today,
        score,
        breakdown: {
          sleep: Math.round((sleep_score + sleep_qual_score) * 10) / 10,
          energy: Math.round(energy_score * 10) / 10,
          mood: Math.round(mood_score * 10) / 10,
          recovery: Math.round((libido_score + joint_score + appetite_score) * 10) / 10,
          stress: Math.round(stress_score * 10) / 10,
        },
        recommendation,
      });
    }

    if (method === 'GET' && pathname === '/api/readiness/history') {
      const q = query(req.url);
      const days = parseInt(q.days, 10) || 7;
      const entries = db.wellness.list();

      // Take last N days of entries
      const recent = entries.slice(0, days);
      const results = recent.map(entry => {
        const sleep_score     = Math.min(20, ((entry.sleep_hours || 0) / 8.0) * 20);
        const sleep_qual_score = ((entry.sleep_quality || 0) / 5) * 15;
        const energy_score    = ((entry.energy || 0) / 5) * 20;
        const mood_score      = ((entry.mood || 0) / 5) * 10;
        const libido_score    = ((entry.libido || 0) / 5) * 5;
        const joint_score     = ((6 - (entry.joint_pain || 0)) / 5) * 15;
        const appetite_score  = ((entry.appetite || 0) / 5) * 5;
        const stress_score    = ((6 - (entry.stress || 0)) / 5) * 10;

        const total = Math.round(
          (sleep_score + sleep_qual_score + energy_score + mood_score +
           libido_score + joint_score + appetite_score + stress_score) * 10
        ) / 10;
        const score = Math.min(100, Math.max(0, total));

        let recommendation;
        if (score >= 80) recommendation = 'Train hard — you\'re recovered';
        else if (score >= 60) recommendation = 'Moderate intensity — don\'t push PRs';
        else recommendation = 'Light session or rest — recovery is low';

        return { date: entry.date, score, recommendation };
      });

      return json(res, results);
    }

    // ── Blood Work OCR Parser (Stub) ────────────────────────────────
    if (method === 'POST' && pathname === '/api/bloodwork/parse') {
      const body = await parseBody(req);
      if (!body.text) return error(res, 'text field required');

      const text = body.text;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const parsed = [];
      const unparsed = [];

      // Comprehensive regex patterns for common lab markers
      const patterns = [
        // Testosterone
        { regex: /testosterone[,:]?\s*total[:\s]*(\d+\.?\d*)\s*(ng\/dL|ng\/ml)/i, marker: 'Total Testosterone' },
        { regex: /total\s+testosterone[:\s]*(\d+\.?\d*)\s*(ng\/dL|ng\/ml)/i, marker: 'Total Testosterone' },
        { regex: /testosterone[,:]?\s*free[:\s]*(\d+\.?\d*)\s*(pg\/mL|ng\/dL)/i, marker: 'Free Testosterone' },
        { regex: /free\s+testosterone[:\s]*(\d+\.?\d*)\s*(pg\/mL|ng\/dL)/i, marker: 'Free Testosterone' },
        { regex: /testosterone[:\s]*(\d+\.?\d*)\s*(ng\/dL)/i, marker: 'Total Testosterone' },
        // Estrogen
        { regex: /estradiol(?:\s*\(E2\))?[:\s]*(\d+\.?\d*)\s*(pg\/mL|pmol\/L)/i, marker: 'Estradiol (E2)' },
        { regex: /estrogen[:\s]*(\d+\.?\d*)\s*(pg\/mL|pmol\/L)/i, marker: 'Estradiol (E2)' },
        // Liver
        { regex: /\bAST[:\s]*(\d+\.?\d*)\s*(U\/L|IU\/L)/i, marker: 'AST' },
        { regex: /\bALT[:\s]*(\d+\.?\d*)\s*(U\/L|IU\/L)/i, marker: 'ALT' },
        { regex: /\bGGT[:\s]*(\d+\.?\d*)\s*(U\/L|IU\/L)/i, marker: 'GGT' },
        { regex: /alkaline\s+phosphatase[:\s]*(\d+\.?\d*)\s*(U\/L|IU\/L)/i, marker: 'Alkaline Phosphatase' },
        { regex: /\bALP[:\s]*(\d+\.?\d*)\s*(U\/L|IU\/L)/i, marker: 'Alkaline Phosphatase' },
        { regex: /bilirubin[,:]?\s*total[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Total Bilirubin' },
        { regex: /total\s+bilirubin[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Total Bilirubin' },
        { regex: /bilirubin[,:]?\s*direct[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Direct Bilirubin' },
        { regex: /albumin[:\s]*(\d+\.?\d*)\s*(g\/dL)/i, marker: 'Albumin' },
        { regex: /total\s+protein[:\s]*(\d+\.?\d*)\s*(g\/dL)/i, marker: 'Total Protein' },
        // Lipids
        { regex: /total\s+cholesterol[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Total Cholesterol' },
        { regex: /cholesterol[,:]?\s*total[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Total Cholesterol' },
        { regex: /HDL\s*(?:cholesterol)?[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'HDL' },
        { regex: /LDL\s*(?:cholesterol)?[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'LDL' },
        { regex: /triglycerides[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Triglycerides' },
        { regex: /VLDL[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'VLDL' },
        // Blood count
        { regex: /hematocrit[:\s]*(\d+\.?\d*)\s*(%)/i, marker: 'Hematocrit' },
        { regex: /\bHCT[:\s]*(\d+\.?\d*)\s*(%)/i, marker: 'Hematocrit' },
        { regex: /hemoglobin[:\s]*(\d+\.?\d*)\s*(g\/dL)/i, marker: 'Hemoglobin' },
        { regex: /\bHGB[:\s]*(\d+\.?\d*)\s*(g\/dL)/i, marker: 'Hemoglobin' },
        { regex: /\bRBC[:\s]*(\d+\.?\d*)\s*(M\/uL|x10\^6\/uL|10\*6\/uL)/i, marker: 'RBC' },
        { regex: /\bWBC[:\s]*(\d+\.?\d*)\s*(K\/uL|x10\^3\/uL|10\*3\/uL)/i, marker: 'WBC' },
        { regex: /platelets?[:\s]*(\d+\.?\d*)\s*(K\/uL|x10\^3\/uL|10\*3\/uL)/i, marker: 'Platelets' },
        { regex: /\bMCV[:\s]*(\d+\.?\d*)\s*(fL)/i, marker: 'MCV' },
        { regex: /\bMCH[:\s]*(\d+\.?\d*)\s*(pg)/i, marker: 'MCH' },
        { regex: /\bMCHC[:\s]*(\d+\.?\d*)\s*(g\/dL|%)/i, marker: 'MCHC' },
        { regex: /\bRDW[:\s]*(\d+\.?\d*)\s*(%)/i, marker: 'RDW' },
        // Kidney
        { regex: /creatinine[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Creatinine' },
        { regex: /\bBUN[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'BUN' },
        { regex: /\beGFR[:\s]*(\d+\.?\d*)\s*(mL\/min)/i, marker: 'eGFR' },
        { regex: /uric\s+acid[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Uric Acid' },
        // Thyroid
        { regex: /\bTSH[:\s]*(\d+\.?\d*)\s*((?:u|m)IU\/(?:m)?L|mIU\/L)/i, marker: 'TSH' },
        { regex: /free\s+T4[:\s]*(\d+\.?\d*)\s*(ng\/dL)/i, marker: 'Free T4' },
        { regex: /free\s+T3[:\s]*(\d+\.?\d*)\s*(pg\/mL)/i, marker: 'Free T3' },
        { regex: /\bT4[,:]?\s*free[:\s]*(\d+\.?\d*)\s*(ng\/dL)/i, marker: 'Free T4' },
        { regex: /\bT3[,:]?\s*free[:\s]*(\d+\.?\d*)\s*(pg\/mL)/i, marker: 'Free T3' },
        // Metabolic
        { regex: /glucose[,:]?\s*(?:fasting)?[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Glucose' },
        { regex: /fasting\s+glucose[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Glucose' },
        { regex: /\bHbA1c[:\s]*(\d+\.?\d*)\s*(%)/i, marker: 'HbA1c' },
        { regex: /hemoglobin\s+A1c[:\s]*(\d+\.?\d*)\s*(%)/i, marker: 'HbA1c' },
        { regex: /insulin[:\s]*(\d+\.?\d*)\s*(uIU\/mL|mIU\/L)/i, marker: 'Insulin' },
        // Hormones
        { regex: /\bLH[:\s]*(\d+\.?\d*)\s*(mIU\/mL|IU\/L)/i, marker: 'LH' },
        { regex: /\bFSH[:\s]*(\d+\.?\d*)\s*(mIU\/mL|IU\/L)/i, marker: 'FSH' },
        { regex: /prolactin[:\s]*(\d+\.?\d*)\s*(ng\/mL|ug\/L)/i, marker: 'Prolactin' },
        { regex: /\bDHEA[- ]?S(?:ulfate)?[:\s]*(\d+\.?\d*)\s*((?:u|m)g\/dL|umol\/L)/i, marker: 'DHEA-S' },
        { regex: /\bSHBG[:\s]*(\d+\.?\d*)\s*(nmol\/L)/i, marker: 'SHBG' },
        { regex: /progesterone[:\s]*(\d+\.?\d*)\s*(ng\/mL)/i, marker: 'Progesterone' },
        { regex: /cortisol[:\s]*(\d+\.?\d*)\s*(ug\/dL|nmol\/L)/i, marker: 'Cortisol' },
        { regex: /IGF[- ]?1[:\s]*(\d+\.?\d*)\s*(ng\/mL)/i, marker: 'IGF-1' },
        // Electrolytes
        { regex: /sodium[:\s]*(\d+\.?\d*)\s*(mmol\/L|mEq\/L)/i, marker: 'Sodium' },
        { regex: /potassium[:\s]*(\d+\.?\d*)\s*(mmol\/L|mEq\/L)/i, marker: 'Potassium' },
        { regex: /calcium[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Calcium' },
        { regex: /magnesium[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Magnesium' },
        { regex: /phosphorus[:\s]*(\d+\.?\d*)\s*(mg\/dL)/i, marker: 'Phosphorus' },
        { regex: /chloride[:\s]*(\d+\.?\d*)\s*(mmol\/L|mEq\/L)/i, marker: 'Chloride' },
        { regex: /\bCO2[:\s]*(\d+\.?\d*)\s*(mmol\/L|mEq\/L)/i, marker: 'CO2' },
        { regex: /bicarbonate[:\s]*(\d+\.?\d*)\s*(mmol\/L|mEq\/L)/i, marker: 'Bicarbonate' },
        // Iron
        { regex: /ferritin[:\s]*(\d+\.?\d*)\s*(ng\/mL|ug\/L)/i, marker: 'Ferritin' },
        { regex: /\biron[:\s]*(\d+\.?\d*)\s*(ug\/dL|umol\/L)/i, marker: 'Iron' },
        { regex: /\bTIBC[:\s]*(\d+\.?\d*)\s*(ug\/dL)/i, marker: 'TIBC' },
        // Inflammation / misc
        { regex: /\bCRP[:\s]*(\d+\.?\d*)\s*(mg\/L|mg\/dL)/i, marker: 'CRP' },
        { regex: /\bESR[:\s]*(\d+\.?\d*)\s*(mm\/hr)/i, marker: 'ESR' },
        { regex: /vitamin\s*D[:\s]*(\d+\.?\d*)\s*(ng\/mL)/i, marker: 'Vitamin D' },
        { regex: /25-hydroxy.*?vitamin\s*D[:\s]*(\d+\.?\d*)\s*(ng\/mL)/i, marker: 'Vitamin D' },
        { regex: /vitamin\s*B12[:\s]*(\d+\.?\d*)\s*(pg\/mL)/i, marker: 'Vitamin B12' },
        { regex: /folate[:\s]*(\d+\.?\d*)\s*(ng\/mL)/i, marker: 'Folate' },
        { regex: /\bPSA[:\s]*(\d+\.?\d*)\s*(ng\/mL)/i, marker: 'PSA' },
      ];

      for (const line of lines) {
        let matched = false;
        for (const p of patterns) {
          const m = line.match(p.regex);
          if (m) {
            parsed.push({
              marker: p.marker,
              value: parseFloat(m[1]),
              unit: m[2],
            });
            matched = true;
            break;
          }
        }
        if (!matched) {
          unparsed.push(line);
        }
      }

      return json(res, { parsed, unparsed });
    }

    // ── Supplements ─────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/supplements') {
      return json(res, db.supplements.list({ active: true }));
    }

    if (method === 'POST' && pathname === '/api/supplements') {
      const body = await parseBody(req);
      if (!body.name) return error(res, 'name required');
      return json(res, db.supplements.create(body), 201);
    }

    if (method === 'PUT' && (params = matchRoute('/api/supplements/:id', pathname))) {
      const existing = db.supplements.getById(Number(params.id));
      if (!existing) return error(res, 'Supplement not found', 404);
      const body = await parseBody(req);
      return json(res, db.supplements.update(Number(params.id), body));
    }

    if (method === 'DELETE' && (params = matchRoute('/api/supplements/:id', pathname))) {
      const existing = db.supplements.getById(Number(params.id));
      if (!existing) return error(res, 'Supplement not found', 404);
      db.supplements.delete(Number(params.id));
      return json(res, { deleted: true });
    }

    // ── Supplement Log ──────────────────────────────────────────────
    if (method === 'POST' && pathname === '/api/supplement-log') {
      const body = await parseBody(req);
      if (!body.supplement_id || !body.taken_at) return error(res, 'supplement_id and taken_at required');
      const supp = db.supplements.getById(body.supplement_id);
      if (!supp) return error(res, 'Supplement not found', 404);
      return json(res, db.supplementLog.create(body), 201);
    }

    if (method === 'GET' && pathname === '/api/supplement-log') {
      const q = query(req.url);
      const date = q.date || new Date().toISOString().slice(0, 10);
      return json(res, db.supplementLog.listByDate(date));
    }

    // ════════════════════════════════════════════════════════════════
    //  FEATURE 6: Gamification (Streaks, Achievements, PRs)
    // ════════════════════════════════════════════════════════════════

    // ── Achievements ────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/achievements') {
      return json(res, db.achievements.list());
    }

    if (method === 'POST' && pathname === '/api/achievements/check') {
      const newlyUnlocked = [];
      const allAchievements = db.achievements.list();
      const locked = allAchievements.filter(a => !a.unlocked_at);
      if (locked.length === 0) return json(res, { newly_unlocked: [], achievements: allAchievements });

      // Gather counts from DB
      const totalWorkouts  = getDb().prepare('SELECT COUNT(*) AS cnt FROM workouts').get().cnt;
      const totalDoses     = getDb().prepare('SELECT COUNT(*) AS cnt FROM dose_log').get().cnt;
      const totalBlood     = getDb().prepare('SELECT COUNT(*) AS cnt FROM blood_work').get().cnt;
      const totalCheckins  = getDb().prepare('SELECT COUNT(*) AS cnt FROM wellness').get().cnt;
      const totalPhotos    = getDb().prepare('SELECT COUNT(*) AS cnt FROM progress_photos').get().cnt;
      const totalComps     = getDb().prepare('SELECT COUNT(*) AS cnt FROM competitions').get().cnt;
      const totalPRs       = getDb().prepare('SELECT COUNT(*) AS cnt FROM one_rm_log').get().cnt;
      const streakData     = db.streaks.get();
      const currentStreak  = streakData ? streakData.current_streak : 0;

      // Weight log days
      const weightDays = getDb().prepare('SELECT COUNT(DISTINCT date) AS cnt FROM measurements WHERE weight IS NOT NULL').get().cnt;

      // Big 3 total: best estimated_1rm for squat, bench, deadlift
      const squat1rm = getDb().prepare(
        "SELECT MAX(estimated_1rm) AS best FROM one_rm_log WHERE LOWER(exercise) LIKE '%squat%'"
      ).get().best || 0;
      const bench1rm = getDb().prepare(
        "SELECT MAX(estimated_1rm) AS best FROM one_rm_log WHERE LOWER(exercise) LIKE '%bench%'"
      ).get().best || 0;
      const dead1rm = getDb().prepare(
        "SELECT MAX(estimated_1rm) AS best FROM one_rm_log WHERE LOWER(exercise) LIKE '%deadlift%'"
      ).get().best || 0;
      const big3Total = squat1rm + bench1rm + dead1rm;

      // Meal count (supplement_log can serve as meal proxy, but we check if a meals table exists)
      // Since no meals table exists, first_meal stays locked unless we add one.
      // For now use 0 — the achievement exists but cannot be unlocked yet.
      const totalMeals = 0;

      // Achievement unlock rules
      const rules = {
        first_workout:     totalWorkouts >= 1,
        workouts_10:       totalWorkouts >= 10,
        workouts_50:       totalWorkouts >= 50,
        workouts_100:      totalWorkouts >= 100,
        first_dose:        totalDoses >= 1,
        doses_100:         totalDoses >= 100,
        first_blood_panel: totalBlood >= 1,
        blood_panels_10:   totalBlood >= 10,
        first_pr:          totalPRs >= 1,
        weight_logged_30:  weightDays >= 30,
        first_competition: totalComps >= 1,
        checkin_7:         totalCheckins >= 7,
        checkin_30:        totalCheckins >= 30,
        photos_5:          totalPhotos >= 5,
        streak_3:          currentStreak >= 3,
        streak_7:          currentStreak >= 7,
        streak_30:         currentStreak >= 30,
        streak_100:        currentStreak >= 100,
        big3_1000:         big3Total >= 1000,
        first_meal:        totalMeals >= 1,
      };

      for (const a of locked) {
        if (rules[a.key]) {
          db.achievements.unlock(a.key);
          const updated = db.achievements.getByKey(a.key);
          newlyUnlocked.push(updated);
        }
      }

      return json(res, { newly_unlocked: newlyUnlocked, achievements: db.achievements.list() });
    }

    // ── Streaks ─────────────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/streaks') {
      return json(res, db.streaks.get());
    }

    if (method === 'POST' && pathname === '/api/streaks/update') {
      const today = new Date().toISOString().slice(0, 10);
      const streakData = db.streaks.get();

      // Recount totals from source tables
      const totalWorkouts = getDb().prepare('SELECT COUNT(*) AS cnt FROM workouts').get().cnt;
      const totalDoses    = getDb().prepare('SELECT COUNT(*) AS cnt FROM dose_log').get().cnt;
      const totalCheckins = getDb().prepare('SELECT COUNT(*) AS cnt FROM wellness').get().cnt;

      let currentStreak = streakData.current_streak;
      let longestStreak = streakData.longest_streak;
      const lastDate    = streakData.last_activity_date;

      if (lastDate === today) {
        // Already counted today, just update totals
      } else {
        // Check if yesterday
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday) {
          currentStreak += 1;
        } else if (!lastDate) {
          currentStreak = 1;
        } else {
          // Streak broken
          currentStreak = 1;
        }
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      }

      const updated = db.streaks.update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        total_workouts: totalWorkouts,
        total_doses: totalDoses,
        total_checkins: totalCheckins,
      });

      return json(res, updated);
    }

    // ════════════════════════════════════════════════════════════════
    //  FEATURE 7: Coach/Client Platform
    // ════════════════════════════════════════════════════════════════

    if (method === 'POST' && pathname === '/api/coach/share') {
      const body = await parseBody(req);
      const token = crypto.randomBytes(24).toString('hex');
      const share = db.coachShares.create({
        share_token: token,
        coach_name: body.coach_name || null,
        permissions: body.permissions || 'read',
        sections: body.sections || ['cycles', 'blood', 'body', 'training', 'wellness'],
      });
      return json(res, share, 201);
    }

    if (method === 'GET' && pathname === '/api/coach/shares') {
      return json(res, db.coachShares.list());
    }

    if (method === 'DELETE' && (params = matchRoute('/api/coach/shares/:id', pathname))) {
      const existing = db.coachShares.getById(Number(params.id));
      if (!existing) return error(res, 'Share not found', 404);
      db.coachShares.revoke(Number(params.id));
      return json(res, { revoked: true });
    }

    if (method === 'GET' && (params = matchRoute('/api/coach/view/:token', pathname))) {
      const share = db.coachShares.getByToken(params.token);
      if (!share) return error(res, 'Invalid or revoked share link', 404);

      const sections = share.sections ? JSON.parse(share.sections) : [];
      const data = {};

      if (sections.includes('cycles')) {
        data.cycles = db.cycles.list().map(c => {
          const comps = db.cycleCompounds.listByCycle(c.id);
          return { ...c, compounds: comps };
        });
      }
      if (sections.includes('blood')) {
        data.bloodWork = db.bloodWork.list().map(bw => db.bloodWork.getById(bw.id));
      }
      if (sections.includes('body')) {
        data.measurements = db.measurements.list();
        // Exclude photo_data for privacy — just metadata
        data.photos = db.progressPhotos.list();
      }
      if (sections.includes('training')) {
        data.workouts = db.workouts.list().map(w => db.workouts.getById(w.id));
        data.oneRmLog = db.oneRmLog.list();
      }
      if (sections.includes('wellness')) {
        data.wellness = db.wellness.list();
      }

      data.share = { coach_name: share.coach_name, permissions: share.permissions, sections };
      data.notes = db.coachNotes.listByShare(share.id);

      return json(res, data);
    }

    if (method === 'POST' && (params = matchRoute('/api/coach/notes/:token', pathname))) {
      const share = db.coachShares.getByToken(params.token);
      if (!share) return error(res, 'Invalid or revoked share link', 404);
      if (share.permissions !== 'read_write') return error(res, 'Write permission required', 403);

      const body = await parseBody(req);
      if (!body.date || !body.note) return error(res, 'date and note required');

      const note = db.coachNotes.create({
        share_id: share.id,
        date: body.date,
        note: body.note,
        from_coach: body.from_coach !== undefined ? body.from_coach : 1,
      });
      return json(res, note, 201);
    }

    if (method === 'GET' && (params = matchRoute('/api/coach/notes/:share_id', pathname))) {
      return json(res, db.coachNotes.listByShare(Number(params.share_id)));
    }

    // ════════════════════════════════════════════════════════════════
    //  FEATURE 8: Social Features (Shareable Cards)
    // ════════════════════════════════════════════════════════════════

    if (method === 'GET' && (params = matchRoute('/api/share/workout/:id', pathname))) {
      const workout = db.workouts.getById(Number(params.id));
      if (!workout) return error(res, 'Workout not found', 404);

      const sets = workout.sets || [];
      const exerciseList = [...new Set(sets.map(s => s.exercise))];
      const totalVolume = sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0);
      const totalSets = sets.length;
      const totalReps = sets.reduce((sum, s) => sum + (s.reps || 0), 0);

      // Check for PRs: find if any set weight is the all-time max for that exercise
      const prs = [];
      for (const exercise of exerciseList) {
        const exerciseSets = sets.filter(s => s.exercise === exercise);
        const maxWeight = Math.max(...exerciseSets.map(s => s.weight || 0));
        if (maxWeight > 0) {
          const allTimeBest = getDb().prepare(
            'SELECT MAX(ws.weight) AS best FROM workout_sets ws WHERE ws.exercise = ?'
          ).get(exercise);
          if (allTimeBest && allTimeBest.best === maxWeight) {
            prs.push({ exercise, weight: maxWeight });
          }
        }
      }

      return json(res, {
        date: workout.date,
        name: workout.name,
        duration_min: workout.duration_min,
        exercises: exerciseList,
        total_sets: totalSets,
        total_reps: totalReps,
        total_volume: Math.round(totalVolume),
        prs,
      });
    }

    if (method === 'GET' && pathname === '/api/share/progress') {
      const allMeasurements = db.measurements.list();
      const latest = allMeasurements[0] || null;
      const oldest = allMeasurements[allMeasurements.length - 1] || null;

      let weightChange = null;
      let measurementChanges = {};
      if (latest && oldest && allMeasurements.length > 1) {
        if (latest.weight != null && oldest.weight != null) {
          weightChange = Math.round((latest.weight - oldest.weight) * 10) / 10;
        }
        const bodyParts = ['neck', 'chest', 'shoulders', 'left_arm', 'right_arm', 'waist', 'hips', 'left_quad', 'right_quad', 'left_calf', 'right_calf'];
        for (const part of bodyParts) {
          if (latest[part] != null && oldest[part] != null) {
            measurementChanges[part] = Math.round((latest[part] - oldest[part]) * 10) / 10;
          }
        }
      }

      // Current cycle info (NO compound details for privacy)
      const allCycles = db.cycles.list();
      const activeCycle = allCycles.find(c => !c.end_date || new Date(c.end_date) >= new Date());
      let cycleInfo = null;
      if (activeCycle) {
        const weeksIn = Math.floor((Date.now() - new Date(activeCycle.start_date).getTime()) / (7 * 86400000));
        cycleInfo = { name: activeCycle.name, type: activeCycle.type, weeks_in: weeksIn };
      }

      return json(res, {
        current_weight: latest ? latest.weight : null,
        current_bf: latest ? latest.body_fat : null,
        weight_change: weightChange,
        measurement_changes: measurementChanges,
        total_measurements: allMeasurements.length,
        cycle: cycleInfo,
      });
    }

    if (method === 'GET' && (params = matchRoute('/api/share/meet/:id', pathname))) {
      const meet = db.plMeets.getById(Number(params.id));
      if (!meet) return error(res, 'Meet not found', 404);

      return json(res, {
        name: meet.name,
        federation: meet.federation,
        date: meet.date,
        weight_class: meet.weight_class,
        body_weight: meet.body_weight,
        squat_best: meet.squat_best,
        bench_best: meet.bench_best,
        deadlift_best: meet.deadlift_best,
        total: meet.total,
        wilks: meet.wilks,
        dots: meet.dots,
        placement: meet.placement,
      });
    }

    // ════════════════════════════════════════════════════════════════
    //  FEATURE 9: AI Workout Suggestions
    // ════════════════════════════════════════════════════════════════

    if (method === 'GET' && pathname === '/api/suggest/workout') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const recentWorkouts = db.workouts.list({ from: sevenDaysAgo, to: today });

      // Build muscle-group -> last trained date map
      const muscleLastTrained = {};
      for (const w of recentWorkouts) {
        const full = db.workouts.getById(w.id);
        if (!full || !full.sets) continue;
        for (const s of full.sets) {
          const exName = (s.exercise || '').toLowerCase();
          // Map exercise name to muscle groups using the exercise database
          const exObj = exercisesModule.exercises.find(e =>
            e.id === exName || e.name.toLowerCase() === exName ||
            exName.includes(e.id) || e.id.includes(exName.replace(/\s+/g, '-'))
          );
          const muscles = exObj
            ? [...(exObj.musclesPrimary || []), ...(exObj.musclesSecondary || [])]
            : guessMuscleGroup(exName);
          for (const m of muscles) {
            if (!muscleLastTrained[m] || w.date > muscleLastTrained[m]) {
              muscleLastTrained[m] = w.date;
            }
          }
        }
      }

      // Find muscle groups NOT trained in 48+ hours
      const cutoff = new Date(Date.now() - 48 * 3600000).toISOString().slice(0, 10);
      const allMuscles = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'calves', 'abs', 'traps'];
      const rested = allMuscles.filter(m => !muscleLastTrained[m] || muscleLastTrained[m] <= cutoff);

      // Select best template
      const templateMuscles = {
        push:    ['chest', 'shoulders', 'triceps'],
        pull:    ['back', 'biceps', 'traps'],
        legs:    ['quads', 'hamstrings', 'glutes', 'calves'],
        'upper-body': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        'lower-body': ['quads', 'hamstrings', 'glutes', 'calves'],
        'full-body': allMuscles,
        arms:    ['biceps', 'triceps'],
        'chest-and-back': ['chest', 'back'],
      };

      let bestTemplate = 'full-body';
      let bestScore = 0;
      let bestReason = 'Full body session recommended';

      for (const [tid, muscles] of Object.entries(templateMuscles)) {
        const overlap = muscles.filter(m => rested.includes(m)).length;
        const score = overlap / muscles.length;
        if (score > bestScore) {
          bestScore = score;
          bestTemplate = tid;
          bestReason = muscles.filter(m => rested.includes(m)).join(', ');
        }
      }

      const template = exercisesModule.TEMPLATES.find(t => t.id === bestTemplate);
      const expanded = template ? template.exercises.map(e => {
        const ex = exercisesModule.exercisesById[e.exerciseId];
        return {
          exercise: ex ? ex.name : e.exerciseId,
          sets: e.sets,
          reps: `${e.repsMin}-${e.repsMax}`,
        };
      }) : [];

      // Days since last trained for rested muscles
      const daysSinceMap = {};
      for (const m of rested) {
        if (muscleLastTrained[m]) {
          daysSinceMap[m] = Math.floor((Date.now() - new Date(muscleLastTrained[m]).getTime()) / 86400000);
        } else {
          daysSinceMap[m] = 7; // not trained in the window
        }
      }

      const maxDays = Math.max(...Object.values(daysSinceMap), 2);

      return json(res, {
        suggestion: template ? template.name : bestTemplate,
        reason: `${bestReason} haven't been trained in ${maxDays}+ days`,
        exercises: expanded,
        estimated_duration: expanded.length * 8 + 5, // ~8 min per exercise + warmup
        rested_muscles: rested,
        muscle_days_since: daysSinceMap,
        workouts_last_7_days: recentWorkouts.length,
      });
    }

    if (method === 'GET' && pathname === '/api/suggest/deload') {
      // Check if user needs a deload
      const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const recentWorkouts = db.workouts.list({ from: fourWeeksAgo, to: today });
      const weeksOfTraining = recentWorkouts.length > 0 ? Math.ceil(recentWorkouts.length / 4) : 0;

      // Check wellness trend (last 7 days)
      const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const wellnessEntries = db.wellness.list({ from: sevenAgo, to: today });
      let decliningWellness = false;
      let avgEnergy = null;
      let avgMood = null;

      if (wellnessEntries.length >= 3) {
        const energies = wellnessEntries.filter(w => w.energy != null).map(w => w.energy);
        const moods = wellnessEntries.filter(w => w.mood != null).map(w => w.mood);
        if (energies.length >= 3) {
          avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
          const firstHalf = energies.slice(Math.floor(energies.length / 2));
          const secondHalf = energies.slice(0, Math.floor(energies.length / 2));
          const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          if (avg2 < avg1 - 0.5) decliningWellness = true;
        }
        if (moods.length >= 3) {
          avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
        }
      }

      const needsDeload = recentWorkouts.length >= 16 || decliningWellness; // 16+ workouts in 4 weeks ~= 4/week
      let reason = '';
      if (recentWorkouts.length >= 16) reason += `${recentWorkouts.length} workouts in the last 4 weeks without a break. `;
      if (decliningWellness) reason += 'Wellness scores show a declining trend. ';
      if (!needsDeload) reason = 'Training load looks manageable. No deload needed yet.';

      return json(res, {
        needs_deload: needsDeload,
        reason: reason.trim(),
        workouts_last_4_weeks: recentWorkouts.length,
        avg_energy: avgEnergy ? Math.round(avgEnergy * 10) / 10 : null,
        avg_mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
        declining_wellness: decliningWellness,
        recommendation: needsDeload
          ? 'Take a deload week: reduce volume by 40-50%, keep intensity moderate, focus on recovery.'
          : 'Continue training as planned.',
      });
    }

    if (method === 'GET' && pathname === '/api/suggest/compound') {
      // Based on active cycle goal, suggest compounds
      const allCycles = db.cycles.list();
      const activeCycle = allCycles.find(c => !c.end_date || new Date(c.end_date) >= new Date());
      const cycleType = activeCycle ? (activeCycle.type || 'blast') : 'blast';

      // Determine goal from cycle type
      const goalMap = { blast: 'bulking', cut: 'cutting', cruise: 'trt', recomp: 'recomp', bridge: 'trt' };
      const goal = goalMap[cycleType] || 'bulking';

      // Get all compounds and filter by bestFor
      const allCompounds = compounds.getAll();
      const suggestions = (Array.isArray(allCompounds) ? allCompounds : [])
        .filter(c => c.bestFor && c.bestFor.includes(goal))
        .map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          bestFor: c.bestFor,
          typicalDose: c.doseMaleMin && c.doseMaleMax ? `${c.doseMaleMin}-${c.doseMaleMax} mg` : null,
          frequency: c.frequencyDisplay,
          aromatization: c.aromatization || 'none',
          liverToxicity: c.liverToxicity,
          halfLife: c.halfLifeDisplay,
          notes: c.notes,
        }));

      return json(res, {
        goal,
        cycle: activeCycle ? { name: activeCycle.name, type: activeCycle.type } : null,
        suggestions,
        disclaimer: 'This is educational information only, NOT a prescription. Consult a medical professional before using any compounds.',
      });
    }

    // ════════════════════════════════════════════════════════════════
    //  FEATURE 10: Analytics Dashboard
    // ════════════════════════════════════════════════════════════════

    if (method === 'GET' && pathname === '/api/analytics') {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);

      // ─── Training analytics ───────────────────────────────────────
      const allWorkouts = db.workouts.list();
      const totalWorkouts = allWorkouts.length;

      // This week (Mon-Sun)
      const dayOfWeek = now.getDay() || 7; // 1=Mon...7=Sun
      const weekStart = new Date(now.getTime() - (dayOfWeek - 1) * 86400000).toISOString().slice(0, 10);
      const workoutsThisWeek = allWorkouts.filter(w => w.date >= weekStart).length;

      // Total volume & avg duration
      let totalVolume = 0;
      let totalDuration = 0;
      let durationCount = 0;
      const muscleGroupSets = {};
      const exerciseStats = {};

      for (const w of allWorkouts) {
        if (w.duration_min) { totalDuration += w.duration_min; durationCount++; }
        const full = db.workouts.getById(w.id);
        if (!full || !full.sets) continue;
        for (const s of full.sets) {
          const vol = (s.weight || 0) * (s.reps || 0);
          totalVolume += vol;

          // Exercise stats
          if (!exerciseStats[s.exercise]) exerciseStats[s.exercise] = { exercise: s.exercise, totalSets: 0, totalVolume: 0 };
          exerciseStats[s.exercise].totalSets++;
          exerciseStats[s.exercise].totalVolume += vol;

          // Muscle group balance
          const exObj = exercisesModule.exercises.find(e =>
            e.id === (s.exercise || '').toLowerCase().replace(/\s+/g, '-') ||
            e.name.toLowerCase() === (s.exercise || '').toLowerCase()
          );
          const primaryMuscles = exObj ? exObj.musclesPrimary : guessMuscleGroup((s.exercise || '').toLowerCase());
          for (const m of primaryMuscles) {
            muscleGroupSets[m] = (muscleGroupSets[m] || 0) + 1;
          }
        }
      }

      // Volume trend — last 4 weeks
      const volumeTrend = [];
      for (let i = 3; i >= 0; i--) {
        const wStart = new Date(now.getTime() - (dayOfWeek - 1 + i * 7) * 86400000).toISOString().slice(0, 10);
        const wEnd = new Date(now.getTime() - (dayOfWeek - 1 + (i - 1) * 7) * 86400000).toISOString().slice(0, 10);
        const weekWorkouts = allWorkouts.filter(w => w.date >= wStart && w.date < wEnd);
        let weekVol = 0;
        for (const w of weekWorkouts) {
          const full = db.workouts.getById(w.id);
          if (full && full.sets) {
            for (const s of full.sets) weekVol += (s.weight || 0) * (s.reps || 0);
          }
        }
        volumeTrend.push({ week_start: wStart, volume: Math.round(weekVol) });
      }

      const topExercises = Object.values(exerciseStats)
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 10)
        .map(e => ({ ...e, totalVolume: Math.round(e.totalVolume) }));

      // ─── Body analytics ───────────────────────────────────────────
      const allMeasurements = db.measurements.list();
      const latestMeasure = allMeasurements[0] || {};
      const currentWeight = latestMeasure.weight || null;
      const currentBF = latestMeasure.body_fat || null;
      const leanMass = (currentWeight && currentBF) ? Math.round(currentWeight * (1 - currentBF / 100) * 10) / 10 : null;

      // Weight change 30d / 90d
      const date30 = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
      const date90 = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);
      const measure30 = allMeasurements.find(m => m.date <= date30 && m.weight != null);
      const measure90 = allMeasurements.find(m => m.date <= date90 && m.weight != null);

      const weightChange30d = (currentWeight && measure30 && measure30.weight) ? Math.round((currentWeight - measure30.weight) * 10) / 10 : null;
      const weightChange90d = (currentWeight && measure90 && measure90.weight) ? Math.round((currentWeight - measure90.weight) * 10) / 10 : null;

      // Measurement changes (latest vs earliest)
      const measurementChanges = {};
      if (allMeasurements.length > 1) {
        const oldest = allMeasurements[allMeasurements.length - 1];
        const bodyParts = ['neck', 'chest', 'shoulders', 'left_arm', 'right_arm', 'waist', 'hips', 'left_quad', 'right_quad', 'left_calf', 'right_calf'];
        for (const part of bodyParts) {
          if (latestMeasure[part] != null && oldest[part] != null) {
            measurementChanges[part] = Math.round((latestMeasure[part] - oldest[part]) * 10) / 10;
          }
        }
      }

      // ─── Compounds analytics ──────────────────────────────────────
      const allCycles = db.cycles.list();
      const activeCycle = allCycles.find(c => !c.end_date || new Date(c.end_date) >= new Date());
      let compoundsAnalytics = { activeCycle: null, weeksIn: 0, compoundsRunning: 0, totalWeeklyMg: 0, doseCompliance: null };

      if (activeCycle) {
        const weeksIn = Math.max(1, Math.floor((Date.now() - new Date(activeCycle.start_date).getTime()) / (7 * 86400000)));
        const cycleCompounds = db.cycleCompounds.listByCycle(activeCycle.id);

        // Calculate total weekly mg
        let totalWeeklyMg = 0;
        let expectedDosesTotal = 0;
        for (const cc of cycleCompounds) {
          // Parse frequency to weekly multiplier
          const freqMap = { 'eod': 3.5, 'e3.5d': 2, 'e3d': 2.33, 'e5d': 1.4, 'e7d': 1, 'ed': 7, 'e2w': 0.5, '2x/week': 2, '3x/week': 3 };
          const weeklyDoses = freqMap[(cc.frequency || '').toLowerCase()] || 2;
          totalWeeklyMg += cc.dose_mg * weeklyDoses;
          expectedDosesTotal += weeklyDoses * weeksIn;
        }

        // Dose compliance
        const cycleDoses = db.doseLog.list({ from: activeCycle.start_date, to: today });
        const actualDoses = cycleDoses.length;
        const compliance = expectedDosesTotal > 0 ? Math.round((actualDoses / expectedDosesTotal) * 100) : null;

        compoundsAnalytics = {
          activeCycle: activeCycle.name,
          weeksIn,
          compoundsRunning: cycleCompounds.length,
          totalWeeklyMg: Math.round(totalWeeklyMg),
          doseCompliance: compliance,
        };
      }

      // ─── Health analytics ─────────────────────────────────────────
      const allBlood = db.bloodWork.list();
      const lastBlood = allBlood[0] || null;
      const daysSinceBloodWork = lastBlood ? Math.floor((Date.now() - new Date(lastBlood.date).getTime()) / 86400000) : null;

      // Flagged markers from last blood panel
      const flaggedMarkers = [];
      if (lastBlood) {
        const panel = db.bloodWork.getById(lastBlood.id);
        if (panel && panel.markers) {
          for (const m of panel.markers) {
            if (m.flag && m.flag !== 'normal') {
              flaggedMarkers.push({ marker: m.marker, value: m.value, unit: m.unit, status: m.flag });
            }
          }
        }
      }

      // Readiness avg 7d
      const sevenAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      const wellnessEntries = db.wellness.list({ from: sevenAgo, to: today });
      let readinessAvg7d = null;

      const wellnessTrend = { energy: [], mood: [], sleep_quality: [], stress: [], libido: [] };
      if (wellnessEntries.length > 0) {
        let readinessSum = 0;
        for (const entry of wellnessEntries) {
          const sleep_score     = Math.min(20, ((entry.sleep_hours || 0) / 8.0) * 20);
          const sleep_qual_score = ((entry.sleep_quality || 0) / 5) * 15;
          const energy_score    = ((entry.energy || 0) / 5) * 20;
          const mood_score      = ((entry.mood || 0) / 5) * 10;
          const libido_score    = ((entry.libido || 0) / 5) * 5;
          const joint_score     = ((6 - (entry.joint_pain || 0)) / 5) * 15;
          const appetite_score  = ((entry.appetite || 0) / 5) * 5;
          const stress_score    = ((6 - (entry.stress || 0)) / 5) * 10;
          const total = Math.min(100, Math.max(0, sleep_score + sleep_qual_score + energy_score + mood_score + libido_score + joint_score + appetite_score + stress_score));
          readinessSum += total;

          wellnessTrend.energy.push(entry.energy);
          wellnessTrend.mood.push(entry.mood);
          wellnessTrend.sleep_quality.push(entry.sleep_quality);
          wellnessTrend.stress.push(entry.stress);
          wellnessTrend.libido.push(entry.libido);
        }
        readinessAvg7d = Math.round(readinessSum / wellnessEntries.length * 10) / 10;
      }

      // ─── Achievements analytics ───────────────────────────────────
      const allAchievements = db.achievements.list();
      const unlockedAchievements = allAchievements.filter(a => a.unlocked_at);
      const recentUnlocks = unlockedAchievements
        .sort((a, b) => (b.unlocked_at || '').localeCompare(a.unlocked_at || ''))
        .slice(0, 5)
        .map(a => ({ name: a.name, icon: a.icon, unlocked_at: a.unlocked_at }));
      const streakData = db.streaks.get();

      return json(res, {
        training: {
          totalWorkouts,
          totalVolume: Math.round(totalVolume),
          avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : null,
          workoutsThisWeek,
          volumeTrend,
          topExercises,
          muscleGroupBalance: muscleGroupSets,
        },
        body: {
          currentWeight,
          weightChange30d,
          weightChange90d,
          currentBF,
          leanMass,
          measurementChanges,
        },
        compounds: compoundsAnalytics,
        health: {
          lastBloodWork: lastBlood ? lastBlood.date : null,
          daysSinceBloodWork,
          flaggedMarkers,
          readinessAvg7d,
          wellnessTrend,
        },
        achievements: {
          totalUnlocked: unlockedAchievements.length,
          totalAvailable: allAchievements.length,
          recentUnlocks,
          currentStreak: streakData ? streakData.current_streak : 0,
        },
      });
    }

    // ── 404 ─────────────────────────────────────────────────────────
    error(res, 'Not found', 404);

  } catch (err) {
    console.error(`[ERROR] ${method} ${pathname}:`, err);
    error(res, err.message || 'Internal server error', 500);
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  // Initialize database on startup
  db.getDb();
  console.log(`Protocol server running on http://localhost:${PORT}`);
});

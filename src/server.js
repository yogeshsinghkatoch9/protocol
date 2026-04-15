'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const db        = require('./db');
const compoundsModule = require('./data/compounds');
const competitionsData = require('./data/competitions');

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

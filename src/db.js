'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'protocol.db');

let _db = null;

// ---------------------------------------------------------------------------
// Lazy singleton
// ---------------------------------------------------------------------------
function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initDb();
  }
  return _db;
}

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------
function initDb() {
  const db = _db || getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT,
      weight_unit TEXT DEFAULT 'lbs',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'blast',
      start_date TEXT NOT NULL,
      end_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cycle_compounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_id INTEGER REFERENCES cycles(id) ON DELETE CASCADE,
      compound_id TEXT NOT NULL,
      dose_mg REAL NOT NULL,
      frequency TEXT NOT NULL,
      route TEXT DEFAULT 'im',
      start_date TEXT NOT NULL,
      end_date TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS dose_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_compound_id INTEGER REFERENCES cycle_compounds(id) ON DELETE CASCADE,
      compound_id TEXT NOT NULL,
      dose_mg REAL NOT NULL,
      taken_at TEXT NOT NULL,
      injection_site TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS blood_work (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      lab_name TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blood_markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blood_work_id INTEGER REFERENCES blood_work(id) ON DELETE CASCADE,
      marker TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT,
      flag TEXT
    );

    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight REAL,
      body_fat REAL,
      neck REAL, chest REAL, shoulders REAL,
      left_arm REAL, right_arm REAL,
      waist REAL, hips REAL,
      left_quad REAL, right_quad REAL,
      left_calf REAL, right_calf REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS side_effects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      symptom TEXT NOT NULL,
      severity INTEGER DEFAULT 3,
      suspected_compound TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      name TEXT,
      duration_min INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
      exercise TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL,
      reps INTEGER,
      rpe REAL,
      set_type TEXT DEFAULT 'working',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      exercises TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wellness (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      sleep_hours REAL,
      sleep_quality INTEGER,
      energy INTEGER,
      mood INTEGER,
      libido INTEGER,
      joint_pain INTEGER,
      appetite INTEGER,
      stress INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS progress_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      pose TEXT,
      photo_data TEXT NOT NULL,
      weight REAL,
      body_fat REAL,
      cycle_id INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default profile row if missing
  const row = db.prepare('SELECT id FROM profile WHERE id = 1').get();
  if (!row) {
    db.prepare('INSERT INTO profile (id) VALUES (1)').run();
  }

  return db;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
const profile = {
  get() {
    return getDb().prepare('SELECT * FROM profile WHERE id = 1').get();
  },
  update(fields) {
    const sets = [];
    const vals = {};
    for (const key of ['name', 'weight_unit']) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = @${key}`);
        vals[key] = fields[key];
      }
    }
    if (sets.length === 0) return this.get();
    getDb().prepare(`UPDATE profile SET ${sets.join(', ')} WHERE id = 1`).run(vals);
    return this.get();
  }
};

// ---------------------------------------------------------------------------
// Cycles
// ---------------------------------------------------------------------------
const cycles = {
  list() {
    return getDb().prepare('SELECT * FROM cycles ORDER BY start_date DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM cycles WHERE id = ?').get(id);
  },
  create({ name, type = 'blast', start_date, end_date = null, notes = null }) {
    const info = getDb().prepare(
      'INSERT INTO cycles (name, type, start_date, end_date, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(name, type, start_date, end_date, notes);
    return this.getById(info.lastInsertRowid);
  },
  update(id, fields) {
    const allowed = ['name', 'type', 'start_date', 'end_date', 'notes'];
    const sets = [];
    const vals = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = @${key}`);
        vals[key] = fields[key];
      }
    }
    if (sets.length === 0) return this.getById(id);
    vals.id = id;
    getDb().prepare(`UPDATE cycles SET ${sets.join(', ')} WHERE id = @id`).run(vals);
    return this.getById(id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM cycles WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Cycle Compounds
// ---------------------------------------------------------------------------
const cycleCompounds = {
  listByCycle(cycleId) {
    return getDb().prepare(
      'SELECT * FROM cycle_compounds WHERE cycle_id = ? ORDER BY start_date'
    ).all(cycleId);
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM cycle_compounds WHERE id = ?').get(id);
  },
  create({ cycle_id, compound_id, dose_mg, frequency, route = 'im', start_date, end_date = null, notes = null }) {
    const info = getDb().prepare(
      `INSERT INTO cycle_compounds (cycle_id, compound_id, dose_mg, frequency, route, start_date, end_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(cycle_id, compound_id, dose_mg, frequency, route, start_date, end_date, notes);
    return this.getById(info.lastInsertRowid);
  },
  update(id, fields) {
    const allowed = ['compound_id', 'dose_mg', 'frequency', 'route', 'start_date', 'end_date', 'notes'];
    const sets = [];
    const vals = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = @${key}`);
        vals[key] = fields[key];
      }
    }
    if (sets.length === 0) return this.getById(id);
    vals.id = id;
    getDb().prepare(`UPDATE cycle_compounds SET ${sets.join(', ')} WHERE id = @id`).run(vals);
    return this.getById(id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM cycle_compounds WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Dose Log
// ---------------------------------------------------------------------------
const doseLog = {
  list({ from, to } = {}) {
    if (from && to) {
      return getDb().prepare(
        'SELECT * FROM dose_log WHERE taken_at >= ? AND taken_at <= ? ORDER BY taken_at DESC'
      ).all(from, to);
    }
    return getDb().prepare('SELECT * FROM dose_log ORDER BY taken_at DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM dose_log WHERE id = ?').get(id);
  },
  create({ cycle_compound_id = null, compound_id, dose_mg, taken_at, injection_site = null, notes = null }) {
    const info = getDb().prepare(
      `INSERT INTO dose_log (cycle_compound_id, compound_id, dose_mg, taken_at, injection_site, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(cycle_compound_id, compound_id, dose_mg, taken_at, injection_site, notes);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM dose_log WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Blood Work
// ---------------------------------------------------------------------------
const bloodWork = {
  list() {
    return getDb().prepare('SELECT * FROM blood_work ORDER BY date DESC').all();
  },
  getById(id) {
    const panel = getDb().prepare('SELECT * FROM blood_work WHERE id = ?').get(id);
    if (!panel) return null;
    panel.markers = getDb().prepare(
      'SELECT * FROM blood_markers WHERE blood_work_id = ? ORDER BY marker'
    ).all(id);
    return panel;
  },
  create({ date, lab_name = null, notes = null, markers = [] }) {
    const db = getDb();
    const insertPanel = db.prepare(
      'INSERT INTO blood_work (date, lab_name, notes) VALUES (?, ?, ?)'
    );
    const insertMarker = db.prepare(
      'INSERT INTO blood_markers (blood_work_id, marker, value, unit, flag) VALUES (?, ?, ?, ?, ?)'
    );

    const result = db.transaction(() => {
      const info = insertPanel.run(date, lab_name, notes);
      const panelId = info.lastInsertRowid;
      for (const m of markers) {
        insertMarker.run(panelId, m.marker, m.value, m.unit || null, m.flag || null);
      }
      return panelId;
    })();

    return this.getById(result);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM blood_work WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Blood Markers (trend queries)
// ---------------------------------------------------------------------------
const bloodMarkers = {
  trend(marker) {
    return getDb().prepare(`
      SELECT bm.*, bw.date AS panel_date, bw.lab_name
      FROM blood_markers bm
      JOIN blood_work bw ON bw.id = bm.blood_work_id
      WHERE bm.marker = ?
      ORDER BY bw.date ASC
    `).all(marker);
  }
};

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------
const measurements = {
  list() {
    return getDb().prepare('SELECT * FROM measurements ORDER BY date DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM measurements WHERE id = ?').get(id);
  },
  create(fields) {
    const cols = [
      'date', 'weight', 'body_fat',
      'neck', 'chest', 'shoulders',
      'left_arm', 'right_arm',
      'waist', 'hips',
      'left_quad', 'right_quad',
      'left_calf', 'right_calf',
      'notes'
    ];
    const present = cols.filter(c => fields[c] !== undefined);
    const placeholders = present.map(c => `@${c}`).join(', ');
    const vals = {};
    for (const c of present) vals[c] = fields[c];

    const info = getDb().prepare(
      `INSERT INTO measurements (${present.join(', ')}) VALUES (${placeholders})`
    ).run(vals);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM measurements WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Side Effects
// ---------------------------------------------------------------------------
const sideEffects = {
  list({ from, to } = {}) {
    if (from && to) {
      return getDb().prepare(
        'SELECT * FROM side_effects WHERE date >= ? AND date <= ? ORDER BY date DESC'
      ).all(from, to);
    }
    return getDb().prepare('SELECT * FROM side_effects ORDER BY date DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM side_effects WHERE id = ?').get(id);
  },
  create({ date, symptom, severity = 3, suspected_compound = null, notes = null }) {
    const info = getDb().prepare(
      'INSERT INTO side_effects (date, symptom, severity, suspected_compound, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(date, symptom, severity, suspected_compound, notes);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM side_effects WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Workouts
// ---------------------------------------------------------------------------
const workouts = {
  list({ from, to } = {}) {
    if (from && to) {
      return getDb().prepare(
        'SELECT * FROM workouts WHERE date >= ? AND date <= ? ORDER BY date DESC'
      ).all(from, to);
    }
    return getDb().prepare('SELECT * FROM workouts ORDER BY date DESC').all();
  },
  getById(id) {
    const workout = getDb().prepare('SELECT * FROM workouts WHERE id = ?').get(id);
    if (!workout) return null;
    workout.sets = getDb().prepare(
      'SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY exercise, set_number'
    ).all(id);
    return workout;
  },
  create({ date, name = null, duration_min = null, notes = null, sets = [] }) {
    const db = getDb();
    const insertWorkout = db.prepare(
      'INSERT INTO workouts (date, name, duration_min, notes) VALUES (?, ?, ?, ?)'
    );
    const insertSet = db.prepare(
      `INSERT INTO workout_sets (workout_id, exercise, set_number, weight, reps, rpe, set_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = db.transaction(() => {
      const info = insertWorkout.run(date, name, duration_min, notes);
      const workoutId = info.lastInsertRowid;
      for (const s of sets) {
        insertSet.run(
          workoutId, s.exercise, s.set_number,
          s.weight || null, s.reps || null, s.rpe || null,
          s.set_type || 'working', s.notes || null
        );
      }
      return workoutId;
    })();

    return this.getById(result);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM workouts WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Workout Sets (standalone queries)
// ---------------------------------------------------------------------------
const workoutSets = {
  listByExercise(exercise) {
    return getDb().prepare(`
      SELECT ws.*, w.date AS workout_date, w.name AS workout_name
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      WHERE ws.exercise = ?
      ORDER BY w.date DESC, ws.set_number ASC
    `).all(exercise);
  },
  volumeByDateRange({ from, to }) {
    return getDb().prepare(`
      SELECT w.date, ws.exercise, SUM(ws.weight * ws.reps) AS volume, COUNT(*) AS total_sets, SUM(ws.reps) AS total_reps
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      WHERE w.date >= ? AND w.date <= ?
      GROUP BY w.date, ws.exercise
      ORDER BY w.date ASC
    `).all(from, to);
  }
};

// ---------------------------------------------------------------------------
// Workout Templates
// ---------------------------------------------------------------------------
const workoutTemplates = {
  list() {
    return getDb().prepare('SELECT * FROM workout_templates ORDER BY name ASC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM workout_templates WHERE id = ?').get(id);
  },
  create({ name, exercises }) {
    const exercisesJson = typeof exercises === 'string' ? exercises : JSON.stringify(exercises);
    const info = getDb().prepare(
      'INSERT INTO workout_templates (name, exercises) VALUES (?, ?)'
    ).run(name, exercisesJson);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM workout_templates WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Wellness
// ---------------------------------------------------------------------------
const wellness = {
  list({ from, to } = {}) {
    if (from && to) {
      return getDb().prepare(
        'SELECT * FROM wellness WHERE date >= ? AND date <= ? ORDER BY date DESC'
      ).all(from, to);
    }
    return getDb().prepare('SELECT * FROM wellness ORDER BY date DESC').all();
  },
  getByDate(date) {
    return getDb().prepare('SELECT * FROM wellness WHERE date = ?').get(date);
  },
  upsert(fields) {
    const db = getDb();
    const existing = this.getByDate(fields.date);
    const cols = ['sleep_hours', 'sleep_quality', 'energy', 'mood', 'libido', 'joint_pain', 'appetite', 'stress', 'notes'];

    if (existing) {
      const sets = [];
      const vals = {};
      for (const key of cols) {
        if (fields[key] !== undefined) {
          sets.push(`${key} = @${key}`);
          vals[key] = fields[key];
        }
      }
      if (sets.length === 0) return existing;
      vals.date = fields.date;
      db.prepare(`UPDATE wellness SET ${sets.join(', ')} WHERE date = @date`).run(vals);
      return this.getByDate(fields.date);
    }

    const present = ['date', ...cols.filter(c => fields[c] !== undefined)];
    const placeholders = present.map(c => `@${c}`).join(', ');
    const vals = {};
    for (const c of present) vals[c] = fields[c] !== undefined ? fields[c] : null;
    vals.date = fields.date;

    db.prepare(
      `INSERT INTO wellness (${present.join(', ')}) VALUES (${placeholders})`
    ).run(vals);
    return this.getByDate(fields.date);
  }
};

// ---------------------------------------------------------------------------
// Progress Photos
// ---------------------------------------------------------------------------
const progressPhotos = {
  list() {
    return getDb().prepare(
      'SELECT id, date, pose, weight, body_fat, cycle_id, notes, created_at FROM progress_photos ORDER BY date DESC'
    ).all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM progress_photos WHERE id = ?').get(id);
  },
  create({ date, pose = null, photo_data, weight = null, body_fat = null, cycle_id = null, notes = null }) {
    const info = getDb().prepare(
      `INSERT INTO progress_photos (date, pose, photo_data, weight, body_fat, cycle_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(date, pose, photo_data, weight, body_fat, cycle_id, notes);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM progress_photos WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  getDb,
  initDb,
  profile,
  cycles,
  cycleCompounds,
  doseLog,
  bloodWork,
  bloodMarkers,
  measurements,
  sideEffects,
  workouts,
  workoutSets,
  workoutTemplates,
  wellness,
  progressPhotos
};

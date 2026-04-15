'use strict';

const Database = require('better-sqlite3');
const crypto = require('crypto');
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

    -- Competition tracking
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      federation TEXT,
      division TEXT,
      show_date TEXT NOT NULL,
      location TEXT,
      prep_start_date TEXT,
      prep_weeks INTEGER DEFAULT 16,
      status TEXT DEFAULT 'prep',
      placement INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Peak week daily log
    CREATE TABLE IF NOT EXISTS peak_week_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
      day_out INTEGER NOT NULL,
      water_oz REAL,
      sodium_mg REAL,
      carbs_g REAL,
      protein_g REAL,
      fat_g REAL,
      weight REAL,
      visual_notes TEXT,
      photo_data TEXT,
      notes TEXT
    );

    -- Posing practice log
    CREATE TABLE IF NOT EXISTS posing_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      duration_min INTEGER,
      poses_practiced TEXT,
      coach_session INTEGER DEFAULT 0,
      video_notes TEXT,
      notes TEXT
    );

    -- Powerlifting meet tracking
    CREATE TABLE IF NOT EXISTS pl_meets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      federation TEXT,
      date TEXT NOT NULL,
      weight_class TEXT,
      body_weight REAL,
      squat_1 REAL, squat_2 REAL, squat_3 REAL,
      bench_1 REAL, bench_2 REAL, bench_3 REAL,
      deadlift_1 REAL, deadlift_2 REAL, deadlift_3 REAL,
      squat_best REAL, bench_best REAL, deadlift_best REAL,
      total REAL,
      wilks REAL,
      dots REAL,
      placement INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 1RM tracking
    CREATE TABLE IF NOT EXISTS one_rm_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise TEXT NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER DEFAULT 1,
      estimated_1rm REAL,
      notes TEXT
    );

    -- Strongman event log
    CREATE TABLE IF NOT EXISTS strongman_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      event_name TEXT NOT NULL,
      result TEXT,
      result_unit TEXT,
      competition_id INTEGER,
      notes TEXT
    );

    -- User sport profile
    CREATE TABLE IF NOT EXISTS sport_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      sport TEXT DEFAULT 'bodybuilding',
      division TEXT,
      federation TEXT,
      height_inches REAL,
      competition_weight REAL,
      off_season_weight REAL,
      years_training INTEGER,
      years_enhanced INTEGER,
      coach_name TEXT,
      coach_contact TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Dose reminders
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compound_id TEXT NOT NULL,
      label TEXT NOT NULL,
      frequency_hours REAL NOT NULL,
      time_of_day TEXT,
      enabled INTEGER DEFAULT 1,
      last_reminded TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Supplement stack
    CREATE TABLE IF NOT EXISTS supplements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      dose TEXT,
      frequency TEXT,
      time_of_day TEXT,
      purpose TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS supplement_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplement_id INTEGER REFERENCES supplements(id) ON DELETE CASCADE,
      taken_at TEXT NOT NULL,
      notes TEXT
    );

    -- Achievements (gamification)
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      unlocked_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Streaks (gamification)
    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY DEFAULT 1,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity_date TEXT,
      total_workouts INTEGER DEFAULT 0,
      total_doses INTEGER DEFAULT 0,
      total_checkins INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Users (authentication)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    -- Sessions (authentication)
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Coach/Client sharing
    CREATE TABLE IF NOT EXISTS coach_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      share_token TEXT NOT NULL UNIQUE,
      coach_name TEXT,
      permissions TEXT DEFAULT 'read',
      sections TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coach_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      share_id INTEGER REFERENCES coach_shares(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      from_coach INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default profile row if missing
  const row = db.prepare('SELECT id FROM profile WHERE id = 1').get();
  if (!row) {
    db.prepare('INSERT INTO profile (id) VALUES (1)').run();
  }

  // Seed default sport profile row if missing
  const spRow = db.prepare('SELECT id FROM sport_profile WHERE id = 1').get();
  if (!spRow) {
    db.prepare('INSERT INTO sport_profile (id) VALUES (1)').run();
  }

  // Seed default streaks row if missing
  const streakRow = db.prepare('SELECT id FROM streaks WHERE id = 1').get();
  if (!streakRow) {
    db.prepare('INSERT INTO streaks (id) VALUES (1)').run();
  }

  // Seed achievements if table is empty
  const achievementCount = db.prepare('SELECT COUNT(*) AS cnt FROM achievements').get();
  if (achievementCount.cnt === 0) {
    const seedAchievements = [
      ['first_workout',      'First Blood',             'Complete your first workout',              '\uD83D\uDCAA'],
      ['streak_3',           'Consistency',             '3-day activity streak',                     '\uD83D\uDD25'],
      ['streak_7',           'Iron Week',               '7-day activity streak',                     '\u26A1'],
      ['streak_30',          'Machine',                 '30-day activity streak',                    '\uD83C\uDFC6'],
      ['streak_100',         'Unstoppable',             '100-day activity streak',                   '\uD83D\uDC51'],
      ['workouts_10',        'Getting Started',         'Complete 10 workouts',                      '\uD83C\uDFAF'],
      ['workouts_50',        'Dedicated',               'Complete 50 workouts',                      '\uD83D\uDC8E'],
      ['workouts_100',       'Century',                 'Complete 100 workouts',                     '\uD83C\uDF1F'],
      ['first_dose',         'On Protocol',             'Log your first dose',                       '\uD83D\uDC89'],
      ['doses_100',          'Committed',               'Log 100 doses',                             '\uD83D\uDCCA'],
      ['first_blood_panel',  'Data Driven',             'Submit your first blood panel',             '\uD83E\uDE78'],
      ['blood_panels_10',    'Health Conscious',        'Submit 10 blood panels',                    '\u2764\uFE0F'],
      ['first_pr',           'New Record',              'Set your first PR',                         '\uD83C\uDFC5'],
      ['weight_logged_30',   'Scale Warrior',           'Log weight 30 days',                        '\u2696\uFE0F'],
      ['first_competition',  'Competitor',              'Register for a competition',                '\uD83C\uDFDF\uFE0F'],
      ['checkin_7',          'Self-Aware',              'Complete 7 wellness check-ins',             '\uD83E\uDDE0'],
      ['checkin_30',         'Mindful',                 'Complete 30 wellness check-ins',            '\uD83E\uDDD8'],
      ['photos_5',           'Documenting Progress',    'Take 5 progress photos',                    '\uD83D\uDCF8'],
      ['big3_1000',          '1000lb Club',             'Squat+Bench+Deadlift total >= 1000lbs',     '\uD83E\uDDBE'],
      ['first_meal',         'Fueled',                  'Log your first meal',                       '\uD83C\uDF7D\uFE0F'],
    ];
    const insertAch = db.prepare(
      'INSERT INTO achievements (key, name, description, icon) VALUES (?, ?, ?, ?)'
    );
    const seedTxn = db.transaction(() => {
      for (const a of seedAchievements) {
        insertAch.run(a[0], a[1], a[2], a[3]);
      }
    });
    seedTxn();
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
// Competitions
// ---------------------------------------------------------------------------
const competitions = {
  list() {
    return getDb().prepare('SELECT * FROM competitions ORDER BY show_date DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM competitions WHERE id = ?').get(id);
  },
  create({ name, federation = null, division = null, show_date, location = null, prep_start_date = null, prep_weeks = 16, status = 'prep', notes = null }) {
    const info = getDb().prepare(
      `INSERT INTO competitions (name, federation, division, show_date, location, prep_start_date, prep_weeks, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, federation, division, show_date, location, prep_start_date, prep_weeks, status, notes);
    return this.getById(info.lastInsertRowid);
  },
  update(id, fields) {
    const allowed = ['name', 'federation', 'division', 'show_date', 'location', 'prep_start_date', 'prep_weeks', 'status', 'placement', 'notes'];
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
    getDb().prepare(`UPDATE competitions SET ${sets.join(', ')} WHERE id = @id`).run(vals);
    return this.getById(id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM competitions WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Peak Week Log
// ---------------------------------------------------------------------------
const peakWeekLog = {
  listByCompetition(competitionId) {
    return getDb().prepare(
      'SELECT * FROM peak_week_log WHERE competition_id = ? ORDER BY day_out DESC'
    ).all(competitionId);
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM peak_week_log WHERE id = ?').get(id);
  },
  create({ competition_id, day_out, water_oz = null, sodium_mg = null, carbs_g = null, protein_g = null, fat_g = null, weight = null, visual_notes = null, photo_data = null, notes = null }) {
    const info = getDb().prepare(
      `INSERT INTO peak_week_log (competition_id, day_out, water_oz, sodium_mg, carbs_g, protein_g, fat_g, weight, visual_notes, photo_data, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(competition_id, day_out, water_oz, sodium_mg, carbs_g, protein_g, fat_g, weight, visual_notes, photo_data, notes);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM peak_week_log WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Posing Log
// ---------------------------------------------------------------------------
const posingLog = {
  list() {
    return getDb().prepare('SELECT * FROM posing_log ORDER BY date DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM posing_log WHERE id = ?').get(id);
  },
  create({ date, duration_min = null, poses_practiced = null, coach_session = 0, video_notes = null, notes = null }) {
    const posesJson = poses_practiced && typeof poses_practiced !== 'string'
      ? JSON.stringify(poses_practiced)
      : poses_practiced;
    const info = getDb().prepare(
      `INSERT INTO posing_log (date, duration_min, poses_practiced, coach_session, video_notes, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(date, duration_min, posesJson, coach_session ? 1 : 0, video_notes, notes);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM posing_log WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Powerlifting Meets
// ---------------------------------------------------------------------------
const plMeets = {
  list() {
    return getDb().prepare('SELECT * FROM pl_meets ORDER BY date DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM pl_meets WHERE id = ?').get(id);
  },
  create(fields) {
    const cols = [
      'name', 'federation', 'date', 'weight_class', 'body_weight',
      'squat_1', 'squat_2', 'squat_3',
      'bench_1', 'bench_2', 'bench_3',
      'deadlift_1', 'deadlift_2', 'deadlift_3',
      'squat_best', 'bench_best', 'deadlift_best',
      'total', 'wilks', 'dots', 'placement', 'notes'
    ];
    const present = cols.filter(c => fields[c] !== undefined);
    const placeholders = present.map(c => `@${c}`).join(', ');
    const vals = {};
    for (const c of present) vals[c] = fields[c];

    const info = getDb().prepare(
      `INSERT INTO pl_meets (${present.join(', ')}) VALUES (${placeholders})`
    ).run(vals);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM pl_meets WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// 1RM Log
// ---------------------------------------------------------------------------
const oneRmLog = {
  list() {
    return getDb().prepare('SELECT * FROM one_rm_log ORDER BY date DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM one_rm_log WHERE id = ?').get(id);
  },
  historyByExercise(exercise) {
    return getDb().prepare(
      'SELECT * FROM one_rm_log WHERE exercise = ? ORDER BY date ASC'
    ).all(exercise);
  },
  create({ date, exercise, weight, reps = 1, estimated_1rm = null, notes = null }) {
    // Auto-calculate estimated 1RM with Epley formula if not provided
    if (estimated_1rm == null && reps > 1) {
      estimated_1rm = Math.round(weight * (1 + reps / 30) * 10) / 10;
    } else if (estimated_1rm == null && reps === 1) {
      estimated_1rm = weight;
    }
    const info = getDb().prepare(
      `INSERT INTO one_rm_log (date, exercise, weight, reps, estimated_1rm, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(date, exercise, weight, reps, estimated_1rm, notes);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM one_rm_log WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Strongman Events
// ---------------------------------------------------------------------------
const strongmanEvents = {
  list() {
    return getDb().prepare('SELECT * FROM strongman_events ORDER BY date DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM strongman_events WHERE id = ?').get(id);
  },
  create({ date, event_name, result = null, result_unit = null, competition_id = null, notes = null }) {
    const info = getDb().prepare(
      `INSERT INTO strongman_events (date, event_name, result, result_unit, competition_id, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(date, event_name, result, result_unit, competition_id, notes);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM strongman_events WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Sport Profile
// ---------------------------------------------------------------------------
const sportProfile = {
  get() {
    return getDb().prepare('SELECT * FROM sport_profile WHERE id = 1').get();
  },
  update(fields) {
    const allowed = [
      'sport', 'division', 'federation', 'height_inches',
      'competition_weight', 'off_season_weight', 'years_training',
      'years_enhanced', 'coach_name', 'coach_contact'
    ];
    const sets = [];
    const vals = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = @${key}`);
        vals[key] = fields[key];
      }
    }
    if (sets.length === 0) return this.get();
    sets.push("updated_at = datetime('now')");
    getDb().prepare(`UPDATE sport_profile SET ${sets.join(', ')} WHERE id = 1`).run(vals);
    return this.get();
  }
};

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------
const reminders = {
  list() {
    return getDb().prepare('SELECT * FROM reminders ORDER BY created_at DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM reminders WHERE id = ?').get(id);
  },
  create({ compound_id, label, frequency_hours, time_of_day = null }) {
    const info = getDb().prepare(
      'INSERT INTO reminders (compound_id, label, frequency_hours, time_of_day) VALUES (?, ?, ?, ?)'
    ).run(compound_id, label, frequency_hours, time_of_day);
    return this.getById(info.lastInsertRowid);
  },
  update(id, fields) {
    const allowed = ['compound_id', 'label', 'frequency_hours', 'time_of_day', 'enabled', 'last_reminded'];
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
    getDb().prepare(`UPDATE reminders SET ${sets.join(', ')} WHERE id = @id`).run(vals);
    return this.getById(id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM reminders WHERE id = ?').run(id);
  },
  getDue() {
    return getDb().prepare(`
      SELECT * FROM reminders
      WHERE enabled = 1
        AND (
          last_reminded IS NULL
          OR datetime(last_reminded, '+' || CAST(ROUND(frequency_hours * 60) AS INTEGER) || ' minutes') <= datetime('now')
        )
      ORDER BY created_at ASC
    `).all();
  }
};

// ---------------------------------------------------------------------------
// Supplements
// ---------------------------------------------------------------------------
const supplements = {
  list({ active } = {}) {
    if (active !== undefined) {
      return getDb().prepare('SELECT * FROM supplements WHERE active = ? ORDER BY name ASC').all(active ? 1 : 0);
    }
    return getDb().prepare('SELECT * FROM supplements ORDER BY name ASC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM supplements WHERE id = ?').get(id);
  },
  create({ name, category = null, dose = null, frequency = null, time_of_day = null, purpose = null, active = 1 }) {
    const info = getDb().prepare(
      `INSERT INTO supplements (name, category, dose, frequency, time_of_day, purpose, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(name, category, dose, frequency, time_of_day, purpose, active);
    return this.getById(info.lastInsertRowid);
  },
  update(id, fields) {
    const allowed = ['name', 'category', 'dose', 'frequency', 'time_of_day', 'purpose', 'active'];
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
    getDb().prepare(`UPDATE supplements SET ${sets.join(', ')} WHERE id = @id`).run(vals);
    return this.getById(id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM supplements WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Supplement Log
// ---------------------------------------------------------------------------
const supplementLog = {
  listByDate(date) {
    // Match entries whose taken_at starts with the given YYYY-MM-DD
    return getDb().prepare(
      "SELECT sl.*, s.name AS supplement_name, s.dose, s.category FROM supplement_log sl JOIN supplements s ON s.id = sl.supplement_id WHERE sl.taken_at LIKE ? ORDER BY sl.taken_at DESC"
    ).all(date + '%');
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM supplement_log WHERE id = ?').get(id);
  },
  create({ supplement_id, taken_at, notes = null }) {
    const info = getDb().prepare(
      'INSERT INTO supplement_log (supplement_id, taken_at, notes) VALUES (?, ?, ?)'
    ).run(supplement_id, taken_at, notes);
    return this.getById(info.lastInsertRowid);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM supplement_log WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
const achievements = {
  list() {
    return getDb().prepare('SELECT * FROM achievements ORDER BY id ASC').all();
  },
  getByKey(key) {
    return getDb().prepare('SELECT * FROM achievements WHERE key = ?').get(key);
  },
  unlock(key) {
    const now = new Date().toISOString();
    getDb().prepare('UPDATE achievements SET unlocked_at = ? WHERE key = ? AND unlocked_at IS NULL').run(now, key);
    return this.getByKey(key);
  }
};

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------
const streaks = {
  get() {
    return getDb().prepare('SELECT * FROM streaks WHERE id = 1').get();
  },
  update(fields) {
    const allowed = ['current_streak', 'longest_streak', 'last_activity_date', 'total_workouts', 'total_doses', 'total_checkins'];
    const sets = [];
    const vals = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = @${key}`);
        vals[key] = fields[key];
      }
    }
    if (sets.length === 0) return this.get();
    sets.push("updated_at = datetime('now')");
    getDb().prepare(`UPDATE streaks SET ${sets.join(', ')} WHERE id = 1`).run(vals);
    return this.get();
  }
};

// ---------------------------------------------------------------------------
// Coach Shares
// ---------------------------------------------------------------------------
const coachShares = {
  list() {
    return getDb().prepare('SELECT * FROM coach_shares WHERE active = 1 ORDER BY created_at DESC').all();
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM coach_shares WHERE id = ?').get(id);
  },
  getByToken(token) {
    return getDb().prepare('SELECT * FROM coach_shares WHERE share_token = ? AND active = 1').get(token);
  },
  create({ share_token, coach_name = null, permissions = 'read', sections = null }) {
    const sectionsJson = sections && typeof sections !== 'string' ? JSON.stringify(sections) : sections;
    const info = getDb().prepare(
      'INSERT INTO coach_shares (share_token, coach_name, permissions, sections) VALUES (?, ?, ?, ?)'
    ).run(share_token, coach_name, permissions, sectionsJson);
    return this.getById(info.lastInsertRowid);
  },
  revoke(id) {
    getDb().prepare('UPDATE coach_shares SET active = 0 WHERE id = ?').run(id);
    return this.getById(id);
  },
  delete(id) {
    return getDb().prepare('DELETE FROM coach_shares WHERE id = ?').run(id);
  }
};

// ---------------------------------------------------------------------------
// Coach Notes
// ---------------------------------------------------------------------------
const coachNotes = {
  listByShare(shareId) {
    return getDb().prepare('SELECT * FROM coach_notes WHERE share_id = ? ORDER BY created_at DESC').all(shareId);
  },
  create({ share_id, date, note, from_coach = 1 }) {
    const info = getDb().prepare(
      'INSERT INTO coach_notes (share_id, date, note, from_coach) VALUES (?, ?, ?, ?)'
    ).run(share_id, date, note, from_coach ? 1 : 0);
    return getDb().prepare('SELECT * FROM coach_notes WHERE id = ?').get(info.lastInsertRowid);
  }
};

// ---------------------------------------------------------------------------
// Users (Authentication)
// ---------------------------------------------------------------------------
const users = {
  create({ email, username, password, name = null }) {
    const salt = crypto.randomBytes(32).toString('hex');
    const password_hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const info = getDb().prepare(
      'INSERT INTO users (email, username, password_hash, salt, name) VALUES (?, ?, ?, ?, ?)'
    ).run(email.toLowerCase().trim(), username.toLowerCase().trim(), password_hash, salt, name);
    return this.findById(info.lastInsertRowid);
  },
  findById(id) {
    return getDb().prepare('SELECT id, email, username, name, avatar_url, created_at, last_login FROM users WHERE id = ?').get(id);
  },
  findByEmail(email) {
    return getDb().prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase().trim());
  },
  findByUsername(username) {
    return getDb().prepare('SELECT * FROM users WHERE username = ?').get((username || '').toLowerCase().trim());
  },
  verifyPassword(user, password) {
    const hash = crypto.pbkdf2Sync(password, user.salt, 100000, 64, 'sha512').toString('hex');
    return hash === user.password_hash;
  },
  updateLastLogin(id) {
    getDb().prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(id);
  },
  update(id, fields) {
    const allowed = ['name', 'email'];
    const sets = [];
    const vals = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = @${key}`);
        vals[key] = key === 'email' ? fields[key].toLowerCase().trim() : fields[key];
      }
    }
    if (sets.length === 0) return this.findById(id);
    vals.id = id;
    getDb().prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = @id`).run(vals);
    return this.findById(id);
  }
};

// ---------------------------------------------------------------------------
// Sessions (Authentication)
// ---------------------------------------------------------------------------
const sessions = {
  create(userId) {
    const token = crypto.randomBytes(64).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    getDb().prepare(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(userId, token, expires);
    return { token, expires_at: expires };
  },
  verify(token) {
    if (!token) return null;
    const row = getDb().prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(token);
    return row ? row.user_id : null;
  },
  delete(token) {
    getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
  },
  cleanup() {
    getDb().prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
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
  progressPhotos,
  competitions,
  peakWeekLog,
  posingLog,
  plMeets,
  oneRmLog,
  strongmanEvents,
  sportProfile,
  reminders,
  supplements,
  supplementLog,
  achievements,
  streaks,
  coachShares,
  coachNotes,
  users,
  sessions
};

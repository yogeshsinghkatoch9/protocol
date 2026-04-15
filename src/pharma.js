'use strict';

/**
 * Protocol -- Pharmacokinetic Engine
 *
 * Two-compartment depot-absorption model for injectable compounds:
 *
 *   C(t) = D * F * [k_a / (k_a - k_e)] * [e^(-k_e * dt) - e^(-k_a * dt)]
 *
 * where:
 *   D   = injected dose (mg)
 *   F   = activeFraction (ester weight correction)
 *   k_a = absorption rate constant from depot (1 / absorptionRateDays)
 *   k_e = elimination rate constant (ln2 / halfLifeDays)
 *   dt  = time elapsed since dose (days)
 *
 * For oral compounds (no depot), we use first-order elimination with instant
 * absorption (bioavailability = activeFraction):
 *
 *   C(t) = D * F * e^(-k_e * dt)
 *
 * Concentration units are arbitrary (mg-equivalent) -- proportional to
 * actual plasma levels.  Absolute ng/dL conversion would require
 * volume-of-distribution data per compound which varies by individual.
 */

const LN2 = Math.LN2; // 0.6931471805599453


// ---------------------------------------------------------------------------
//  CORE: single-dose concentration at a time point
// ---------------------------------------------------------------------------

/**
 * Concentration contribution from a SINGLE dose at a given time.
 *
 * @param {object}  compound        - Compound record from the database
 * @param {number}  doseMg          - Dose amount in mg (or IU/mcg -- treated as mg-equivalent)
 * @param {number}  doseDay         - Day the dose was administered
 * @param {number}  timePointDays   - Day at which to evaluate concentration
 * @returns {number} concentration (arbitrary units, proportional to plasma level)
 */
function singleDoseConcentration(compound, doseMg, doseDay, timePointDays) {
  const dt = timePointDays - doseDay;
  if (dt <= 0) return 0;

  const k_e = LN2 / compound.halfLifeDays;
  const F = compound.activeFraction;

  // Oral / no-depot: instant absorption, first-order elimination
  if (compound.absorptionRateDays == null || compound.route === 'oral') {
    return doseMg * F * Math.exp(-k_e * dt);
  }

  // Injectable with depot absorption
  const k_a = 1 / compound.absorptionRateDays;

  // Guard against k_a === k_e (degenerate case -- L'Hopital limit)
  if (Math.abs(k_a - k_e) < 1e-10) {
    // Limit form: D * F * k_a * dt * e^(-k_e * dt)
    return doseMg * F * k_a * dt * Math.exp(-k_e * dt);
  }

  const coeff = doseMg * F * (k_a / (k_a - k_e));
  return coeff * (Math.exp(-k_e * dt) - Math.exp(-k_a * dt));
}


// ---------------------------------------------------------------------------
//  1. calculateConcentration
// ---------------------------------------------------------------------------

/**
 * Calculate total blood concentration at a given time point from multiple doses.
 *
 * @param {object}   compound       - Compound record from the database
 * @param {Array<{day: number, mg: number}>} doses - Dose schedule
 * @param {number}   timePointDays  - Day at which to evaluate
 * @returns {number} total concentration (arbitrary mg-equivalent units)
 */
function calculateConcentration(compound, doses, timePointDays) {
  if (!compound || !doses || !doses.length) return 0;

  let total = 0;
  for (let i = 0; i < doses.length; i++) {
    const d = doses[i];
    if (timePointDays > d.day) {
      total += singleDoseConcentration(compound, d.mg, d.day, timePointDays);
    }
  }
  return total;
}


// ---------------------------------------------------------------------------
//  2. generateCurve
// ---------------------------------------------------------------------------

/**
 * Generate a concentration-vs-time curve for plotting.
 *
 * @param {object}   compound    - Compound record
 * @param {Array<{day: number, mg: number}>} doses
 * @param {number}   startDay    - First day of the curve
 * @param {number}   endDay      - Last day of the curve
 * @param {number}   [resolution=0.25] - Step size in days (default = 6-hour resolution)
 * @returns {Array<{day: number, concentration: number}>}
 */
function generateCurve(compound, doses, startDay, endDay, resolution) {
  if (!compound || !doses || !doses.length) return [];

  const step = resolution != null ? resolution : 0.25;
  const points = [];

  for (let t = startDay; t <= endDay; t += step) {
    points.push({
      day: Math.round(t * 10000) / 10000,  // avoid floating-point drift
      concentration: calculateConcentration(compound, doses, t),
    });
  }
  return points;
}


// ---------------------------------------------------------------------------
//  3. calculateSteadyState
// ---------------------------------------------------------------------------

/**
 * Calculate steady-state peak, trough, and time-to-steady-state for a
 * compound dosed at a fixed interval.
 *
 * Method: simulate repeated dosing until trough-to-trough variance < 0.1%
 * for 3 consecutive cycles, up to 50 half-lives.
 *
 * @param {object}  compound       - Compound record
 * @param {number}  doseMg         - Dose per administration
 * @param {number}  frequencyDays  - Dosing interval in days
 * @returns {{ peak: number, trough: number, timeToSteadyState: number, avgConcentration: number }}
 */
function calculateSteadyState(compound, doseMg, frequencyDays) {
  if (!compound || !doseMg || !frequencyDays) {
    return { peak: 0, trough: 0, timeToSteadyState: 0, avgConcentration: 0 };
  }

  const maxCycles = Math.ceil((50 * compound.halfLifeDays) / frequencyDays);
  const doses = [];
  let prevTrough = -1;
  let stableCount = 0;
  let steadyDay = 0;
  let steadyPeak = 0;
  let steadyTrough = 0;

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    const doseDay = cycle * frequencyDays;
    doses.push({ day: doseDay, mg: doseMg });

    // Evaluate trough = just before next dose
    const troughTime = doseDay + frequencyDays - 0.001;
    const trough = calculateConcentration(compound, doses, troughTime);

    // Evaluate peak: scan within the interval at fine resolution
    let peak = 0;
    const scanStep = frequencyDays / 200;
    for (let t = doseDay + scanStep; t <= doseDay + frequencyDays; t += scanStep) {
      const c = calculateConcentration(compound, doses, t);
      if (c > peak) peak = c;
    }

    // Check convergence
    if (prevTrough > 0 && Math.abs(trough - prevTrough) / prevTrough < 0.001) {
      stableCount++;
      if (stableCount >= 3) {
        steadyDay = doseDay;
        steadyPeak = peak;
        steadyTrough = trough;
        break;
      }
    } else {
      stableCount = 0;
    }

    prevTrough = trough;
    steadyPeak = peak;
    steadyTrough = trough;
    steadyDay = doseDay + frequencyDays;
  }

  // Average concentration via AUC over the last interval
  const lastDoseDay = steadyDay - frequencyDays;
  const auc = _integrateInterval(compound, doses, lastDoseDay, lastDoseDay + frequencyDays, 500);
  const avgConc = auc / frequencyDays;

  return {
    peak: _round(steadyPeak),
    trough: _round(steadyTrough),
    timeToSteadyState: _round(steadyDay),
    avgConcentration: _round(avgConc),
  };
}


// ---------------------------------------------------------------------------
//  4. calculateClearanceDay
// ---------------------------------------------------------------------------

/**
 * Calculate the day when concentration drops below a threshold after the
 * last dose.
 *
 * @param {object}  compound     - Compound record
 * @param {number}  lastDoseDay  - Day of the last injection/dose
 * @param {number}  lastDoseMg   - Amount of the last dose
 * @param {number}  [threshold]  - Concentration threshold; default = 5% of peak
 * @returns {number} day (fractional) when concentration drops below threshold
 */
function calculateClearanceDay(compound, lastDoseDay, lastDoseMg, threshold) {
  if (!compound || lastDoseMg == null) return lastDoseDay;

  const doses = [{ day: lastDoseDay, mg: lastDoseMg }];

  // Find peak concentration to set default threshold
  let peakConc = 0;
  let peakTime = lastDoseDay;
  const scanEnd = lastDoseDay + Math.max(compound.halfLifeDays * 2, 2);
  const scanStep = (scanEnd - lastDoseDay) / 500;

  for (let t = lastDoseDay + scanStep; t <= scanEnd; t += scanStep) {
    const c = calculateConcentration(compound, doses, t);
    if (c > peakConc) {
      peakConc = c;
      peakTime = t;
    }
  }

  const effectiveThreshold = threshold != null ? threshold : peakConc * 0.05;

  if (peakConc <= effectiveThreshold) return lastDoseDay;

  // Binary search for the crossing point after peak
  let lo = peakTime;
  let hi = lastDoseDay + compound.halfLifeDays * 20;

  // Ensure hi is past the threshold
  while (calculateConcentration(compound, doses, hi) > effectiveThreshold) {
    hi += compound.halfLifeDays * 5;
    if (hi > lastDoseDay + 365 * 2) break; // safety cap at 2 years
  }

  // Binary search
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const c = calculateConcentration(compound, doses, mid);
    if (c > effectiveThreshold) {
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.001) break; // 0.001 day = ~1.4 min precision
  }

  return _round(hi);
}


// ---------------------------------------------------------------------------
//  5. calculatePCTStart
// ---------------------------------------------------------------------------

/**
 * Calculate recommended PCT start day based on the longest-acting compound
 * clearing to approximately 10% of its peak single-dose concentration.
 *
 * The logic: PCT should begin when ALL exogenous androgens have dropped
 * sufficiently to allow HPTA recovery.  We find when the last-acting
 * compound reaches ~10% of its single-dose peak.
 *
 * @param {Array<{compound: object, lastDoseDay: number, lastDoseMg?: number}>} entries
 * @returns {{ pctStartDay: number, clearanceDays: Array<{name: string, clearanceDay: number}>, limitingCompound: string }}
 */
function calculatePCTStart(entries) {
  if (!entries || !entries.length) {
    return { pctStartDay: 0, clearanceDays: [], limitingCompound: '' };
  }

  const clearanceDays = [];
  let latestDay = 0;
  let limitingName = '';

  for (const entry of entries) {
    const { compound, lastDoseDay, lastDoseMg } = entry;
    if (!compound) continue;

    const dose = lastDoseMg || compound.defaultDoseMax;
    const doses = [{ day: lastDoseDay, mg: dose }];

    // Find peak
    let peakConc = 0;
    let peakTime = lastDoseDay;
    const scanEnd = lastDoseDay + Math.max(compound.halfLifeDays * 3, 1);
    const step = (scanEnd - lastDoseDay) / 500;

    for (let t = lastDoseDay + step; t <= scanEnd; t += step) {
      const c = calculateConcentration(compound, doses, t);
      if (c > peakConc) {
        peakConc = c;
        peakTime = t;
      }
    }

    // 10% threshold
    const threshold10 = peakConc * 0.10;
    const clearDay = calculateClearanceDay(compound, lastDoseDay, dose, threshold10);

    clearanceDays.push({
      name: compound.name,
      clearanceDay: clearDay,
    });

    if (clearDay > latestDay) {
      latestDay = clearDay;
      limitingName = compound.name;
    }
  }

  // Round up to nearest whole day
  const pctStartDay = Math.ceil(latestDay);

  return {
    pctStartDay,
    clearanceDays,
    limitingCompound: limitingName,
  };
}


// ---------------------------------------------------------------------------
//  INTERNAL HELPERS
// ---------------------------------------------------------------------------

/**
 * Trapezoidal integration of concentration over an interval.
 */
function _integrateInterval(compound, doses, from, to, steps) {
  const h = (to - from) / steps;
  let sum = 0;
  let prevC = calculateConcentration(compound, doses, from);

  for (let i = 1; i <= steps; i++) {
    const t = from + i * h;
    const c = calculateConcentration(compound, doses, t);
    sum += (prevC + c) * h / 2;
    prevC = c;
  }
  return sum;
}

/** Round to 4 decimal places. */
function _round(n) {
  return Math.round(n * 10000) / 10000;
}


// ---------------------------------------------------------------------------
//  EXPORTS
// ---------------------------------------------------------------------------

module.exports = {
  calculateConcentration,
  generateCurve,
  calculateSteadyState,
  calculateClearanceDay,
  calculatePCTStart,

  // Expose for unit testing
  _singleDoseConcentration: singleDoseConcentration,
};

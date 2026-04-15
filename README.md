<p align="center">
  <h1 align="center">PROTOCOL</h1>
  <p align="center"><strong>The first all-in-one tracking platform for enhanced bodybuilders.</strong></p>
  <p align="center">Compounds &middot; Training &middot; Blood Work &middot; Diet &middot; Body &middot; Wellness &middot; Side Effects</p>
  <p align="center">
    <a href="#why-protocol">Why Protocol</a> &middot;
    <a href="#features">Features</a> &middot;
    <a href="#install">Install</a> &middot;
    <a href="#usage">Usage</a> &middot;
    <a href="#compound-database">Compounds</a> &middot;
    <a href="#safety">Safety</a> &middot;
    <a href="#license">License</a>
  </p>
</p>

---

## The Problem

Competitive bodybuilders and enhanced athletes manage the most complex health protocols of any sport — dozens of compounds, weekly blood work, precise nutrition, progressive training, side effect monitoring — and they track it all in **spreadsheets, text messages, and memory**.

There is no app that puts it all in one place. Until now.

## Why Protocol

### vs Google Sheets / Notes App

| | Spreadsheets | Protocol |
|---|---|---|
| **Compound tracking** | Manual entry, no half-life data | 103 compounds with full pharmacokinetic profiles |
| **Blood concentration curves** | None | Real-time PK modeling with multi-compound overlay |
| **Blood work correlation** | Copy-paste numbers | 49 markers with auto-flagging + cycle timeline overlay |
| **Drug interactions** | Ask a forum | Automatic warnings based on your active compounds |
| **Injection site rotation** | Try to remember | Visual body map tracking |
| **Compliance** | Users stop after 2 weeks | Quick-log buttons, daily check-ins take 30 seconds |

### vs RP Diet / Carbon / MyFitnessPal

Those are diet apps. They don't track compounds, blood work, pharmacokinetics, injection sites, side effects, or PCT. Protocol does all of that AND has diet tracking.

### vs SteroidPlotter

SteroidPlotter plots one thing: blood concentration curves for injectable steroids. No orals, no peptides, no blood work, no training, no diet, no side effects, no cycle history, no mobile app. Protocol includes SteroidPlotter's functionality as one feature among dozens.

## Features

### 103 Compound Database

Every compound a bodybuilder might use, with complete profiles:

| Category | Count | Examples |
|---|---|---|
| Injectable AAS | 18 | Test E/C/P, Tren A/E, Deca, NPP, EQ, Masteron, Primo |
| Oral AAS | 9 | Dbol, Anavar, Winstrol, Anadrol, Tbol, Halo, Superdrol |
| Peptides | 20 | BPC-157, TB-500, CJC, Ipamorelin, GHRP-2/6, MK-677, Melanotan |
| Growth Factors | 4 | IGF-1 LR3, IGF-1 DES, MGF, PEG-MGF |
| HGH | 1 | Somatropin (9 brand names) |
| GLP-1 Agonists | 2 | Semaglutide, Tirzepatide |
| AIs | 3 | Arimidex, Aromasin, Letrozole |
| SERMs | 5 | Nolvadex, Clomid, Raloxifene, Enclomiphene, Toremifene |
| Prolactin Control | 3 | Cabergoline, Pramipexole, Bromocriptine |
| Insulin | 3 | Humalog, Humulin R, Lantus |
| Fat Burners | 5 | Clenbuterol, DNP, Yohimbine, Ephedrine, Albuterol |
| SARMs | 6 | Ostarine, LGD-4033, RAD-140, Cardarine, S-23, YK-11 |
| Support | 27 | TUDCA, NAC, Telmisartan, Finasteride, T3, Cialis, HCG, more |

Each compound includes: brand names, street names, half-life, dosing ranges, anabolic/androgenic ratings, side effects, blood markers affected, what it stacks with, what to avoid, storage instructions, and clinical notes.

### Cycle Tracker

- Create blast, cruise, PCT, and bridge cycles
- Add any compound with dose, frequency, and route
- Blood concentration curves modeled with real pharmacokinetics (two-compartment depot absorption model)
- Multi-compound overlay showing all active compounds simultaneously
- Dose log with injection site body map (17 tappable sites across front and back views)
- Pinning volume calculator (mg to mL based on concentration)

### Drug Interaction Checker

Automatically detects dangerous combinations:
- 19-nor compounds without prolactin control
- Oral AAS without liver support
- High-aromatizing compounds without AI
- Direct compound conflicts from the database

Shows warnings on your dashboard so you never miss a safety issue.

### Training Logger

- 121 exercises across all muscle groups
- 8 pre-built workout templates (PPL, Upper/Lower, Full Body, Arms, etc.)
- Per-set logging: weight, reps, RPE, set type (working/warmup/drop/AMRAP)
- Rest timer with 90s/120s/180s presets
- Weekly volume tracking per muscle group
- Workout history and exercise progress charts

### Blood Work Dashboard

- 49 biomarkers across 7 categories (Hormonal, Liver, Lipids, Hematology, Kidney, Metabolic, Other)
- PED-context reference ranges (not standard lab ranges)
- Auto-flagging: green (normal), yellow (watch), red (action needed)
- Trend charts for any marker over time with reference band overlay
- Correlate blood results with your cycle timeline

### Body Tracking

- Daily weight with 7-day moving average chart
- 12 body circumference measurements
- Progress photo capture and gallery
- Body fat percentage tracking
- Lean mass estimation

### Diet & Nutrition

- Daily macro tracking: protein, carbs, fat, calories
- Progress bars showing actual vs target
- Water intake tracker
- Meal logging with quick-add
- Editable macro targets
- Date navigation for reviewing past days

### Daily Wellness Check-in

- 8 metrics: Sleep Hours, Sleep Quality, Energy, Mood, Libido, Joint Pain, Appetite, Stress
- 7-day trend sparklines for each metric
- Compound correlation insights ("Energy drops correlate with Trenbolone")
- Takes 30 seconds — builds a health dataset that's invaluable over time

### Side Effect Journal

- 20 common symptom chips (Acne, Hair Loss, Insomnia, Mood Change, Gyno, etc.)
- Severity scale (1-10)
- Suspected compound tagging
- Filtered timeline view
- Pattern detection over time

### PCT Auto-Calculator

Based on your active compounds and their half-lives, automatically calculates:
- When each compound clears your system
- Recommended PCT start date
- Which compound is the limiting factor

### Data Export

Export all your data as JSON — cycles, compounds, doses, blood work, measurements, workouts, wellness, side effects. Your data belongs to you.

## Install

```bash
git clone https://github.com/yogeshsinghkatoch9/protocol.git
cd protocol
npm install
npm start
```

Open `http://localhost:3888` in your browser.

**Requirements:** Node.js >= 18. One dependency (better-sqlite3 for the database).

## Usage

### Quick Start

1. Open `http://localhost:3888`
2. Create your first cycle (Home → Start a Cycle)
3. Add compounds (Cycle → + Add)
4. Log your first dose (Cycle → + Log Dose → tap injection site)
5. Check the drug interaction warnings on Home
6. Start a workout (Train tab)
7. Log your blood work (Blood → + Add Panel)
8. Do your daily check-in (Wellness tab)
9. Track your macros (Diet tab)

### Keyboard Shortcuts

- `Escape` — close any modal

### PWA (Install on Phone)

Protocol is a Progressive Web App. On your phone:
1. Open `http://your-computer-ip:3888` in Safari/Chrome
2. Tap "Add to Home Screen"
3. Protocol appears as a native app icon

## Compound Database

The compound database (`src/data/compounds.js`) contains 103 compounds with 38 data fields each. Every half-life, dosing range, and side effect profile is sourced from published pharmacokinetic literature and established community knowledge.

### Pharmacokinetic Engine

Blood concentration curves use a two-compartment depot absorption model:

```
C(t) = Σ dose × F × (ka / (ka - ke)) × [e^(-ke×(t-t₀)) - e^(-ka×(t-t₀))]
```

Where F = active fraction (ester weight correction), ka = absorption rate constant, ke = elimination rate constant derived from half-life.

Steady-state calculations use iterative simulation until trough convergence (<0.1% variance).

### Exercise Database

121 exercises across 14 categories with primary/secondary muscle group mapping, equipment classification, and compound/isolation typing.

8 pre-built templates: Push, Pull, Legs, Upper Body, Lower Body, Chest & Back, Arms, Full Body.

## Architecture

```
protocol/
  src/
    server.js           HTTP server (40+ API routes)
    db.js               SQLite database (10 tables, full CRUD)
    pharma.js           Pharmacokinetic engine
    data/
      compounds.js      103 compounds (4,875 lines)
      exercises.js      121 exercises + 8 templates
    web/
      index.html        Complete SPA (2,783 lines)
      manifest.json     PWA manifest
      sw.js             Service worker
  protocol.db           SQLite database (auto-created)
  package.json
  LICENSE               MIT
  README.md
```

### API Endpoints (40+)

| Group | Routes |
|---|---|
| Cycles | CRUD + compound management |
| Doses | Log, list, delete with date filtering |
| Blood Work | Panels with 49 markers, trend queries |
| Measurements | Body composition CRUD |
| Workouts | Sessions with nested sets, templates, exercise history, volume |
| Wellness | Daily check-in upsert, trend queries |
| Side Effects | Log with severity, compound tagging |
| Photos | Progress photo storage and retrieval |
| Compounds | Full database query and search |
| Pharmacokinetics | Concentration curves, clearance, PCT timing |
| Interactions | Drug interaction checking |
| Calculator | Pinning volume (mg to mL) |
| Export | Full data export as JSON/CSV |

## Safety & Legal

### This App Is a Harm Reduction Tool

Protocol does **not**:
- Sell, supply, or facilitate purchase of any substance
- Recommend specific compounds, dosages, or cycles
- Provide medical advice or replace a physician
- Claim to treat, cure, or prevent any condition

Protocol **does**:
- Help users who have made their own choices to track their health more carefully
- Encourage regular blood work and medical supervision
- Flag dangerous biomarker values that need attention
- Detect potentially harmful drug interactions
- Provide educational information about compound pharmacology

### Disclaimer

This application is for informational and tracking purposes only. It is not medical advice. Anabolic steroids and many other compounds tracked in this app are controlled substances in numerous jurisdictions. Users are responsible for compliance with all applicable laws. Always consult a qualified healthcare provider before using any performance-enhancing compound.

## Contributing

Pull requests welcome. The codebase is intentionally simple:
- Vanilla HTML/CSS/JS frontend (no framework, no build step)
- Node.js backend with SQLite
- One npm dependency (better-sqlite3)

Areas that need help:
- Mobile UI polish
- Additional compound data validation
- Localization (units: kg/lbs, metric/imperial)
- Blood work OCR (photo → auto-fill markers)
- Wearable integration (Apple Health / Google Fit)

## License

MIT &copy; 2026 Yogesh Singh Katoch

---

<p align="center">
  <strong>Your body. Your data. Your protocol.</strong>
</p>

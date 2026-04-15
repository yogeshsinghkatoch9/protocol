<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version"/>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License"/>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node"/>
  <img src="https://img.shields.io/badge/dependencies-1-orange" alt="Dependencies"/>
</p>

<h1 align="center">PROTOCOL</h1>
<p align="center"><strong>The all-in-one performance tracking platform for serious athletes.</strong></p>
<p align="center">Compounds &middot; Training &middot; Blood Work &middot; Nutrition &middot; Body Composition &middot; Competition Prep &middot; Powerlifting &middot; Strongman</p>

---

## The Problem

Athletes managing performance protocols track dozens of variables across disconnected tools — compounds in spreadsheets, blood work as PDF screenshots, training in one app, diet in another, side effects in a notes app, and competition prep in text messages with their coach.

There is no single platform that connects all of it. Until now.

**Protocol** puts everything in one place: compounds with pharmacokinetic modeling, 49 blood markers with auto-flagging, 121 exercises with volume tracking, daily wellness scoring, competition prep with peak week planning, powerlifting meet tracking with Wilks/DOTS scoring, strongman event logging, and more — all with a professional desktop + mobile interface.

## What It Does

```
One platform. Every variable. Complete visibility.
```

| Category | What You Track |
|---|---|
| **Compounds** | 103 compounds with half-lives, dosing, interactions, blood concentration curves |
| **Training** | 121 exercises, 8 templates, sets/reps/weight/RPE, volume charts, rest timer |
| **Blood Work** | 49 biomarkers, auto-flagging (optimal/caution/elevated), trend charts, lab OCR |
| **Body** | Weight trend with moving average, 12 measurements, progress photos |
| **Nutrition** | Daily macros (protein/carbs/fat/calories), water intake, meal logging |
| **Wellness** | 8 daily metrics (sleep, energy, mood, libido, joints, appetite, stress), readiness score |
| **Side Effects** | 20 symptom types, severity tracking, compound correlation |
| **Competition** | 16 federations, 17 divisions, peak week planner, posing practice log |
| **Powerlifting** | Meet tracking, 9 attempts, Wilks/DOTS/1RM calculators |
| **Strongman** | 20 events (atlas stones, log press, farmer walk, etc.), PR board |
| **Supplements** | Stack management, daily compliance tracking |
| **Analytics** | Full dashboard: training volume, body trends, health status, achievements |

## Key Features

### Pharmacokinetic Engine
Blood concentration curves modeled using a two-compartment depot absorption model. See exactly when your compounds reach peak levels, when they clear, and when to start PCT.

### Drug Interaction Checker
Automatically detects dangerous combinations: 19-nors without prolactin control, oral AAS without liver support, high-aromatizing compounds without AI. Warnings appear on your dashboard.

### 103 Compound Database
Every compound an athlete might use, with complete profiles: brand names, half-life, dosing ranges, anabolic/androgenic ratings, side effects, blood markers affected, what it stacks with, storage instructions, and clinical notes.

### Blood Work Intelligence
49 biomarkers across 7 categories with PED-context reference ranges (not standard lab ranges). Auto-flags values that need attention. Trend charts show how markers respond to your protocol over time. Paste lab results as text and auto-parse markers.

### AI Workout Suggestions
Analyzes your last 7 days of training, identifies muscle groups that need work, and recommends your next workout from 8 templates. Detects when you need a deload.

### Recovery/Readiness Score
Combines 8 wellness metrics into a 0-100 readiness score. Green (80+) = train hard. Yellow (60-79) = moderate. Red (<60) = rest.

### Competition Prep
16 federations (IFBB Pro, NPC, IPF, USAPL, Strongman Corp, etc.), 17 divisions, peak week day-by-day protocol (water, sodium, carbs, training), posing practice log, mandatory poses reference by division.

### Gamification
20 achievements (First Blood, Iron Week, Machine, Century, 1000lb Club, etc.), activity streaks, milestone tracking. Unlocked automatically from your data.

### Coach Sharing
Generate encrypted share links for your coach. They can view your cycles, blood work, body composition, and training — without needing an account. Permission-controlled and revocable.

### Desktop + Mobile
Professional sidebar navigation on desktop (1024px+). Bottom tab bar on mobile. Glassmorphism UI with obsidian dark theme. PWA-ready — install on your phone's home screen.

## Architecture

<p align="center">
  <img src="docs/architecture.svg" alt="Protocol Architecture" width="100%"/>
</p>

## Screenshots

The app features a professional dark interface with:
- Left sidebar navigation with grouped sections (Main, Health, Performance, Insights, System)
- Glassmorphism cards with obsidian dark surfaces
- Material Design icons throughout
- Bento grid dashboard layout
- Canvas 2D charts for blood concentration curves, weight trends, and volume distribution
- Anatomical body map with 17 tappable injection sites
- Searchable compound library with category filters
- Achievement grid with unlock tracking

## Install

```bash
git clone https://github.com/yogeshsinghkatoch9/protocol.git
cd protocol
npm install
npm start
```

Open `http://localhost:3888` in your browser. Create an account and start tracking.

**Requirements:** Node.js >= 18. One dependency (better-sqlite3).

## Quick Start

1. **Create account** at `http://localhost:3888/auth`
2. **Dashboard** → see your readiness score, active cycle, and AI workout suggestion
3. **Cycles** → create a cycle → add compounds → log doses with injection site map
4. **Training** → start a workout from templates or build your own → log sets/reps/weight
5. **Blood Work** → add a panel → enter 49 markers → see auto-flagged results
6. **Body** → log weight and measurements → track progress photos
7. **Wellness** → daily check-in (30 seconds) → see readiness score
8. **Library** → browse all 103 compounds with full profiles

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + HTTP (vanilla, no Express) |
| Database | SQLite via better-sqlite3 |
| Frontend | Vanilla HTML/CSS/JS (no framework, no build step) |
| Auth | PBKDF2 password hashing + session tokens |
| Charts | Canvas 2D (retina-aware, no chart library) |
| Icons | Google Material Symbols Outlined |
| PWA | Service worker + manifest for mobile install |

**One npm dependency.** Everything else is Node.js built-in modules.

## Architecture

```
protocol/
├── src/
│   ├── server.js              HTTP server (85+ API routes)
│   ├── db.js                  SQLite database (24 tables)
│   ├── pharma.js              Pharmacokinetic engine
│   ├── data/
│   │   ├── compounds.js       103 compounds (4,875 lines)
│   │   ├── exercises.js       121 exercises + 8 templates
│   │   └── competitions.js    16 federations, 17 divisions
│   └── web/
│       ├── index.html         Main app (2,700+ lines)
│       ├── auth.html          Login/signup page
│       ├── manifest.json      PWA manifest
│       └── sw.js              Service worker
├── package.json
├── LICENSE                    MIT
└── README.md
```

### API Routes (85+)

| Group | Endpoints | Description |
|---|---|---|
| Auth | 5 | Signup, login, logout, profile, update |
| Cycles | 6 | CRUD + compound management |
| Doses | 3 | Log, list, delete |
| Blood Work | 5 | Panels, markers, trends, OCR parse |
| Measurements | 3 | Body composition CRUD |
| Workouts | 4 | Sessions with sets, templates |
| Exercises | 3 | Database, search, templates |
| Wellness | 3 | Daily check-in, readiness score |
| Side Effects | 3 | Log, list, delete |
| Supplements | 4 | Stack management, daily log |
| Competitions | 4 | Prep tracking, peak week |
| Powerlifting | 4 | Meets, 1RM, exercise history |
| Strongman | 2 | Event logging |
| Posing | 2 | Session logging |
| Achievements | 3 | Check, list, streaks |
| Analytics | 1 | Full dashboard aggregation |
| Suggestions | 3 | AI workout, deload, compound |
| Interactions | 1 | Drug interaction checker |
| Calculators | 5 | Wilks, DOTS, 1RM, pinning volume, unit converter |
| Reminders | 5 | Dose scheduling |
| Coach | 6 | Share links, permissions, notes |
| Social | 3 | Shareable workout/progress/meet cards |
| Export | 2 | JSON + CSV full data export |
| Static | 6 | Federations, divisions, poses, peak week, weight classes |

### Database (24 Tables)

| Table | Purpose |
|---|---|
| users, sessions | Authentication |
| profile, sport_profile | User settings |
| cycles, cycle_compounds, dose_log | Compound tracking |
| blood_work, blood_markers | Blood work tracking |
| measurements | Body composition |
| workouts, workout_sets, workout_templates | Training |
| wellness | Daily check-in |
| side_effects | Side effect journal |
| supplements, supplement_log | Supplement tracking |
| progress_photos | Progress photos |
| competitions, peak_week_log, posing_log | Competition prep |
| pl_meets, one_rm_log | Powerlifting |
| strongman_events | Strongman |
| achievements, streaks | Gamification |
| reminders | Dose reminders |
| coach_shares, coach_notes | Coach platform |

## Compound Database

103 compounds across 18 categories:

| Category | Count | Examples |
|---|---|---|
| Injectable AAS | 18 | Testosterone (5 esters), Trenbolone, Nandrolone, EQ, Masteron, Primo |
| Oral AAS | 9 | Dianabol, Anavar, Winstrol, Anadrol, Turinabol, Halotestin, Superdrol |
| Peptides | 20 | BPC-157, TB-500, CJC-1295, Ipamorelin, GHRP-2/6, MK-677, Melanotan |
| Growth Factors | 4 | IGF-1 LR3, IGF-1 DES, MGF, PEG-MGF |
| HGH | 1 | Somatropin (9 brand names) |
| GLP-1 | 2 | Semaglutide, Tirzepatide |
| AIs | 3 | Anastrozole, Exemestane, Letrozole |
| SERMs | 5 | Tamoxifen, Clomid, Raloxifene, Enclomiphene, Toremifene |
| Prolactin Control | 3 | Cabergoline, Pramipexole, Bromocriptine |
| Insulin | 3 | Humalog, Humulin R, Lantus |
| Fat Burners | 5 | Clenbuterol, DNP, Yohimbine, Ephedrine, Albuterol |
| SARMs | 6 | Ostarine, LGD-4033, RAD-140, Cardarine, S-23, YK-11 |
| Support | 27 | TUDCA, NAC, Telmisartan, Nebivolol, Finasteride, T3, Cialis, HCG |

Each compound includes: brand names, aliases, half-life, dosing ranges (male/female), anabolic/androgenic ratings, aromatization, liver toxicity, side effects, blood markers affected, what it stacks with, storage, reconstitution, and clinical notes.

## Calculators

| Calculator | What It Does |
|---|---|
| **Pharmacokinetics** | Blood concentration curves from compound + dose + frequency |
| **PCT Start** | When to begin PCT based on compound half-lives |
| **Wilks Score** | Powerlifting total relative to bodyweight |
| **DOTS Score** | Modern alternative to Wilks |
| **Estimated 1RM** | Epley formula from weight x reps |
| **Pinning Volume** | mg dose ÷ concentration = mL to inject |
| **Unit Converter** | mg ↔ mcg ↔ mL ↔ IU with compound-specific factors |
| **Classic Physique** | Max weight allowed for your height |
| **Weight Class** | IPF weight class from bodyweight |

## Safety & Legal

### This Is a Harm Reduction Tool

Protocol does **not** sell, supply, or recommend any substance. It does **not** provide medical advice.

Protocol **does** help users who have made their own choices to:
- Track their health more carefully with regular blood work monitoring
- Detect dangerous biomarker values that need medical attention
- Identify harmful drug interactions in their current protocol
- Maintain a complete health record they can share with their doctor

### Disclaimer

This application is for informational and tracking purposes only. It is not medical advice. Many compounds tracked in this app are controlled substances in various jurisdictions. Users are responsible for compliance with all applicable laws. Always consult a qualified healthcare provider before using any performance-enhancing compound. Regular blood work with a licensed medical provider is strongly recommended.

## Data Privacy

- **Local-first**: All data stored on your machine in a SQLite database file
- **No cloud**: Nothing is sent to any external server
- **No telemetry**: Zero analytics, zero tracking, zero data collection
- **Encrypted auth**: PBKDF2 with 100,000 iterations for password hashing
- **Session tokens**: 64-byte hex, 30-day expiry
- **Your data, your control**: Export everything as JSON/CSV anytime

## Contributing

Pull requests welcome. The codebase is intentionally simple — no framework, no build step, one dependency.

**Areas that need help:**
- Mobile UI refinement
- Additional compound data validation
- Localization (kg/lbs, metric/imperial)
- Blood work photo OCR (real computer vision)
- Wearable integration (Apple Health / Google Fit)
- Native iOS/Android apps

## License

MIT &copy; 2026 Yogesh Singh Katoch

Free to use, modify, and distribute. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Your body. Your data. Your protocol.</strong>
</p>
<p align="center">
  <sub>Built with Node.js + SQLite + vanilla HTML/CSS/JS. One dependency. Zero compromises.</sub>
</p>

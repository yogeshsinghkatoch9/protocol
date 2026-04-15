# PROTOCOL — UI Design Brief

## App Overview
Protocol is a professional health and performance tracking platform for athletes. It covers compound/medication tracking, workout logging, blood work analysis, nutrition, body composition, competition prep, and wellness monitoring. Mobile-first PWA with 13 sections.

## Design System

### Colors
- **Primary**: #0066FF (electric blue)
- **Accent/Danger**: #FF4500 (energy orange)
- **Success**: #10B981 (emerald green)
- **Warning**: #F59E0B (amber)
- **Background**: #0A0A0A (near black)
- **Card/Surface**: #111111
- **Border**: #222222
- **Text Primary**: #F5F5F5
- **Text Secondary**: #A0A0A0
- **Text Muted**: #555555

### Typography
- **Headings**: Outfit, 600-700 weight
- **Body**: Outfit, 400-500 weight
- **Data/Numbers**: JetBrains Mono, 500-600 weight
- **Base size**: 13px body, 11px labels, 9-10px captions

### Spacing
- Card padding: 12-16px
- Section gap: 16-20px
- Inner gap: 8px
- Border radius: 6-8px cards, 6px buttons, 4px pills

### Components
- Cards: #111111 bg, 1px solid #222222 border, 8px radius
- Buttons primary: #0066FF bg, white text, 6px radius, 7px 14px padding
- Buttons secondary: transparent bg, 1px #222222 border, #A0A0A0 text
- Pills/badges: 4px radius, 11px font, monospace, colored bg at 10% opacity
- Inputs: #0A0A0A bg, 1px #222222 border, focus: #0066FF border + blue glow
- Tab bar: fixed bottom, #0A0A0A bg, 56px height, icon + label on active

---

## SCREENS

### Screen 1: Login / Sign Up
**Layout**: Centered card on dark background with subtle dot grid pattern
- PROTOCOL logo in JetBrains Mono, letter-spaced, top center
- Tagline: "Track your performance. Own your data."
- White card (#111111) with tab switcher: "Sign in" | "Create account"
- Sign in: email input, password input (with show/hide toggle), remember me checkbox, blue submit button
- Sign up: name, email, username, password (with strength bar: weak/medium/strong), confirm password, blue submit button
- Footer: "Free · Open Source · Your data stays on your machine"

### Screen 2: Home Dashboard
**Layout**: Single column, scrollable, bottom tab bar
- Top right: username + logout button
- Center: "PROTOCOL" in JetBrains Mono 24px, letter-spacing 3px
- Below: "TRACK · OPTIMIZE · EVOLVE" in 11px muted

**Active Cycle Card** (if cycle exists):
- Card with cycle name, type badge (BLAST/CRUISE/PCT in colored pill), weeks in count
- List of active compounds as small pills inside the card

**No Cycle State**: "No active cycle" text + "Start a Cycle" blue button

**Quick Actions Row** (4 equal buttons in a row):
- Dose (syringe icon)
- Weight (scale icon)
- Workout (dumbbell icon)
- Check-in (sparkle icon)
- Each: icon + label, card style, tap to open respective modal

**KPI Strip** (4 columns in a card):
- Days In | Doses | Weight | BF%
- Values in JetBrains Mono 20px
- Labels in 9px uppercase muted

**Streak + Achievement Row** (2 cards side by side):
- Left: star emoji + streak number + "DAY STREAK"
- Right: lock emoji + latest achievement name or "None yet"

**Readiness Score** (if wellness checked in today):
- Semicircle gauge, score 0-100, color coded (green/amber/orange)
- Training recommendation text below

**Weekly Overview Chart**:
- Bar chart showing daily activity count (Mon-Sun)
- Today's bar highlighted in blue
- Grid lines, axis labels in monospace

**Mini Charts Row** (2 cards side by side):
- Left: Weight Trend — line chart with blue gradient fill, last 14 entries
- Right: Readiness — gauge with score number

**Today's Recommendation Card**:
- Green accent left border
- "SUGGESTED WORKOUT" label in green
- Workout name bold
- Reason text in muted
- "Start This" small blue button

**Reminders Section** (if any active):
- List of upcoming dose reminders
- Each: compound name, time, toggle switch

**Interaction Warnings** (if compounds have conflicts):
- Orange/red bordered cards with warning icon
- "19-nor compound without prolactin control" type messages

**Recent Activity Feed**:
- Timeline of last 5 events
- Each: colored dot (blue=dose, green=workout, red=blood, amber=side effect) + description + time

### Screen 3: Cycle Management
**Header**: "CYCLES" in section header style + count

**Cycle List**: Cards for each cycle showing:
- Name, type badge, date range
- Compound count pill
- Active indicator (blue dot)

**New Cycle Button**: Full-width blue button "+ New Cycle"

**Active Cycle Detail** (when cycle selected):
- Cycle info card: name, type, dates, weeks in
- Compounds section: header "Compounds" + "+ Add" button
  - Each compound: left colored border, name, dose + frequency, route badge
  - Delete button on each
- Blood Concentration Chart: Canvas line chart, multi-compound overlay
  - Each compound a different color
  - X-axis: days, Y-axis: relative concentration
  - Smooth curves
- Pinning Calculator: dose input + concentration input = volume output
- Dose Log: header "Dose Log" + "+ Log Dose" button
  - Each dose: compound name, amount in monospace, injection site, time, delete

**New Cycle Modal**:
- Fields: name, type select (Blast/Cruise/PCT/Bridge), start date, end date, notes
- "Create Cycle" blue button

**Add Compound Modal**:
- Searchable dropdown of 103 compounds grouped by category
- Dose, frequency select, route select
- Start/end date
- "Add Compound" blue button

**Log Dose Modal**:
- Compound select (from cycle compounds)
- Dose (mg), date/time
- Injection Site Body Map: front/back SVG human body outline with 17 tappable regions (delts, pecs, glutes, ventro glutes, quads, lats, biceps, calves, abdomen). Selected site highlights in blue. Site name displayed below.
- Notes textarea
- "Log Dose" blue button

### Screen 4: Training
**Header**: "TRAINING" + session count

**AI Suggested Workout Card** (green accent):
- "SUGGESTED WORKOUT" label
- Template name, reason, "Start This" button

**Start Workout Button**: Large full-width blue button "▶ Start Workout"

**Templates List**: 8 pre-built templates
- Each row: template name, exercise count, tap to start

**Active Workout View** (when workout in progress):
- Timer showing elapsed time
- Current exercise header with add set button
- Set rows: set#, weight input, reps input, RPE select, type badge
- "Add Exercise" button → exercise search (121 exercises)
- "Finish Workout" button
- Rest Timer: fullscreen overlay with large monospace countdown, +/- 15s, preset buttons (90s/120s/180s)

**History**: List of past workouts with date, name, duration, set count

**Weekly Volume Chart**: Bar chart of sets per muscle group

### Screen 5: Blood Work
**Header**: "BLOOD WORK" + "Paste Labs" outline button + "+ Panel" blue button

**Panel List**: Cards showing date, lab name, marker count, alert badges (red/amber)

**Add Panel Modal**:
- Date, lab name
- 7 collapsible sections of markers:
  - Hormonal (13 markers): Total T, Free T, E2, LH, FSH, SHBG, Prolactin, DHT, Progesterone, IGF-1, TSH, Free T3, Free T4
  - Liver (6): AST, ALT, GGT, Bilirubin, ALP, Albumin
  - Lipids (5): Total Cholesterol, HDL, LDL, Triglycerides, VLDL
  - Hematology (7): Hematocrit, Hemoglobin, RBC, WBC, Platelets, MCV, Ferritin
  - Kidney (5): Creatinine, BUN, eGFR, Uric Acid, Cystatin C
  - Metabolic (6): Glucose, HbA1c, Insulin, Sodium, Potassium, Calcium
  - Other (7): CRP, Vitamin D, B12, PSA, Iron, TIBC, ESR
- Each marker: label, number input, unit, placeholder showing normal range
- Notes, "Save Panel" button

**Panel Detail View**:
- List of all markers with value, unit, flag (green=normal, amber=watch, red=action)
- Color-coded rows

**Marker Trend Chart**:
- Dropdown to select any marker
- Line chart with reference range band (shaded green zone)
- Data points as dots

**Paste Labs Modal**:
- Large textarea to paste lab results text
- Parse button → shows extracted markers with checkboxes
- "Save to Panel" button

### Screen 6: Body
**Header**: "BODY" + "+ Measure" blue button

**Weight Chart**: Line chart with 7-day moving average
- Raw data line (lighter), MA line (blue), gradient fill
- Y-axis in lbs, X-axis dates

**Stats Card**: Current weight, weekly change (+/- with arrow), body fat %, estimated lean mass

**Measurements Grid**: 2-column grid of latest measurements
- Neck, Chest, Shoulders, Waist, Hips, L/R Arms, L/R Quads, L/R Calves
- Each: body part label + value in monospace

**Progress Photos**: Grid of captured photos with date overlay

**Share Progress Button**: Generates copyable text summary

**Measurement History**: Table of past entries

### Screen 7: Diet
**Header**: "DIET" + date navigation (< today >)

**Macro Targets Card**: 4 rows (Calories, Protein, Carbs, Fat)
- Each: label, progress bar (actual/target), numbers in monospace
- Color coded: calories=blue, protein=red, carbs=amber, fat=green

**Water Tracker**: Row of 8 circles, tap to fill, count display

**Add Meal Button**: "+ Add Meal" → modal with meal name, protein, carbs, fat, calories

**Today's Meals List**: Each meal with name, macros, time, delete button

**Edit Targets**: Gear icon → modal to set daily macro targets

### Screen 8: Wellness (Daily Check-in)
**Header**: "WELLNESS" + date

**Today's Scores Card**: 8 metric dots in a row, color-coded by value

**Check-in Form**: 8 sliders
- Sleep Hours (0-12)
- Sleep Quality (1-5)
- Energy (1-5)
- Mood (1-5)
- Libido (1-5)
- Joint Pain (1-5, inverted — higher = worse)
- Appetite (1-5)
- Stress (1-5, inverted)
- "Save Check-in" button

**7-Day Sparklines**: Inline mini charts for each metric showing trend

**Readiness History Chart**: Line chart of daily readiness scores (last 7-14 days)

### Screen 9: Journal (Side Effects)
**Header**: "JOURNAL" + "+ Log" blue button

**Side Effect Logger Modal**:
- Date
- 20 symptom chips in a wrap grid: Acne, Hair Loss, Insomnia, Mood Change, Low Libido, High Libido, Bloating, Gyno Symptoms, Joint Pain, Appetite Increase, Appetite Loss, Night Sweats, Aggression, Anxiety, Depression, Back Pumps, Lethargy, Shortness of Breath, Numbness/Tingling, High BP
- Selected chip highlighted in blue
- Severity dots: 1-5, color coded (green→red)
- Suspected compound dropdown
- Notes
- "Log Side Effect" button

**Filter Pills**: All | Doses | Side Effects | Blood Work | Measurements

**Timeline**: Chronological list of all logged events
- Each: colored severity border, symptom name, severity badge, compound tag, date, notes

### Screen 10: Library (Compound Encyclopedia)
**Header**: "LIBRARY" + search input

**Category Filter Pills**: Scrollable row — All, Injectable AAS, Oral AAS, Peptides, HGH, AIs, SERMs, Prolactin, Liver, Cardio, etc.

**Compound List**: Scrollable list of 103 compounds
- Each row: name, category pill, half-life in monospace

**Compound Detail Modal** (tap any compound):
- Name, brand names, aliases
- Category, class
- Half-life, detection time
- Dose ranges (male/female) in monospace
- Anabolic/Androgenic ratings as horizontal bars
- Aromatization, liver toxicity rating
- Common side effects as red pills
- Blood markers affected: list with up/down arrows
- Stacks with: list of compound names as blue pills
- Storage instructions
- Reconstitution (for peptides)
- Notes section

### Screen 11: Compete (Competition Prep)
**Header**: "COMPETE"

**Sport Profile Card**: sport, division, federation, height, comp weight

**Active Competition Card**: show name, date, countdown (weeks/days), status badge

**Create Competition Modal**: name, federation dropdown (16), division dropdown, date, location, prep weeks

**Peak Week Planner** (7 days out):
- 7 day cards: water target, sodium target, carbs target, training notes
- Daily logging: actual water, sodium, carbs, weight, visual assessment, photo

**Posing Practice Log**: sessions with duration, poses practiced, coach toggle

**Mandatory Poses Reference**: Division-specific required poses list

### Screen 12: Powerlifting
**Header**: "POWERLIFTING"

**Big 3 Cards** (3 across): Squat, Bench, Deadlift — each showing current 1RM in large monospace

**Total + Scores Card**: Total, Wilks, DOTS in monospace

**Log 1RM Modal**: exercise select, weight, reps, auto-calculated e1RM

**1RM History Chart**: Multi-line chart (3 colors for SQ/BP/DL)

**Meet Tracker**: 
- "Log Meet" modal with 9 attempt fields
- Meet history cards with results

**Attempt Calculator**: Enter openers → auto-suggest 2nd (+2.5%) and 3rd (+5%)

### Screen 13: Strongman
**Header**: "STRONGMAN"

**Event Buttons**: Grid of 20 strongman events (Atlas Stones, Log Press, Farmer Walk, etc.)

**Log Event Modal**: event name, result, unit (lbs/seconds/reps/feet), notes

**Personal Records Board**: Grid of PRs by event

**Event History**: Recent logs with PR badges

### More Menu (slide-up modal)
Full-page menu with icon + label + description for each section:
- Body, Diet, Wellness, Journal, Library (divider) Compete, Powerlifting, Strongman (divider) Supplements, Achievements, Analytics, Tools (divider) Profile

### Achievements Page
**Header**: "ACHIEVEMENTS" + progress bar (X/20 unlocked)

**Streak Card**: current streak, longest streak, total workouts/doses/check-ins

**Achievement Grid**: 4-column grid of 20 achievements
- Unlocked: full color emoji icon, name, unlock date
- Locked: greyed out with lock icon, name, description of how to unlock

### Analytics Page
**Header**: "ANALYTICS"

**Training Section**: total workouts, avg duration, weekly volume bar chart, top exercises list, muscle group balance bars

**Body Section**: weight change (30d/90d), current stats

**Compounds Section**: active cycle summary, dose compliance %

**Health Section**: days since blood work, flagged markers, readiness average

### Tools Page
**Header**: "TOOLS"

**Unit Converter**: value input, from dropdown (mg/mcg/mL/IU), to dropdown, result in large monospace

**Pinning Calculator**: dose + concentration = volume

**1RM Calculator**: weight + reps = estimated max

### Profile Page
**Header**: "PROFILE"

**Sport Profile Form**: sport, division, federation, height, weights, years training, coach info

**Classic Physique Calculator**: height → max weight

**Weight Class Finder**: bodyweight → IPF class

**Coach Sharing**: generate share link, manage active shares

**Export**: "Download All Data" button

---

## Bottom Tab Bar (5 icons)
1. **Home** — house icon
2. **Cycle** — clock icon
3. **Train** — dumbbell/layers icon
4. **Blood** — droplet icon
5. **More** — three dots icon (opens the full menu)

Active tab: blue icon + label + 2px blue top line
Inactive: grey icon only, no label

---

## Interaction Patterns
- All data entry via bottom sheet modals (slide up from bottom)
- Toast notifications for success/error (bottom center, 3 seconds)
- Pull-to-refresh style on main lists
- Swipe actions on list items (delete)
- Long-press for details on cards
- Charts are interactive — tap for values
- Body map sites highlight on tap with haptic feedback
- Rest timer has haptic buzz on completion

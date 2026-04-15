# Design System Document: Elite Performance Analytics

## 1. Overview & Creative North Star
**Creative North Star: "The Clinical Vanguard"**
This design system is built for the intersection of high-stakes athleticism and medical-grade precision. It rejects the loud, neon-soaked tropes of "fitness apps" in favor of a sophisticated, editorial approach. We treat data not as a decoration, but as an authoritative narrative. 

The visual language is defined by **The Clinical Vanguard**—a philosophy that prioritizes intentional asymmetry, extreme typographic contrast, and tonal depth. We move away from generic "dashboard" layouts by using generous negative space to let singular, high-impact metrics breathe, creating a digital environment that feels like a premium, bespoke performance lab.

## 2. Colors & Tonal Architecture
The palette is rooted in a deep, atmospheric slate to reduce cognitive load, punctuated by a refined indigo that signals intelligence and action.

### Surface Hierarchy & Nesting
We define space through **Tonal Layering** rather than structural lines.
- **Surface (`#111317`)**: The foundation. All primary views begin here.
- **Surface-Container-Low (`#1a1c20`)**: Used for large structural sections or background groupings.
- **Surface-Container-Highest (`#333539`)**: Reserved for the most interactive elements or "active" cards.
- **Layering Principle**: To create depth, stack containers. An "Active Metric" card (`surface-container-highest`) should sit on a "Session Group" container (`surface-container-low`), which sits on the primary `surface`. This creates a natural, physical "lift" without relying on dated border techniques.

### The "No-Line" Rule
**1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts. If a user cannot distinguish between two sections, increase the tonal contrast between the surface tiers rather than adding a line.

### The "Glass & Gradient" Rule
For floating elements (modals, tooltips, or elevated navigation), use a semi-transparent `surface-container-high` with a `20px` backdrop-blur. This "frosted glass" effect ensures the data underneath remains a textured part of the background, maintaining the "Elite Performance" atmosphere. Main CTAs should utilize a subtle linear gradient from `primary` (#c0c1ff) to `primary-container` (#8083ff) to provide a "soul" and metallic sheen that flat colors lack.

## 3. Typography
The system utilizes a dual-typeface strategy to balance human-centric readability with clinical precision.

- **Inter (Primary Sans)**: Used for all UI labels, body copy, and headlines. Its neutral, modern profile ensures the interface feels approachable yet professional.
- **JetBrains Mono (Data Mono)**: Reserved exclusively for "Hard Data"—heart rates, millisecond splits, wattage, and timestamps. The fixed-width nature of the font conveys a sense of mechanical accuracy and technical rigor.

### Hierarchy as Identity
- **Display-LG (Inter, 3.5rem)**: Used for singular, "hero" metrics (e.g., a "98" Sleep Score).
- **Label-SM (Inter, 0.6875rem, All Caps, Tracking 0.05em)**: Used for metadata and category headers to provide an editorial, magazine-like feel.

## 4. Elevation & Depth
In this system, elevation is a product of light and layering, not shadows alone.

- **Ambient Shadows**: When a card must "float," use a shadow with a `24px` blur and `4%` opacity. The shadow color should be a tinted version of `on-surface` (indigo-slate) to mimic natural light refraction within a dark space.
- **The Ghost Border Fallback**: In high-density data views where tonal shifts aren't enough, use a "Ghost Border." This is the `outline-variant` (#464554) token set to **15% opacity**. It should be felt, not seen.
- **Tonal Contrast**: Interactive states (Hover/Active) should be indicated by moving up one tier in the Surface Hierarchy (e.g., moving from `surface-container-low` to `surface-container-high`) rather than changing the border color.

## 5. Components

### Cards & Data Modules
- **Style**: No borders. Use `surface-container-low`. 
- **Rule**: Forbid divider lines within cards. Separate content blocks using `1.5rem` or `2rem` of vertical whitespace. 
- **Typography**: Header in `title-sm` (Inter), value in `display-md` (JetBrains Mono).

### Buttons
- **Primary**: Gradient fill (`primary` to `primary-container`), `on-primary` text. `0.375rem` (md) corner radius.
- **Secondary**: Ghost style with a `Ghost Border` and `primary` text. No fill.
- **Tertiary**: Text-only, `title-sm`, with a `4px` bottom-margin indigo indicator on hover.

### Performance Inputs (Text Fields)
- **State**: Unfocused inputs use `surface-container-lowest`. 
- **Focus**: The background shifts to `surface-container-high` with a subtle `2px` `primary` indicator on the left-most edge of the field.

### Chips & Tags
- Used for "Status" (Recovery, Strain, Readiness). These should be solid `surface-container-highest` with `label-md` typography. Avoid high-saturation "traffic light" colors (red/green) in favor of the `tertiary` (#ffb783) and `primary` scales to maintain the premium palette.

### Context-Specific Component: "The Split-View List"
- For athletic splits or historical data.
- **Execution**: No lines. Alternating rows use `surface` and `surface-container-low`. The "Metric" column (e.g., Pace) is always set in `JetBrains Mono`.

## 6. Do's and Don'ts

### Do
- **Do** use intentional asymmetry. Place the most important metric off-center to create a dynamic, editorial flow.
- **Do** lean on `JetBrains Mono` for any value that changes over time.
- **Do** use "Surface-Container-Lowest" for the background of inputs to create a "recessed" feel.

### Don't
- **Don't** use pure black (#000000). Always use the `surface` (#111317) to maintain tonal depth.
- **Don't** use 1px dividers to separate list items; use white space and subtle background shifts.
- **Don't** use "Glow" or "Neon" effects. We are a performance lab, not a futuristic arcade. Color must be solid and purposeful.
- **Don't** use large corner radii. Stick to the `md` (0.375rem) or `lg` (0.5rem) scales to keep the interface feeling sharp and disciplined.
# Design System: Aesthetic Precision

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Obsidian"**

This design system is not a framework; it is an editorial philosophy. It rejects the "templated" look of the modern web in favor of a high-end, tactile experience that feels carved out of liquid glass and volcanic stone. We move beyond "Standard Dark Mode" by utilizing deep obsidian blacks and a monochromatic surface hierarchy, punctuated by a singular, high-voltage Electric Blue. 

The goal is **Aesthetic Precision**: a state where every pixel serves a purpose, and whitespace is treated as a premium material rather than empty air. We break the grid through intentional asymmetry, allowing content to "float" within expansive margins, creating a sense of calm authority and technological mastery.

---

## 2. Colors
Our palette is rooted in the "Obsidian" spectrum—a series of hyper-dark neutrals that provide the perfect stage for vibrant data and crisp typography.

### The Palette (Material Design Mapping)
- **Background/Surface:** `#131313` (The base canvas)
- **Surface Lowest:** `#0E0E0E` (Used for "inset" areas or deep wells)
- **Surface High/Highest:** `#2A2A2A` to `#353534` (Used for active floating elements)
- **Primary (Accent):** `#ADC6FF` (The Electric Blue core)
- **On-Surface:** `#E5E2E1` (High-contrast, elegant readability)

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined through **tonal transitions**. To separate a sidebar from a main feed, transition from `surface-container-low` to `background`. If a container feels lost, do not reach for a stroke; reach for a slightly higher surface elevation (`surface-container-high`).

### Surface Hierarchy & Nesting
Think of the UI as a physical stack of materials. 
- **The Base:** Everything sits on `surface` (`#131313`).
- **The Vessel:** Main content cards use `surface-container` (`#201F1F`).
- **The Highlight:** Interactive or nested items within that card use `surface-container-highest` (`#353534`).

### The "Glass & Gradient" Rule
To add "soul" to the obsidian depths, use **Glassmorphism** for navigation bars and floating action menus. Apply `surface` colors at 70% opacity with a `20px` backdrop-blur. For Primary CTAs, use a subtle linear gradient from `primary` (#ADC6FF) to `primary_container` (#4B8EFF) at a 145-degree angle to simulate the refraction of light through a sapphire lens.

---

## 3. Typography
We utilize **Inter**—a typeface of mathematical clarity—to anchor our editorial layouts.

- **Display (LG/MD/SM):** Set with `-0.02em` tracking. These are your "Hero" moments. Use `display-lg` (3.5rem) to command attention in white-space-heavy layouts.
- **Headlines & Titles:** Perfectly balanced leading (1.2x). These represent the "System Voice"—authoritative and calm.
- **Body:** Set `body-lg` at `1rem` with a slightly increased leading (1.5x) to ensure the dark background doesn't "choke" the letterforms.
- **Labels:** `label-md` and `label-sm` should be used sparingly for metadata, often in `on-surface-variant` (`#C1C6D7`) to create a clear visual hierarchy.

**Editorial Tip:** Use "intentional asymmetry." Align headlines to a strict left margin while allowing body text to breathe within a narrower, offset column.

---

## 4. Elevation & Depth
In this system, depth is a feeling, not a shadow.

- **The Layering Principle:** Avoid drop shadows for structural elements. Instead, use "Tonal Lift." A card is "raised" by being lighter than the surface below it.
- **Ambient Shadows:** Only use shadows for components that physically float (e.g., Modals, Tooltips). Shadows must be `on-background` at 4% opacity with a `40px` blur—an ambient glow rather than a dark smudge.
- **The "Ghost Border" Fallback:** If high-density data requires a container, use a `0.5px` stroke using `outline-variant` (`#414755`) at 20% opacity. It should be felt, not seen.
- **Glassmorphism:** Use for persistent elements. A floating header should use a semi-transparent `surface-container-low` with a `blur(12px)` to allow background colors to bleed through, integrating the UI layers.

---

## 5. Components

### Buttons
- **Primary:** High-gloss Electric Blue gradient. Corner radius: `full`.
- **Secondary:** Transparent background with a `Ghost Border`.
- **Tertiary:** Pure text with `label-md` styling, using the `primary` color.

### Cards
- **Geometry:** Always use `lg` (2rem/32px) or `xl` (3rem/48px) corner radii.
- **Separation:** Forbid dividers. Use `80px` of vertical whitespace to separate card groups.

### Input Fields
- **Styling:** Inset backgrounds using `surface-container-lowest`. 
- **Focus State:** A `1px` Electric Blue ghost-border (20% opacity) and a subtle inner glow.

### Data Visualization
- **Style:** Use thin, high-precision lines (1.5pt). Avoid fills unless they are 10% opacity gradients of the `primary` blue. Focus on "Micro-Interactions"—small, precise animations when hovering over data points.

---

## 6. Do's and Don'ts

### Do
- **Embrace the Void:** If a screen feels "empty," you are likely doing it right. Increase whitespace before adding decorative elements.
- **Optical Balance:** Manually adjust tracking on Display type to ensure the obsidian background doesn't cause "halastion" (letters appearing to bleed).
- **Subtle Motion:** Use "Spring" animations (stiffness: 120, damping: 20) for all hover states.

### Don't
- **No Pure White:** Never use `#FFFFFF` for text. Use `on-surface` (`#E5E2E1`) to prevent eye strain against the obsidian background.
- **No Sharp Corners:** Unless it's a 1px divider (which we avoid), every interactive element must have a minimum radius of `sm` (0.5rem).
- **No Heavy Shadows:** If the shadow is clearly visible, it’s too dark. It should be a subconscious hint of depth.
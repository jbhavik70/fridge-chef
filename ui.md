# BnB's Kitchen — UX/UI Design Doc

**Designer:** Antigravity UX
**Status:** Approved v2.0
**Last updated:** May 21, 2026

---

## 1. Design System & Visual Vibe

We focus on a warm, boutique cookbook editorial aesthetic that contrasts rustic home hospitality with modern glassmorphism details. The color palette avoids cold tech grays and blues, opting for organic spices, herbs, and soft kitchen tones.

### 1.1 Color Tokens & Accents

| Token Name | Hex/RGB Value | Role & Usage |
| :--- | :--- | :--- |
| `--color-bg` | `#FAF6EE` | Base background. Warm ivory. |
| `--color-surface` | `#FDFBF7` | Content cards and ticket sheets. |
| `--color-surface-glass` | `rgba(253, 251, 247, 0.75)` | Glassmorphic cards. Uses `backdrop-filter: blur(16px)`. |
| `--color-primary` | `#D85A38` | Terracotta Spice. Main brand color for primary actions, titles, and focus states. |
| `--color-primary-hover` | `#C24C2C` | Deep Terracotta. Active hover states. |
| `--color-secondary` | `#7F8A6B` | Sage Green. Active chips, success circles, and step numbers. |
| `--color-secondary-hover` | `#6A745A` | Deep Sage. Accents and hover text. |
| `--color-text-main` | `#2C221E` | Espresso Charcoal. High-contrast typography. |
| `--color-text-muted` | `#6B5C55` | Warm cocoa gray. Captions, metadata, and labels. |
| `--color-warning-bg` | `rgba(216, 90, 56, 0.06)` | Soft reddish tint for warnings and tags. |
| `--color-secret-bg` | `rgba(127, 138, 107, 0.08)` | Soft green tint for secret tip box background. |

### 1.2 Typography
- **Headings (Logo, Titles, Recipe Headers):** **Merriweather** (warm editorial serif).
- **Body & UI Elements (Buttons, Inputs, Badges, Labels):** **Outfit** (clean, geometric sans-serif).

---

## 2. Key Interface Layouts & Components

### 2.1 Hero Header & Company Logo
- **Logo Branding:** The header features the official **BnB's Kitchen Logo** (`/assets/logo.png`) rendered at `80px` height with a smooth, keyframed floating animation (`float 4s ease-in-out infinite`).
- **Typography:** The app title uses bold Merriweather serif (`2.75rem`), paired with an italicized subtitle reflecting Grandma's kitchen philosophy.

### 2.2 Tab Navigation Layout
- A persistent navigation bar (`.tab-navigation`) splits the application into three views:
  1. **Grandma's Kitchen:** The ingredient entry console, filter options, and recipe result card.
  2. **Grandma's Recipe Box:** A vintage recipe cabinet drawer listing locally saved dishes.
  3. **My Reservations:** The dashboard showing booked cooking sessions.
- **Active State:** The active tab is colored in Terracotta (`--color-primary`) and features an animated bottom border line.

### 2.3 Chef's Console (Ingredient Entry & Gourmet Filters)
- **Fridge Door Metaphor:** The ingredients textarea is wrapped in a container that displays a metallic vertical **fridge door handle** (`.fridge-handle`) on the right. When the textarea gains focus, the handle shifts dynamically, mimicking opening a fridge.
- **Option Selectors & Chips:**
  - *Meal Type:* A pill-shaped segmented selector where the active button slides into a warm cream base.
  - *Dietary Preferences:* Multi-select pill chips that toggle to Sage Green (`--color-secondary`) when selected.
  - *Cooking Style:* Segmented buttons for choosing comfort, healthy, quick, gourmet, or traditional styles.
  - *Available Equipment:* Multi-select chips to designate which appliances are on hand.
  - *Time Limit:* Segmented buttons to filter based on cooking speed requirements.

### 2.4 Grandma's Wooden Recipe Box View
- Displays saved recipes in a layout grid using `.saved-recipes-list`.
- **Card Items (`.saved-recipe-item`):** Styled with soft ivory background, clean margins, and an aspect-ratio matched thumbnail image (`.saved-recipe-thumb`).
- **Action Buttons (`.saved-recipe-actions`):**
  - *Cook Again (Terracotta):* Instantly loads and renders the recipe in the main result card.
  - *Book Preparation (Sage Green):* Opens the booking modal pre-populated with this recipe's details.
  - *Delete (Hollow Terracotta):* Deletes the recipe from localStorage after a safety confirmation prompt.
- **Empty State (`.empty-recipe-box`):** Cozy center-aligned text stating: *"Your recipe box is empty, dear. Generate a recipe and save it to keep it here!"*

### 2.5 Interactive Cooking Step Timers
- **Playable Step Timers:** Instruction steps display a stopwatch button (`.step-timer-btn`) indicating duration.
- **Inline Countdown Widget (`.step-timer-widget`):** Slides open on activation to display:
  - Live count readout (e.g. `05:00`).
  - Control buttons: Play/Pause (▶️/⏸️), Reset (🔄), and Cancel (❌) styled with hover animations.
- **Active State:** Steps with running timers display a subtle green/terracotta border pulse to visually track cooking progress.

### 2.6 Warn / Notice States
- **Dedicated Warning Card:** If the user inputs gibberish or non-food items, a friendly card slides in featuring a rotating Grandma avatar (`👵🏼` with `shake` animation) and a warm text redirection ("Try Again, Sweetie").
- **Mixed Notice Box:** When some inputs are non-food but others are usable, the recipe result displays a warning box detailing what Grandma set aside.

---

## 3. Micro-interactions & Animated Loaders

### 3.1 Cooking Loader State
- Triggered immediately when clicking "Cook!". The input console locks (disabled state) to prevent double submissions.
- Displays an **animated custom SVG/CSS loader** depicting a boiling pot with steam rising and bubbles popping (`.cooking-pot-loader`).
- Underneath, a label displays **cycling kitchen microcopy messages** (changing every 2.5s) to entertain the user during the sequential text and image generation:
  - *"Grandma is putting on her apron..."*
  - *"Searching the wooden recipe box..."*
  - *"Preheating the cast iron skillet..."*
  - *"Sifting the flour and checking the spice rack..."*
  - *"Whipping up something special with a pinch of love..."*

### 3.2 Sensory Steam-Clearing Photo Reveal
- When the recipe page renders, a `.steam-overlay` covers the food image with a high-blur backdrop filter and floating steam waves (`.steam-wave`).
- Once the AI image is fully downloaded and loaded by the browser, the `.clear-steam` class is applied, causing the steam overlay to fade away (`opacity: 0` over 1s) to reveal the dish photo in a satisfying, sensory cooking transition.

---

## 4. Booking Dialog & Reservation Tickets

### 4.1 Booking Form Modal
- Styled as a glassmorphic overlay modal (`.modal-overlay` & `.modal-card`) with a blurred background (`backdrop-filter: blur(8px)`).
- Features a clean close button (`&times;`) that rotates on hover.
- **Dynamic Pre-filling:** Pre-fills the "Leftovers to Bring" field with the user's input ingredients, the "Recipe to Prepare" with the recipe title, and the default guest count with the currently scaled servings.
- **Range Slider:** An interactive slider for guest count (1 to 10 guests) with a bold terracotta value readout.
- **Time/Date Pickers:** Native browser controls styled with warm focus rings.

### 4.2 Booking Confirmation & Success Card
- Upon successful booking, the form fades out and a success screen appears featuring:
  - An animated green checkmark draw sequence (`.checkmark-circle` and `.checkmark-draw`).
  - An immediate rendering of the reservation ticket.

### 4.3 Vintage Ticket Sheets
- Reservations are rendered as vintage print-style tickets (`.receipt-ticket`).
- **Tear Effect:** The bottom of the ticket is styled with a jagged, zigzag cutout pattern (`::after` utilizing layered linear-gradients).
- **Header Band:** A decorative top border band featuring repeating stripes of terracotta and sage green.
- **Countdown Badges:** A status badge (`.countdown-badge`) that updates dynamically:
  - **Upcoming (Days):** *"In X days, Y hours"* (Sage Green badge).
  - **Upcoming (Hours):** *"Today in X hours, Y mins"* (Sage Green badge).
  - **Active Session:** *"Happening now! 🍳"* (Terracotta Warning badge).
  - **Past:** *"Passed"* (Muted gray badge).
- **Cancel Button:** A hollow terracotta button that triggers an in-browser confirmation prompt before deleting.

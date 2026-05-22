# BnB's Kitchen Recipe & Booking Service — Product Design Doc

**Author:** Antigravity PM
**Status:** Approved v2.0
**Last updated:** May 21, 2026
**One-liner:** Turn random leftovers into gourmet meals with a pinch of love, and book an in-person preparation session with Grandma at BnB's Kitchen.

---

## 1. The User & The Moment

- **Who:** Someone standing in front of an open fridge, feeling uninspired by a random assortment of leftovers (e.g., half an onion, eggs, wilted spinach).
- **When:** Dinner time on a weeknight, wanting to cook a healthy meal but lacking creativity, or looking to learn how to cook with what they have.
- **Why now:** Existing recipe sites expect you to buy new groceries. This app helps you cook immediately with what you have. Furthermore, for users who want a warm, shared culinary experience, they can book a slot at **BnB's Kitchen** to cook their custom recipe side-by-side with Grandma, bringing their leftovers.
- **The Vibe:** Cozy home cooking, warm grandmotherly guidance, and boutique print cookbook aesthetics.

## 2. Customer Value Proposition

BnB's Kitchen is not just an AI recipe generator; it's a bridge to a cozy, interactive culinary experience:
- **Leftover Optimization:** Transforms food waste into chef-quality meals.
- **Warm Hospitality:** Users are greeted by a supportive, encouraging Grandma chef persona.
- **In-Person Cooking Sessions:** Converts digital recipe inspiration into a real-world experience, letting users book a table or kitchen slot with Grandma to prepare the recipe together.

## 3. Core Features

### 3.1 Custom Recipe & Preference Filters
- **Natural Language Input:** Users describe what is in their fridge in a warm, interactive textarea.
- **Meal Type Segment Selector:** Users can filter recipe generation for specific meals: *Any, Breakfast, Lunch, Dinner, Snack, or Sweet Treat*.
- **Dietary Preference Chips:** Chips to filter out recipes based on common needs: *Vegan, Vegetarian, Gluten-Free, Dairy-Free, Low-Carb, and Nut-Free*.
- **Gourmet Option Filters:** Extra selectors to fine-tune recipes:
  - *Cooking Style:* Segments for Any, Comfort Food, Healthy, Quick, Gourmet, and Traditional.
  - *Available Equipment:* Toggle chips for Stove, Oven, Microwave, Blender, and Air Fryer.
  - *Time Limit:* Segments for Any time, Under 15 mins, Under 30 mins, and Under 60 mins.

### 3.2 Gourmet Recipe Generator & Scaler
- **Warm Grandma Voice:** Encouraging intros, customized step-by-step instructions, and a "Grandma's Secret Tip".
- **Dynamic Portions Scaler:** Interactive control allowing users to scale the recipe portions up or down. The ingredient quantities adjust automatically.
- **Interactive Checklist:** Users can check off ingredients as they prep.
- **Pantry Staples Accordion:** Collapsible drawer showing standard pantry basics (oil, salt, pepper) assumed to be on hand.

### 3.3 BnB's Kitchen Booking System
- **Booking Dialog:** A seamless popup dialog to schedule a session at BnB's Kitchen.
  - Pre-populates the leftovers to bring and the generated recipe title.
  - Passes the scaled portions count as the default guest count.
  - Captures reservation details: Name, Email, Phone (optional), Date, Time, and Notes (allergies/quirks).
- **Reservations Dashboard ("My Reservations"):**
  - Keeps track of all upcoming cooking sessions.
  - Vintage-themed receipt ticket layout.
  - Real-time countdown clock showing time remaining until the session.
  - Easy reservation cancellation with confirmation safety prompts.

### 3.4 Grandma's Wooden Recipe Box (Saved Recipes)
- **Local Storage Integration:** A recipe box cabinet that lets users save generated recipes locally to their browser's `localStorage`.
- **Cozy Recipe Cabinet View:** Displays all saved recipes with metadata (title, preparation/cooking time) and a dish thumbnail.
- **Quick Action Triggers:** Users can click on saved recipes to instantly re-cook (re-render) them, book a reservation directly, or delete them with confirmation.

### 3.5 Interactive Cooking Step Timers
- **Playable Step Timers:** Stopwatch icons placed next to instruction steps.
- **Time Duration Auto-Detection:** Automatically scans instruction text (e.g. "simmer for 20 minutes") using regex to initialize the timer duration, defaulting to 5 minutes if no time is detected.
- **Countdown Widget:** Inline controls (Play/Pause, Reset, Cancel) with a live-updating countdown display.
- **Audio Chime Synthesis:** Generates a cozy vintage kitchen bell chime natively via the Web Audio API when a timer expires.

---

## 4. Scope: What We ARE Building (v2)

- **Tri-View Web App:** Responsive single-page web app with three main tabs: "Grandma's Kitchen" (generator and recipe card), "Grandma's Recipe Box" (saved recipes cabinet), and "My Reservations" (dashboard).
- **AI recipe & Image pipeline:** Uses `gemini-3.5-flash` for structured recipes (validating input for safety/food status, honoring filters) and `imagen-3.0-generate-002` for realistic dish photographs.
- **SQLite Persistence:** A local sqlite3 database `backend/bookings.db` to save and manage reservations.
- **Local Storage Persistence:** Keeps saved recipes persisted across browser sessions under `saved_recipes`.
- **Interactive Client State Machine:** Dynamic scaling, ingredient checklists, countdown timers, and audio synthesis.

## 5. Scope: What We Are NOT Building

- **No User Registration/Auth:** We keep the barrier to entry extremely low. Reservations are managed globally on the backend; the UI lists upcoming reservations without requiring logins.
- **No Payment Gateways:** Cooking sessions with Grandma are free for the community MVP.
- **No Shopping Lists:** The app focus remains strictly on using current leftovers.

## 6. Warm Grandma Persona & Quality Guidelines

The core emotional hook of the product is the Warm Grandma persona:
- **Zero Judgement:** If the user lists minimal ingredients, Grandma expresses excitement (e.g. "We can work miracles with eggs and bread, sweetie!").
- **Safety & Filtering:** 
  - If the user lists only non-food items (e.g., "keys, wallet"), Grandma gently redirects them.
  - If the user lists a mix of food and non-food items, Grandma filters out the non-food items with a warm, humorous note and cooks with the rest.

## 7. Success Metrics

- **Booking Conversion:** ≥15% of users who generate a recipe proceed to book a session at BnB's Kitchen.
- **User Retention:** Repeat bookings or recipe generation visits within a 14-day window.
- **Clean Cancellations:** Low rate of manual cancellations, signifying high booking intent.

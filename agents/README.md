# BnB's Kitchen — Developer Subagents

Welcome to the **BnB's Kitchen** subagent registry. These files define the specialized AI subagents configured to help build, test, and document the Fridge Chef application.

Each subagent has a dedicated scope, set of instructions, and target files to ensure isolation, precision, and quality.

## Available Subagents

1. **[Frontend UI/UX Developer](file:///Users/jbhavik70/Desktop/fridge_chef/agents/Frontend_UI_UX_Developer.md)**
   - **Scope:** Vanilla HTML, CSS, client-side JS (`index.html`, `style.css`, `app.js`).
   - **Focus:** Visual elements, animations, state scaling, timers, and local storage (wooden recipe box).

2. **[Backend API Developer](file:///Users/jbhavik70/Desktop/fridge_chef/agents/Backend_API_Developer.md)**
   - **Scope:** FastAPI application logic, Gemini AI prompt configurations, Unsplash fallback pipeline (`main.py`, `prompts.py`).
   - **Focus:** Pydantic schemas, DB connection pools, structured JSON responses, and safety filters.

3. **[QA Database & Integration Tester](file:///Users/jbhavik70/Desktop/fridge_chef/agents/QA_Database_Tester.md)**
   - **Scope:** Pytest verification suites (`tests/test_api.py`, `tests/test_bookings.py`).
   - **Focus:** API integration tests, mocked AI calls, boundary inputs, database constraints, and timezone-aware countdown checks.

4. **[Technical Writer & Product Coordinator](file:///Users/jbhavik70/Desktop/fridge_chef/agents/Technical_Writer.md)**
   - **Scope:** Documentation, markdown specifications, and development walkthroughs (`product.md`, `ui.md`, `engineering.md`, `BRIEF.md`).
   - **Focus:** Documentation accuracy, API contract consistency, and persona guidelines.

---

## How to Invoke Subagents
In your AI assistant prompt, you can define or launch these agents using:
- `/subagent-driven-development` workflow
- Direct instructions mapping to these profiles

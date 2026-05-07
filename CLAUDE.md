# CLAUDE.md — Expense Tracker App

## Project Overview

A personal expense tracking web application built with a mobile-first approach. The goal is to start as a polished web app and eventually port it into a native mobile app (React Native or similar).

**Key Goals:**
- Log daily expenses with categories, amounts, and notes
- View spending summaries (daily, weekly, monthly)
- Visualize spending patterns with charts
- Professional, clean UI that translates well to mobile

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React (JSX) | Component-based, easy to port to React Native |
| Styling | Tailwind CSS (core utilities only) | Works in Claude artifacts, mobile-friendly |
| State | React `useState` / `useReducer` | No external dependencies needed initially |
| Storage | `window.storage` API (Claude artifact) | Persistent data between sessions in Claude |
| Charts | Recharts | Available in Claude artifacts |
| Icons | lucide-react | Available in Claude artifacts |

> **Note:** The app is initially built as a Claude Artifact using the persistent storage API. When porting to a real app, replace `window.storage` with `AsyncStorage` (React Native) or `localStorage` / a backend API.

---

## Data Model

### Expense Entry
```json
{
  "id": "uuid",
  "amount": 12.50,
  "currency": "EUR",
  "category": "food",
  "description": "Lunch at kafeneio",
  "date": "2026-05-07",
  "createdAt": "2026-05-07T13:45:00Z"
}
```

### Categories
```
food, transport, housing, health, entertainment, shopping, utilities, education, other
```

---

## Features — Phased Roadmap

### Phase 1 — Core MVP (Web Artifact)
- [ ] Add expense form (amount, category, description, date)
- [ ] List of recent expenses
- [ ] Delete an expense
- [ ] Total spending display (today / this month)
- [ ] Persistent storage via `window.storage`

### Phase 2 — Analytics
- [ ] Bar chart: spending by category (Recharts)
- [ ] Line chart: spending over time
- [ ] Monthly summary view
- [ ] Filter by date range or category

### Phase 3 — UX Polish
- [ ] Edit existing expenses
- [ ] Recurring expenses
- [ ] Multi-currency support
- [ ] Dark / light mode toggle
- [ ] Export to CSV

### Phase 4 — Mobile App
- [ ] Port to React Native
- [ ] Replace `window.storage` with `AsyncStorage`
- [ ] Add push notifications for budget limits
- [ ] App Store / Play Store release

---

## Project Structure (Web Phase)

```
expense-tracker/
├── CLAUDE.md               ← this file
├── components/
│   ├── AddExpenseForm.jsx   ← input form
│   ├── ExpenseList.jsx      ← list of expenses
│   ├── ExpenseSummary.jsx   ← totals and stats
│   └── Charts.jsx          ← Recharts visualizations
├── hooks/
│   └── useExpenses.js      ← state + storage logic
├── utils/
│   ├── categories.js       ← category definitions & icons
│   ├── formatters.js       ← currency, date formatting
│   └── storage.js          ← wrapper around window.storage
└── App.jsx                 ← root component
```

---

## Storage Keys (Claude Artifact)

| Key | Type | Description |
|---|---|---|
| `expenses:all` | JSON array | All expense entries |
| `settings:currency` | string | Default currency (e.g. "EUR") |
| `settings:monthly_budget` | number | Optional monthly budget limit |

---

## Design Guidelines

- **Mobile-first:** All layouts should work on 390px width screens
- **Font:** Use a clean, modern sans-serif (e.g. DM Sans, Nunito, or Geist)
- **Colors:** Professional palette — dark navy + white + a single accent (e.g. emerald or amber)
- **Spacing:** Generous padding, card-based layout
- **Interactions:** Smooth transitions on add/delete, subtle hover states
- **No clutter:** Show only what's needed. Progressive disclosure for details.

---

## Claude Prompting Guide

Use these prompts when building with Claude:

### Start the app
```
Build Phase 1 of my expense tracker app as described in CLAUDE.md.
Use React with Tailwind, lucide-react icons, and window.storage for persistence.
Make it mobile-first and professional.
```

### Add a feature
```
Add a bar chart showing spending by category to the expense tracker.
Use Recharts. Follow the design guidelines in CLAUDE.md.
```

### Fix a bug
```
In my expense tracker app, [describe bug]. Here's the relevant code: [paste code].
Fix it without breaking the existing functionality.
```

### Port to mobile
```
I want to convert my expense tracker React app to React Native.
Replace window.storage with AsyncStorage, and adapt the layout for mobile screens.
```

---

## Currency

Default currency: **EUR (€)**
User's location: Greece 🇬🇷

Support for other currencies can be added in Phase 3.

---

## Notes for Claude

- Always use `window.storage` for persistence in artifact builds
- Keep all code in a **single JSX file** when building Claude artifacts
- Use `import { useState, useEffect, useReducer } from "react"` at the top
- Recharts and lucide-react are available without npm install
- Never use `localStorage` in Claude artifacts — use `window.storage` instead
- Tailwind: use only core utility classes, no custom config

---

app/core/ — config (pydantic-settings), database (SQLAlchemy + SQLite), security (bcrypt + JWT)
app/models/ — User και Expense ORM models
app/schemas/ — Pydantic schemas για validation
app/services/ — business logic (CRUD + summary με totals by category)
app/routers/ — POST /auth/register, POST /auth/login, πλήρες CRUD /expenses/, GET /expenses/summary, GET /users/me
*Last updated: May 2026*
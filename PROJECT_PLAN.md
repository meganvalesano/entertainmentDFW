# 💰 BudgetMind — AI-Powered Budgeting App
## Comprehensive Project Plan

> **Branch:** `budgeting-app`  
> **Template:** 721-g4-26 (Market Minds)  
> **Date:** March 17, 2026

---

## 🎯 App Overview

**BudgetMind** transforms the Market Minds ad-copy template into a personal finance AI assistant that:
1. Connects to bank accounts via **Plaid Sandbox** to pull transactions
2. Uses an **LLM (OpenAI)** to analyze spending, categorize transactions, and generate a **50/30/20 budget**
3. Provides **AI coaching** on budgeting techniques backed by real Google search results via **SerpAPI**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER (Client)                  │
│                                                      │
│  ┌──────────┐    ┌───────────────┐   ┌────────────┐ │
│  │  Nav Bar  │    │ Budget View   │   │ Coaching   │ │
│  │  (Left)   │    │ (50/30/20)    │   │ Chat View  │ │
│  │           │    │ + Progress    │   │            │ │
│  │ • Budget  │    │   Bars        │   │            │ │
│  │ • Coach   │    │ + Uncat.      │   │            │ │
│  │           │    │   Modal       │   │            │ │
│  └──────────┘    └───────────────┘   └────────────┘ │
│         │               │                   │        │
│         └───── index.js (client logic) ─────┘        │
└──────────────────────┬───────────────────────────────┘
                       │  fetch() calls
                       ▼
┌──────────────────────────────────────────────────────┐
│              NETLIFY FUNCTIONS (Backend)              │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │ fetchPlaid/      │  │ generateBudget/          │   │
│  │  • Link token    │  │  • Receives transactions │   │
│  │  • Exchange      │  │  • SCOPE system prompt   │   │
│  │    public token  │  │  • Categorizes spending  │   │
│  │  • Get accounts  │  │  • Builds 50/30/20       │   │
│  │  • Get txns      │  │  • Returns JSON budget   │   │
│  └────────┬────────┘  └──────────┬───────────────┘   │
│           │                      │                    │
│  ┌────────▼────────┐  ┌─────────▼────────────────┐   │
│  │   Plaid API     │  │  OpenAI API (GPT-4o)     │   │
│  │   (Sandbox)     │  │  via LangChain           │   │
│  └─────────────────┘  └──────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ fetchCoaching/                                │    │
│  │  • Receives user's budget + question          │    │
│  │  • Step 1: SerpAPI Google search              │    │
│  │  • Step 2: LLM synthesizes search results     │    │
│  │    with user's actual budget data             │    │
│  │  • Returns personalized coaching response     │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## 📁 File Structure (What Changes vs. Template)

```
ITOM 6219/
├── index.html                  ← REWRITE: New two-panel layout (nav + content)
├── index.css                   ← REWRITE: Apple/Uber minimalist design system
├── index.js                    ← REWRITE: Plaid Link, budget rendering, coaching chat
├── package.json                ← UPDATE: Add plaid-link dependency
├── webpack.config.js           ← MINOR: No major changes needed
├── netlify.toml                ← UPDATE: Add Plaid env vars to functions
├── keys.env                    ← UPDATE: Add PLAID_CLIENT_ID, PLAID_SECRET
│
├── netlify/functions/
│   ├── fetchAI/                ← KEEP (reference only, will be replaced)
│   ├── fetchCompetitors/       ← KEEP (reference for SerpAPI pattern)
│   ├── fetchPlaid/             ← NEW: Plaid Link token + transaction fetching
│   │   └── fetchPlaid.js
│   ├── generateBudget/         ← NEW: LLM budget generation with SCOPE prompt
│   │   └── generateBudget.js
│   └── fetchCoaching/          ← NEW: SerpAPI search → LLM coaching
│       └── fetchCoaching.js
│
├── Archive/                    ← Your original _OG files
├── sandbox-custom-users/       ← Reference for custom Plaid test data
├── quickstart/                 ← Reference for Plaid API integration patterns
└── pics/                       ← Screenshots
```

---

## 📋 Implementation Plan — Phase by Phase

---

### PHASE 1: Plaid Sandbox Integration
**Goal:** User clicks "Connect Bank" → Plaid Link opens → App receives transaction data

#### 1A. Create `netlify/functions/fetchPlaid/fetchPlaid.js`
This serverless function handles ALL Plaid interactions. It will have multiple endpoints routed by an `action` field in the request body:

| Action | What it does |
|---|---|
| `create_link_token` | Creates a Plaid Link token (needed to open the Plaid UI widget) |
| `exchange_public_token` | Exchanges the public token from Link for an access token |
| `get_transactions` | Fetches all transactions using `transactionsSync` |
| `get_accounts` | Fetches account balances |

**Key integration details from quickstart:**
- Use `plaid` npm package (v41+)
- Environment: `sandbox`
- Products: `['transactions']`
- Test credentials: `user_good` / `pass_good` (or `user_transactions_dynamic` for richer data)
- The Plaid Link widget runs client-side via `<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js">`

**Key insight from sandbox-custom-users:**
- Custom users can be loaded into Plaid Dashboard → Sandbox → Test Users
- The `transactions_checking+savings_custom_user.json` template gives us a realistic multi-account user
- Transaction format: `{ date_transacted, date_posted, amount, description, currency }`
- We can customize transactions with realistic descriptions for budgeting (groceries, rent, subscriptions, etc.)

#### 1B. Update `index.js` (client-side) — Plaid Link flow
```
User clicks "Connect Bank" 
  → fetch('/fetchPlaid', {action: 'create_link_token'})
  → Initialize Plaid Link with the token
  → User selects bank, logs in with test credentials
  → On success, receive public_token
  → fetch('/fetchPlaid', {action: 'exchange_public_token', public_token})
  → fetch('/fetchPlaid', {action: 'get_transactions'})
  → Store transactions in app state
  → Trigger budget generation
```

#### 1C. Environment Variables Needed
```
PLAID_CLIENT_ID=<from Plaid Dashboard>
PLAID_SECRET=<sandbox secret from Plaid Dashboard>
PLAID_ENV=sandbox
```

---

### PHASE 2: LLM Budget Generation (50/30/20 Rule)
**Goal:** Transactions → LLM → Categorized budget with 50/30/20 structure

#### 2A. Create `netlify/functions/generateBudget/generateBudget.js`

**The SCOPE Framework System Prompt:**

```
SYSTEM PROMPT — BudgetMind AI Budget Analyst

═══════════════════════════════════════════════════════
S — SITUATION
═══════════════════════════════════════════════════════
You are BudgetMind, an elite personal finance AI analyst embedded in a budgeting 
application. You have been given raw bank transaction data from a user's connected 
checking and savings accounts. Your role is to transform this raw data into an 
actionable, structured monthly budget following the 50/30/20 rule.

The 50/30/20 Rule:
• 50% NEEDS — Essential expenses the user cannot avoid: rent/mortgage, utilities, 
  groceries, insurance, minimum debt payments, transportation to work, healthcare.
• 30% WANTS — Non-essential spending that improves quality of life: dining out, 
  entertainment, subscriptions (streaming, gym), shopping, hobbies, vacations.
• 20% SAVINGS & DEBT — Savings contributions, emergency fund, extra debt payments 
  beyond minimums, investments, retirement contributions.

═══════════════════════════════════════════════════════
C — CONTEXT
═══════════════════════════════════════════════════════
You are analyzing transaction data from the Plaid API. Each transaction contains:
- date: When the transaction occurred
- name/description: Merchant or transaction description
- amount: Dollar amount (positive = money spent, negative = money received/refunded)
- category: Plaid's auto-category (may be present or absent)

The user's monthly income should be inferred from incoming deposits (negative amounts 
or payroll-labeled transactions). If no clear income is detected, estimate based on 
the total spending and inform the user of this assumption.

You MUST handle ambiguous transactions gracefully. Many transactions will have 
cryptic descriptions (e.g., "POS DEBIT 4829 VENDOR LLC"). Use your best judgment 
to categorize, but flag any you are truly uncertain about.

═══════════════════════════════════════════════════════
O — OBJECTIVE
═══════════════════════════════════════════════════════
Your objectives, IN THIS EXACT ORDER:

1. CALCULATE monthly income from the transaction data
2. CATEGORIZE every transaction into specific budget line items 
   (e.g., "Rent", "Groceries", "Netflix", "Gas", "Dining Out")
3. ASSIGN each line item to one of the three 50/30/20 buckets
4. AGGREGATE spending per line item and per bucket
5. COMPARE actual spending to the 50/30/20 ideal allocation
6. IDENTIFY any transactions you could not confidently categorize
7. RETURN a structured JSON response (schema below)

CRITICAL: You MUST complete steps 1-5 and return the full budget BEFORE 
flagging uncategorized items. The user needs to see their budget first 
for context before addressing edge cases.

═══════════════════════════════════════════════════════
P — PARAMETERS
═══════════════════════════════════════════════════════
Response Format: You MUST respond with valid JSON matching this exact schema:

{
  "monthly_income": 5000.00,
  "budget": {
    "needs": {
      "target_percent": 50,
      "target_amount": 2500.00,
      "actual_amount": 2350.00,
      "actual_percent": 47,
      "line_items": [
        {
          "name": "Rent",
          "amount": 1200.00,
          "transactions": ["03/01 - Apartment Complex LLC - $1200.00"]
        },
        {
          "name": "Groceries",
          "amount": 450.00,
          "transactions": ["03/05 - H-E-B - $89.50", "03/12 - Walmart - $67.20", ...]
        }
      ]
    },
    "wants": {
      "target_percent": 30,
      "target_amount": 1500.00,
      "actual_amount": 1620.00,
      "actual_percent": 32.4,
      "line_items": [...]
    },
    "savings": {
      "target_percent": 20,
      "target_amount": 1000.00,
      "actual_amount": 800.00,
      "actual_percent": 16,
      "line_items": [...]
    }
  },
  "uncategorized": [
    {
      "date": "03/08",
      "description": "POS DEBIT 4829 XYZVENDOR",
      "amount": 45.99,
      "suggested_categories": ["Dining Out (Wants)", "Groceries (Needs)"]
    }
  ],
  "summary": "Your total monthly income is $5,000. You're spending 47% on 
    Needs (under the 50% target ✅), 32.4% on Wants (slightly over the 30% 
    target ⚠️), and saving 16% (under the 20% target ⚠️). Consider reducing 
    dining out by ~$120/month and redirecting to savings."
}

Rules:
- Round all dollar amounts to 2 decimal places
- Round all percentages to 1 decimal place
- Sort line items within each bucket by amount (highest first)
- Include the actual transaction descriptions in each line item for transparency
- The summary must be actionable and specific, not generic
- If a transaction could go either way, make your best guess and note it
- Never fabricate transactions — only use what is provided
- Respond ONLY with the JSON object, no markdown, no explanation outside JSON

═══════════════════════════════════════════════════════
E — EXAMPLES
═══════════════════════════════════════════════════════
Example categorization decisions:

"SPOTIFY USA" → Wants > Subscriptions
"WHOLEFDS MKT" → Needs > Groceries  
"UBER TRIP" → Could be Needs (commute) or Wants (leisure) — if unclear, default 
  to Wants and add note
"CHASE CREDIT CRD AUTOPAY" → Needs > Minimum Debt Payment (unless amount suggests 
  extra payment, then split)
"VENMO PAYMENT" → Uncategorized (peer-to-peer with no context)
"DIRECT DEPOSIT - EMPLOYER" → Income (negative amount)
"TARGET" → Needs > Household Supplies (unless amount is high, then may be Wants > Shopping)
"TRANSFER TO SAVINGS" → Savings > Savings Transfer
```

#### 2B. Budget Generation Flow
```
Client sends: { transactions: [...], accounts: [...] }
  → generateBudget function receives data
  → Constructs prompt with SCOPE system message + transaction data
  → Calls OpenAI GPT-4o (chat completions, NOT legacy completions)
  → Parses JSON response
  → Returns structured budget to client
```

**Technical note:** The template uses `gpt-3.5-turbo-instruct` with the legacy `completions` API. We will upgrade to `gpt-4o` with the `chat/completions` API for much better categorization and JSON output.

---

### PHASE 3: AI Coaching with SerpAPI
**Goal:** User asks a budgeting question → App searches Google → LLM synthesizes personalized advice

#### 3A. Create `netlify/functions/fetchCoaching/fetchCoaching.js`

**Following the exact pattern from `fetchCompetitors.js`:**

```
Step 1: User sends message + their current budget data
Step 2: LLM refines the user's question into a Google search query
         about budgeting techniques
Step 3: SerpAPI searches Google (engine: "google") for authoritative 
         budgeting articles/advice
Step 4: LLM receives:
         - The search results (real information, NOT hallucinated)
         - The user's actual budget data (50/30/20 breakdown)
         - The user's specific question
Step 5: LLM synthesizes a personalized coaching response that:
         - References specific articles/sources found
         - Ties advice directly to the user's actual spending
         - Gives concrete, actionable steps
         - Uses encouraging but honest tone
```

**Coaching System Prompt (SCOPE):**

```
S — You are BudgetMind Coach, a personal finance coaching AI. You have access 
    to the user's actual budget data and real-time search results from the internet.

C — The user has already generated their 50/30/20 budget and is now seeking 
    coaching on how to improve. You have their full budget breakdown, income, 
    and spending patterns. You also have fresh search results from Google about 
    the specific topic they're asking about.

O — Provide personalized, actionable coaching that:
    1. Directly references the user's actual numbers
    2. Cites real sources/articles from the search results
    3. Gives 3-5 specific action items
    4. Is encouraging but honest about areas needing improvement

P — Respond conversationally (not JSON). Use markdown formatting. 
    Keep responses under 400 words. Always cite at least one source 
    from the search results. Never make up statistics or studies.

E — If user asks "How can I save more?", and their budget shows $400/mo 
    on dining out, reference that specific line item and suggest concrete 
    alternatives with dollar savings estimates, backed by tips from the 
    search results.
```

#### 3B. Chat Interface Flow
```
User types question in coaching chat
  → Client sends: { message, budgetData }
  → fetchCoaching function:
     1. Calls OpenAI to refine search query
     2. Calls SerpAPI (Google search, NOT Google Shopping)
     3. Calls OpenAI with: system prompt + budget data + search results + user message
     4. Returns coaching response
  → Client renders response in chat bubble
  → Conversation history maintained client-side for context
```

---

### PHASE 4: UI Design — Apple/Uber Minimalism
**Goal:** Clean, professional, two-panel layout

#### 4A. Layout Structure (`index.html`)

```
┌──────────────────────────────────────────────────────────┐
│                    BudgetMind                     [logo]  │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  ┌──────┐  │         BUDGET GENERATOR VIEW               │
│  │  📊  │  │                                             │
│  │Budget│  │  ┌─ Connect Bank ──────────────────────┐    │
│  │ Gen  │  │  │  [Connect Your Bank Account]  btn   │    │
│  └──────┘  │  └─────────────────────────────────────┘    │
│            │                                             │
│  ┌──────┐  │  After connection:                          │
│  │  💬  │  │                                             │
│  │Coach │  │  Monthly Income: $5,000                     │
│  │ ing  │  │                                             │
│  └──────┘  │  ┌─ NEEDS (50%) ────── $2,350/$2,500 ──┐   │
│            │  │  Rent        $1,200  ████████████░░░  │   │
│            │  │  Groceries     $450  ██████░░░░░░░░░  │   │
│            │  │  Utilities     $180  ███░░░░░░░░░░░░  │   │
│            │  │  Insurance     $200  ████░░░░░░░░░░░  │   │
│            │  │  Transport     $320  █████░░░░░░░░░░  │   │
│            │  └──────────────────────────────────────┘   │
│            │                                             │
│            │  ┌─ WANTS (30%) ────── $1,620/$1,500 ──┐   │
│            │  │  Dining Out    $400  ██████████████▓  │   │
│            │  │  Subscriptions $120  ██████░░░░░░░░░  │   │
│            │  │  Shopping      $350  ██████████░░░░░  │   │
│            │  │  Entertainment $250  ████████░░░░░░░  │   │
│            │  └──────────────────────────────────────┘   │
│            │                                             │
│            │  ┌─ SAVINGS (20%) ──── $800/$1,000 ────┐   │
│            │  │  Savings Acct   $500 ████████░░░░░░░  │   │
│            │  │  Extra Debt     $300 █████░░░░░░░░░░  │   │
│            │  └──────────────────────────────────────┘   │
│            │                                             │
│            │  ┌─ ⚠️ UNCATEGORIZED ──────────────────┐   │
│            │  │  03/08 POS DEBIT XYZVENDOR  $45.99   │   │
│            │  │  [Dropdown: Dining | Groceries | ...] │   │
│            │  │                                       │   │
│            │  │  03/15 VENMO PAYMENT  $30.00          │   │
│            │  │  [Dropdown: Entertainment | ...]      │   │
│            │  └───────────────────────────────────────┘   │
│            │                                             │
├────────────┼─────────────────────────────────────────────┤
│            │         COACHING VIEW (hidden until click)   │
│            │                                             │
│            │  ┌─────────────────────────────────────┐    │
│            │  │                                     │    │
│            │  │   Chat messages appear here          │    │
│            │  │                                     │    │
│            │  │   🤖 "Based on your budget, you're  │    │
│            │  │   spending 32% on wants, slightly    │    │
│            │  │   over the 30% target. According to  │    │
│            │  │   NerdWallet, the top strategy..."   │    │
│            │  │                                     │    │
│            │  ├─────────────────────────────────────┤    │
│            │  │  [Type your question...]     [Send]  │    │
│            │  └─────────────────────────────────────┘    │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

#### 4B. Design System

| Element | Specification |
|---|---|
| **Font** | Inter or SF Pro Display (system font stack fallback) |
| **Primary Color** | `#1A1A2E` (dark navy — professional) |
| **Accent Color** | `#16C784` (green — financial, growth) |
| **Warning Color** | `#F5A623` (amber — over-budget) |
| **Danger Color** | `#EA3943` (red — significantly over) |
| **Background** | `#F8F9FA` (off-white) |
| **Card Background** | `#FFFFFF` with subtle `box-shadow` |
| **Nav Background** | `#1A1A2E` (dark, contrasts with content) |
| **Border Radius** | `12px` (modern, soft) |
| **Progress Bars** | Green gradient, rounded, animated fill |
| **Spacing** | 8px grid system |
| **Transitions** | 0.2s ease for hover, 0.3s for view switching |

#### 4C. Progress Bar Logic
- **Green** (`#16C784`): 0–90% of line item budget spent → healthy
- **Amber** (`#F5A623`): 90–100% of line item budget spent → warning
- **Red** (`#EA3943`): >100% of line item budget spent → over budget
- Bar width = `(actual_spent / budget_allocated) * 100%`, capped at 100% visually
- Remaining amount shown as text to the right: `$150 left` or `$120 over`

#### 4D. Uncategorized Items UX
When the LLM returns uncategorized transactions:
- They appear in a dedicated section below the budget
- Each shows: date, description, amount
- A **dropdown** with the LLM's suggested categories + all other categories
- User selects → item moves into the chosen budget line → progress bars update
- A "Confirm All" button to finalize

#### 4E. View Switching
- Only ONE view visible at a time (Budget Generator OR Coaching)
- Nav buttons have active state (highlighted icon + text)
- Smooth fade transition between views
- Budget data persists in memory when switching to Coaching and back

---

## 🔑 Environment Variables Required

```env
# Existing (from template)
OPENAI_API_KEY=sk-...
SERP_API_KEY=...

# New (for Plaid)
PLAID_CLIENT_ID=...        # From https://dashboard.plaid.com/developers/keys
PLAID_SECRET=...           # Sandbox secret
PLAID_ENV=sandbox

# Optional
LANGSMITH_PROJECT=budgetmind
```

---

## 📦 Package Dependencies to Add

```json
{
  "dependencies": {
    "plaid": "^41.1.0"        // Plaid Node client for serverless functions
  }
}
```

Client-side: Plaid Link is loaded via CDN script tag (no npm package needed):
```html
<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
```

---

## 🚀 Development Order (Build Sequence)

| Step | Task | Files |
|---|---|---|
| **1** | Set up Plaid account, get sandbox keys | Dashboard only |
| **2** | Create custom sandbox user with realistic transactions | Load JSON into Plaid Dashboard |
| **3** | Build `fetchPlaid` Netlify function | `netlify/functions/fetchPlaid/fetchPlaid.js` |
| **4** | Build new `index.html` with two-panel layout | `index.html` |
| **5** | Build new `index.css` with design system | `index.css` |
| **6** | Build `index.js` — Plaid Link flow + view switching | `index.js` |
| **7** | Build `generateBudget` function with SCOPE prompt | `netlify/functions/generateBudget/generateBudget.js` |
| **8** | Build budget rendering UI (progress bars, sections) | `index.js` + `index.css` |
| **9** | Build uncategorized items UI (dropdowns) | `index.js` + `index.css` |
| **10** | Build `fetchCoaching` function (SerpAPI pattern) | `netlify/functions/fetchCoaching/fetchCoaching.js` |
| **11** | Build coaching chat interface | `index.js` + `index.css` |
| **12** | Polish, test, deploy to Netlify | All files |

---

## ✅ Acceptance Criteria

- [ ] User can click "Connect Bank" and complete Plaid Link flow in sandbox
- [ ] Transactions are fetched and passed to the LLM
- [ ] LLM returns a structured 50/30/20 budget with categorized line items
- [ ] Budget displays with green progress bars and spending amounts
- [ ] Uncategorized items show with dropdown category selectors
- [ ] Coaching chat sends user's budget + question to SerpAPI + LLM
- [ ] Coaching responses cite real sources and reference user's actual data
- [ ] Navigation switches between Budget and Coaching views cleanly
- [ ] UI is minimal, professional (Apple/Uber aesthetic)
- [ ] App deploys and runs on Netlify

---

## 🤔 Open Questions / Decisions Needed

1. **Plaid Dashboard access** — Do you already have a Plaid developer account? If not, we'll need to sign up at https://dashboard.plaid.com/signup
2. **Custom sandbox user** — Should we create a custom user JSON with realistic college-student-like transactions (rent, dining, textbooks, etc.) or use Plaid's built-in `user_transactions_dynamic`?
3. **GPT model** — The template uses `gpt-3.5-turbo-instruct`. I recommend upgrading to `gpt-4o` for much better categorization accuracy. Are you okay with this?
4. **App name** — I've been calling it "BudgetMind" — do you have a preferred name?
5. **Netlify site** — Will we deploy to the same `721-g4-26.netlify.app` site or create a new one?

---

*Ready to start building? Let me know which phase to begin with, or if you'd like to adjust anything in this plan.*

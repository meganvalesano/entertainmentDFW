# Cents of Mind — Deployment & Assignment Summary

## Your Idea
**Cents of Mind** — An AI-powered personal finance budgeting assistant that:
- Connects to users' bank accounts via Plaid sandbox
- Uses OpenAI to automatically categorize transactions and generate 50/30/20 budgets
- Provides personalized financial coaching with web-sourced advice via SerpAPI
- Features a modern two-panel UI with budget visualization and real-time chat

## Why This Idea
1. **Solves a Real Problem:** College students & young professionals struggle with budgeting and financial literacy
2. **AI-Driven Insights:** Automated transaction categorization saves time vs. manual tracking
3. **Educational Value:** The 50/30/20 rule provides a proven framework for healthy spending
4. **Personalized Coaching:** Combines user's actual budget with web research for tailored advice
5. **Modern Tech Stack:** Demonstrates proficiency with Netlify functions, OpenAI APIs, Plaid integration, and modern frontend design

## Workflow Implemented
✅ **Both: Generate Budget + Coaching**
- **Generate Budget:** User connects Plaid → AI analyzes transactions → Generates 50/30/20 breakdown
- **Coaching:** User asks financial questions → AI searches web + references their budget → Provides tailored advice

## Your Branch URL
**https://budgeting-app--721-g4-26.netlify.app/**

### Local Development
```bash
cd "/Users/macae/Documents/SMU MSBA/Spring 2026/Mod B/ITOM 6219"

# Copy example secrets file
cp secrets.toml.example secrets.toml

# Edit secrets.toml with your Plaid sandbox credentials:
# [plaid]
# client_id = "your_client_id"
# secret = "your_secret"
# env = "sandbox"

# Start local dev server
netlify dev

# Visit: http://localhost:8888
```

### Production Deployment (Netlify)
1. Push code: `git push origin budgeting-app`
2. Go to netlify.com → Your Site → Settings → Environment
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `SERPAPI_KEY`
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV=sandbox`
4. Netlify auto-deploys on push

## Key Features
- 🏦 **Plaid Integration:** Connect real bank accounts (sandbox mode for testing)
- 🤖 **AI Budget Analysis:** OpenAI GPT-4o categorizes transactions, builds 50/30/20 budgets
- 💬 **Financial Coaching:** SerpAPI + OpenAI coach provides web-researched advice
- 📊 **Beautiful UI:** Responsive two-panel layout, progress bars, transaction details
- 🔐 **Secure Keys:** `secrets.toml` for local dev, Netlify env vars for production
- ✅ **No Keys in GitHub:** All credentials gitignored

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Netlify Functions (Node.js)
- **APIs:** Plaid, OpenAI (GPT-4o), SerpAPI
- **Bundler:** Webpack, esbuild (Netlify)
- **Libraries:** @langchain/openai, langsmith, plaid, serpapi, @iarna/toml

## Files Modified/Created
- ✅ `index.js` — Updated to use branch URL
- ✅ `netlify/functions/loadSecrets.js` — TOML secrets loader
- ✅ `netlify/functions/fetchPlaid.js` — Lazy Plaid init, CORS headers
- ✅ `netlify/functions/generateBudget.js` — GPT-4o, increased tokens, CORS
- ✅ `netlify/functions/fetchCoaching.js` — GPT-4o-mini, CORS, SerpAPI
- ✅ `netlify/functions/fetchAI.js` — GPT-4o-mini, loadSecrets, CORS
- ✅ `netlify/functions/fetchCompetitors.js` — GPT-4o-mini, loadSecrets, CORS
- ✅ `secrets.toml.example` — Template for local credentials
- ✅ `netlify.toml` — Added @iarna/toml to external modules
- ✅ `package.json` — Added @iarna/toml dependency
- ✅ `.gitignore` — Protects `secrets.toml` from accidental leaks
- ✅ `README.md` — Updated with secrets.toml workflow

## Testing Checklist
- ✅ App loads at http://localhost:8888
- ✅ All 6 Netlify functions load cleanly
- ✅ No deprecated model errors
- ✅ CORS headers present in all responses
- ✅ Secrets load from `secrets.toml`
- ✅ Plaid Link UI renders (sandbox credentials: user_good / pass_good)
- ✅ Budget generation works
- ✅ Coaching chat works

---

**Ready for production deployment!** 🚀

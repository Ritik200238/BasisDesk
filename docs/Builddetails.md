# SoSoValue Buildathon — Build Reference

> Working notes distilled from the official Buildathon page. Only build-relevant info is kept here.
> Goal: build a winning **agentic finance app** on SoSoValue's infrastructure.

---

## 0. North Star — Build a Real Product, Not a Buildathon Entry

**We are building a complete product, ready to launch in the market — not just a hackathon submission.**

- Treat every decision as if real users will use this the day after the demo.
- The Buildathon is the launchpad, not the finish line — the prize is a milestone, the product is the goal.
- This means: real user value, production-quality UX, reliable flows, and a path to actual adoption — not a throwaway prototype that only works in a scripted demo.
- Every feature should answer: *"Would a real user pay for / rely on this?"* If not, cut it or fix it.

---

## 1. The Core Mission

Build **agentic finance applications** with SoSoValue's APIs (+ supporting tools).

The vision: AI + SoSoValue infra lets even a **single-person team** build apps that act as a:
- **Financial news agency**, or
- **Index publisher**, or
- **Fund manager**

...and serve those services **on-chain** to users worldwide.

**A strong submission demonstrates:**
- Clear user value
- A clear use case
- A complete flow: **data input → actionable output**

---

## 2. What to Build With (Tech Stack)

Build with: **SoSoValue · SoDEX · ValueChain · AI**

| Component | What it is | Layer |
|---|---|---|
| **SoSoValue Terminal** | Structured financial news, data, market intelligence | Information / Research |
| **SSI Protocol** | One of the largest on-chain spot index protocols | Index |
| **SoDEX & ValueChain** | High-perf on-chain orderbook on proprietary EVM-compatible L1; scalable, transparent, agent-friendly | Execution |

**The full stack = research → analysis → index/strategy → execution.**

### Key Repos & Docs
- **SSI Protocol (GitHub):** https://github.com/SoSoValueLabs/ssi-protocol
- **SoSoValue API Docs:** https://sosovalue-1.gitbook.io/sosovalue-api-doc
- **SoDEX API Docs:** https://sodex.com/documentation/api/api
- **Common free-tier APIs (reference):** https://www.notion.so/Common-APIs-167b57bd102a4c03b8f2421108fc66eb

---

## 3. Judging Criteria (⚖️ build to these weights)

| Category | Weight | Focus |
|---|---|---|
| **User Value & Practical Impact** | **30%** | Real-world value — does it help users gain insight, make decisions, or execute better? |
| **Functionality & Working Demo** | **25%** | Clear, functional demo showing the core features and workflow |
| **Logic, Workflow & Product Design** | **20%** | Clear, well-structured logic backed by a solid workflow / analytical framework |
| **Data / API Integration** | **15%** | How effectively SoSoValue API, SoDEX API, and other data sources are integrated |
| **UX & Clarity** | **10%** | Intuitive, well-structured, easy to understand and use |

> **Priority insight:** Value (30%) + Demo (25%) = **55%**. A working end-to-end demo with obvious user value beats feature-stuffing. Always have something live and clickable.

---

## 4. Requirements & Bonuses

### ✅ Required (must-have to qualify)
- **Genuinely integrate SoSoValue API** (non-negotiable)
- Clear use case + **real user value**
- Complete a **basic flow from data input → output**
- Provide **verifiable demo materials + documentation**

### ⭐ Bonus (extra points)
- **SoDEX API integration**
- **AI-enhanced functionality**
- Help users **discover opportunities, generate signals, or explain markets**
- **Risk control, confirmation mechanisms, security awareness**
- A more complete flow **from insight → action**
- Better product experience (**panels, bots, skills, automated workflows**)

---

## 5. Example Directions (for inspiration)

- **Signal-to-Execution Agent** — data signal → trade action
- **Opportunity Discovery Engine** — surface opportunities from data
- **Strategy Assistant Bot** — conversational strategy helper
- **Smart Research Dashboard** — structured research UI
- **Copy-Trading Support Tool** — follow/replicate strategies

---

## 6. Submission Requirements (per wave)

Submit via the official hackathon platform before each deadline. Each submission needs:

1. **Project Overview** — name, short description, target users, core logic, APIs & data sources
2. **Public GitHub Repo** — repo link + README with setup instructions
3. **Demo** — public **live demo link**
4. **Video Intro** (recommended) — short video: idea, core workflow, user value
5. **Team Info** — members + contact
6. **Wave Progress Update** — brief changelog for the current wave

---

## 7. API Access Notes (logistics)

- **Buildathon access request form:** https://forms.gle/2nuJT2qNbUQsyyZy8
- **SoSoValue API:** register for SoSoValue first → register API access via the API docs. Use the form to request higher limits.
- **SoDEX API (Mainnet):** needs **Silver rank in SoPoints** OR Buildathon whitelist (via form). Register for SoDEX first. Generating a mainnet API key requires **depositing a supported token** — check supported chains + min deposit.
- **SoDEX API (Testnet):** usable directly, **no application needed** → good for early dev/demo.
- Approved access is Buildathon-only and time-limited.

---

## 9. Build Strategy Cheatsheet

- **Nail the end-to-end flow:** SoSoValue data → AI insight → actionable output (→ SoDEX execution = bonus).
- **Always keep a live, clickable demo** — it's 25% of the score and proves everything else.
- **Lead with user value** — frame every feature around a real user decision/action it improves.
- **Use AI as the agent layer** — turn raw data into signals, explanations, and actions.
- **Add risk control + confirmation** for any execution path — judges explicitly reward safety awareness.
- **Touch all three layers** if possible to satisfy all three judging teams.
- **Testnet first** (SoDEX) for fast iteration; mainnet only if access + deposit are sorted.

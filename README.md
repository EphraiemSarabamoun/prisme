# Prisme

**See your writing through every perspective.**

Prisme is an AI-powered writing tool that helps journalists and writers understand how their articles land with different audiences before they publish. Write in a rich text editor, then get instant feedback from three ideologically distinct AI agents, each powered by [Mistral](https://mistral.ai/).

Built for the **Mistral AI Hackathon** by **Team Bonaparte**.

---

## The Problem

Every article carries blind spots. A journalist may unintentionally favor one perspective, miss critical context, or use framing that alienates part of their audience. Traditional editing catches grammar not bias.

## The Solution

Prisme puts three AI "lenses" on your writing simultaneously:

Each agent scores your article (1–10), flags disagreements, and can **suggest targeted edits** that appear as an interactive diff you can accept or reject. You can also calibrate your agents by uploading folders of articles and batch-testing them to see how each agent scores across a corpus, then tweak agent personas and descriptions until they behave exactly how you want. The entire app supports light and dark mode, and is fully localized in both English and French.


## Powered by Mistral

Prisme uses **Mistral Large** (`mistral-large-latest`) exclusively for all AI features:

- **Feedback generation**:  Each agent evaluates articles from their ideological perspective, returning structured JSON (approval score, disagreements, perspective summary)
- **Improvement suggestions**: Agents propose minimal, targeted edits to improve how the article reads from their viewpoint
- **Batch evaluation**: Run all agents against entire article folders for calibration
- **JSON mode**: Guaranteed structured output via Mistral's `responseFormat: { type: "json_object" }`

---

## Running Locally

### Prerequisites

- **Node.js** 18+ and **npm**
- A **Mistral API key** — get one at [console.mistral.ai](https://console.mistral.ai/)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/prisme.git
cd prisme

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
```

Add your Mistral API key to `.env.local`:

```
MISTRAL_API_KEY=your_api_key_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4 |
| Editor | TipTap (ProseMirror) |
| AI | Mistral Large via `@mistralai/mistralai` SDK |
| PDF Parsing | pdf-parse |
| State | React Context + localStorage |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main editor + agent sidebar
│   ├── tune/page.tsx         # Agent tuning + batch testing
│   ├── api/
│   │   ├── feedback/route.ts # Mistral feedback endpoint
│   │   ├── improve/route.ts  # Mistral edit suggestions
│   │   └── upload/route.ts   # PDF/text file upload
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── RichEditor.tsx        # TipTap rich text editor
│   ├── AgentCard.tsx         # Agent feedback display
│   ├── DiffView.tsx          # Interactive diff viewer
│   └── ScoreBar.tsx          # Visual score bar
└── lib/
    ├── agents.ts             # Agent definitions & personas
    ├── AgentContext.tsx       # Global state (agents, theme, locale)
    ├── i18n.ts               # EN/FR translations
    ├── diff.ts               # Word-level LCS diff algorithm
    ├── stripHtml.ts          # HTML → plain text for API calls
    └── useLocalStorage.ts    # Persistent state hook
```

---

## Team Bonaparte

Built with care for the Mistral AI Hackathon.

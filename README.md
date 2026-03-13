# 🤖 AgentFlow - AI Agent Automation Platform

A production-ready AI automation platform where users can create AI agents, connect integrations (Gmail), and build automation workflows visually. Built with Next.js 14, Supabase, React Flow, and OpenAI.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-green) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-blue)

---

## ✨ Features

- **🔐 Authentication** — Email/password + Google OAuth via Supabase Auth
- **📊 Dashboard** — Real-time metrics, activity feed, quick start guide
- **🤖 Agent Manager** — Create, configure, start/stop AI agents
- **🔗 Integrations** — Connect Gmail (OAuth), with future support for Instagram, Telegram, Discord
- **🔄 Visual Workflow Builder** — Drag-and-drop Zapier-like editor with React Flow
- **⚡ Execution Engine** — Graph-traversal workflow executor with data passing
- **🧠 AI Module** — Modular AI service (OpenAI) with summarize, classify, generate functions
- **📝 Logs & Monitoring** — Agent activity and workflow execution logs
- **🔒 Security** — Row Level Security on all tables, scoped user data access

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |
| Workflow Builder | React Flow (@xyflow/react) |
| Backend | Next.js Server Actions + API Routes |
| Database | Supabase (PostgreSQL 17) |
| Auth | Supabase Auth (Email + Google OAuth) |
| AI | OpenAI API (modular provider) |
| Integrations | Gmail API (OAuth 2.0) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/        # Metrics overview
│   │   ├── agents/           # Agent management
│   │   ├── workflows/        # Workflow list + builder
│   │   ├── integrations/     # Service connections
│   │   ├── logs/             # Activity monitoring
│   │   └── settings/         # Account settings
│   ├── api/                  # API routes
│   │   ├── agents/run/       # Agent execution endpoint
│   │   ├── workflows/execute/# Workflow execution endpoint
│   │   └── integrations/     # OAuth callbacks
│   ├── auth/callback/        # Auth callback
│   └── login/                # Login page
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── dashboard/            # Dashboard-specific components
│   └── workflow-builder/     # React Flow workflow builder
│       └── nodes/            # Custom node components
├── lib/
│   ├── supabase/             # Supabase client config
│   ├── ai/                   # AI service module
│   ├── integrations/         # Integration modules
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utilities
├── services/
│   ├── agents/               # Agent server actions
│   ├── workflows/            # Workflow actions + engine
│   └── integrations/         # Integration actions
└── workers/
    └── agent-runner.ts       # Background agent worker
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/marek6296/agent-manager.git
cd agent-manager

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth redirect (default: `http://localhost:3000/api/integrations/gmail/callback`) |

---

## 🔧 Google OAuth Setup (Gmail Integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Gmail API**
4. Go to **Credentials** → Create **OAuth 2.0 Client ID**
5. Add authorized redirect URI: `http://localhost:3000/api/integrations/gmail/callback`
6. Copy Client ID and Client Secret to `.env.local`

---

## 📊 Database Schema

The platform uses 6 core tables with Row Level Security:

- **users** — User profiles (auto-created on signup)
- **agents** — AI agent configurations
- **integrations** — Connected service credentials
- **workflows** — Visual workflow definitions
- **workflow_runs** — Execution history
- **agent_logs** — Agent activity logs

All tables have RLS policies ensuring users can only access their own data.

---

## 🔄 Workflow Node Types

### Triggers
- **New Email** — Triggers on new inbox messages
- **Schedule** — Cron-based scheduling
- **Webhook** — HTTP webhook trigger

### Actions
- **Send Email** — Send emails via Gmail
- **Store Data** — Persist data to database
- **Notification** — Send notifications

### AI
- **Summarize** — AI-powered text summarization
- **Classify** — Text classification into categories
- **Generate Reply** — AI email reply generation
- **Generate Text** — Custom AI text generation

---

## 🤖 Agent Types

- **Email Summarizer** — Reads inbox and creates summaries
- **Email Auto Reply** — Automatically replies to emails using AI
- **Data Analyzer** — Analyzes data with AI insights
- **Custom** — User-defined agent behavior

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/run` | Trigger agent execution cycle |
| POST | `/api/workflows/execute` | Execute a workflow |
| GET | `/api/integrations/gmail/callback` | Gmail OAuth callback |

---

## 🛠️ Development

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 📄 License

MIT

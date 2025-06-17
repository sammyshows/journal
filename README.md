# 🧠 Journal AI

_Your mind deserves a place to breathe._

Journal AI is a voice-first, emotionally intelligent journaling app powered by LLMs and graph-based memory. It's built for people who want to reflect deeper, remember better, and grow more intentionally.

---

## 🌟 Vision

We're building more than a journaling tool.

Journal AI is a **personal thought partner** — a quiet space where you can:
- Speak freely with your voice, no typing required
- Be gently guided into meaningful reflection
- Revisit emotional patterns and moments with clarity
- See your journey visualized in a **Soul Map** — a graph of your thoughts, feelings, and recurring themes

---

## 🚀 Current Stack

| Layer      | Tech                             |
|------------|----------------------------------|
| Mobile App | Expo + React Native |
| AI Engine  | GPT-4.1 Mini (chat), GPT-4o (analysis) |
| Vector DB  | Postgres + `pgvector` (entry similarity) |
| Graph DB   | Postgres |
| Auth       | Better Auth                    |
| Infra      | Turborepo + pnpm      |

---

## 🎯 Core Features (v1)

- ✅ **Conversational AI** that reflects and prompts gently
- ✅ **Emotion tagging + topic extraction** after each entry
- ✅ **User profile** that evolves over time, enriching prompts
- ✅ **Similarity search** with vector embeddings (semantic memory)

---

## 🧪 Coming Soon

- ✅ **Voice journaling** via device mic
- 🔍 **"Soul Map" graph UI** showing how your emotions, people, and experiences interconnect
- ✨ **Reflective prompts** based on patterns across time
- 📊 **Emotional summaries** and thematic journaling streaks
- 🔐 **Encrypted local storage + export options**

---

## 🛠 Local Dev

### Prerequisites

1. **Start the database** (required for embeddings and data persistence):
```bash
docker-compose up -d
```

2. **Install dependencies**:
```bash
pnpm install
```

### Development Commands

```bash
# Start web app
pnpm dev --filter=web

# Start mobile app (React Native)
cd apps/mobile
npx expo start
```

---

## 🐳 Database Setup

We use Docker Compose to run PostgreSQL with `pgvector` support locally. This simulates our production environment and enables:

- Local vector similarity search for journal entries
- Supabase-compatible queries and schema
- No manual PostgreSQL installation required

### Database Services

| Service | Details |
|---------|---------|
| **PostgreSQL + pgvector** | `localhost:5432` |
| Username | `postgres` |
| Password | `postgres` |
| Database | `journal_dev` |

### Database Commands

```bash
# Start database (runs in background)
docker-compose up -d

# Stop database
docker-compose down

# View database logs
docker-compose logs -f

# Verify connection
lsof -i :5432

# Connect via CLI
psql -h localhost -U postgres -d journal_dev
```

**Note**: The database must be running before starting the web app, as embedding storage requires the vector database connection.

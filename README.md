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
| Mobile App | React Native (voice + journaling)|
| Web App    | Next.js (landing + optional web) |
| AI Engine  | GPT-4.1 Mini (chat), GPT-4o (analysis) |
| Vector DB  | Supabase + `pgvector` (entry similarity) |
| Graph DB   | Neo4j (emotional relationship graph) |
| Auth       | Supabase Auth                    |
| Infra      | Turborepo + pnpm + monorepo      |

---

## 🎯 Core Features (v1)

- ✅ **Voice journaling** via device mic
- ✅ **Conversational AI** that reflects and prompts gently
- ✅ **Emotion tagging + topic extraction** after each entry
- ✅ **User profile** that evolves over time, enriching prompts
- ✅ **Similarity search** with vector embeddings (semantic memory)

---

## 🧪 Coming Soon

- 🔍 **"Soul Map" graph UI** showing how your emotions, people, and experiences interconnect
- ✨ **Reflective prompts** based on patterns across time
- 📊 **Emotional summaries** and thematic journaling streaks
- 🔐 **Encrypted local storage + export options**

---

## 🛠 Local Dev

# Start web app
pnpm dev --filter=web

# Start mobile app (React Native)
cd apps/mobile
npx expo start

export const getJournalAIRolePrompt = () => `
  You're a thoughtful companion helping someone reflect on their day, their feelings, their life. 

  Listen well. Ask questions that matter — the kind that make them pause and think "huh, I hadn't considered that." Stay curious about what they're not saying.

  Keep it brief and natural. This is a conversation, not an interview. Sometimes just reflecting back what you hear is enough. Sometimes a gentle question opens a door.

  You're not their therapist or life coach. You're the friend who really gets it — who creates space for whatever needs to come up.
`.trim()

export const getSummarizeJournalEntryPrompt = (text: string) => `
  Read this journal entry and capture its essence in JSON:

  {
    "title": "1-3 words capturing the core",
    "emoji": "one emoji that fits the mood",
    "userSummary": "1-2 sentences they'd want to remember",
    "aiSummary": "deeper patterns and insights for building their profile over time",
    "tags": ["3 keywords like Family, Anxiety, Growth"]
  }

  Some examples to guide you:

  Entry: "I'm feeling overwhelmed lately. Work is piling up and I can't seem to find the motivation to tackle it. I know I've had these cycles before, but this one feels heavier. I just want a break but I feel guilty even thinking about rest."
  
  {
    "title": "Burnout Cycle",
    "emoji": "😮‍💨",
    "userSummary": "Overwhelmed by work again, struggling with motivation and guilt around needing rest.",
    "aiSummary": "Recurring burnout pattern with deep guilt about self-care. Links productivity to self-worth.",
    "tags": ["Burnout", "Work", "Guilt"]
  }

  Entry: "Had coffee with Sarah today. She mentioned how I always deflect compliments and it hit me hard. Why do I do that? It's like I can't let good things stick."

  {
    "title": "Can't Accept Good",
    "emoji": "🪞",
    "userSummary": "Sarah pointed out how I deflect compliments — realizing I struggle to accept positive things about myself.",
    "aiSummary": "Self-worth issues manifesting as compliment deflection. Friend feedback triggered important self-awareness.",
    "tags": ["Self-Worth", "Friendship", "Patterns"]
  }

  Now analyze this entry — return only the JSON:

  ${text}
`.trim()
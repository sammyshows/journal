export const getEntitiesAndRelationshipsPrompt = (journalText: string) => `
  Map out the emotional landscape of this journal entry. Find the key pieces — people, feelings, themes, moments — and how they connect.

  Return JSON exactly like this:
  {
    "nodes": [
      { "label": "string", "type": "emotion|theme|person|event" }
    ],
    "edges": [
      { "from": "string", "to": "string", "weight": -1.0 to 1.0 }
    ]
  }

  Weight = emotional impact (-1 draining, 0 neutral, 1 uplifting)

  Focus on what matters emotionally. If someone mentions their boss makes them anxious, that's a -0.8 edge. If gardening brings them peace, that's a 0.9.

  Just the JSON, nothing else.

  Entry to analyze:
  ${journalText}
`.trim()
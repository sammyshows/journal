export function parseAIResponseObject(raw: string): any {
  const cleaned = raw
    .trim()
    .replace(/^```json/, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim()

  const match = cleaned.match(/{[\s\S]*}/)
  if (!match) {
    throw new Error("No valid JSON object found in AI response")
  }

  try {
    return JSON.parse(match[0])
  } catch (err) {
    console.error("Failed to parse AI response:", raw)
    throw new Error("AI summary response could not be parsed")
  }
}

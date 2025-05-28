import React, { useState } from "react";
import { sendToAnthropic } from "@repo/ai/client";
import { getInitialJournalPrompt } from "@repo/ai/prompts";

export default function Home() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([
    { role: "ai", content: getInitialJournalPrompt() }
  ]);
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setChat((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Concatenate the chat into a single prompt for Anthropic
      const prompt = chat
        .concat(userMessage)
        .map((msg) =>
          msg.role === "user"
            ? `User: ${msg.content}`
            : `Assistant: ${msg.content}`
        )
        .join("\n") + "\nAssistant:";

      const aiReply = await sendToAnthropic(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY, prompt);

      setChat((prev) => [
        ...prev,
        { role: "ai", content: aiReply || "Sorry, I couldn't respond." }
      ]);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        { role: "ai", content: "Error: Could not reach AI." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      maxWidth: 480,
      margin: "40px auto",
      padding: 24,
      border: "1px solid #eee",
      borderRadius: 8,
      fontFamily: "sans-serif"
    }}>
      <h2 style={{ textAlign: "center" }}>Reflective Journal</h2>
      <div style={{
        minHeight: 300,
        marginBottom: 16,
        padding: 12,
        background: "#fafbfc",
        borderRadius: 6,
        overflowY: "auto",
        border: "1px solid #f0f0f0"
      }}>
        {chat.map((msg, i) => (
          <div
            key={i}
            style={{
              margin: "12px 0",
              textAlign: msg.role === "user" ? "right" : "left"
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: msg.role === "user" ? "#dbeafe" : "#f3f4f6",
                color: "#222",
                padding: "8px 12px",
                borderRadius: 16,
                maxWidth: "80%",
                wordBreak: "break-word"
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ color: "#888", fontStyle: "italic", margin: "8px 0" }}>
            AI is thinking...
          </div>
        )}
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your journal entry..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 16,
            border: "1px solid #ddd",
            fontSize: 16
          }}
          disabled={loading}
        />
        <button
          type="submit"
          style={{
            padding: "0 18px",
            borderRadius: 16,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer"
          }}
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
}

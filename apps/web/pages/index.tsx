import React, { useState } from "react";
import { sendToAnthropicAPI, sendToEmbeddingsAPI, type ChatMessage } from "@repo/ai/client";
import { getInitialJournalPrompt } from "@repo/ai/prompts";

export default function Home() {
  const [input, setInput] = useState("Hi, I've just finished watching the four seasons on netflix, it really dives into the humanity of people");
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "ai", content: getInitialJournalPrompt() }
  ]);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
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

      const aiReply = await sendToAnthropicAPI(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "", prompt);

      setChat((prev) => [
        ...prev,
        { role: "ai", content: aiReply || "Sorry, I couldn't respond." }
      ]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "ai", content: "Error: Could not reach AI." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      await sendToEmbeddingsAPI(process.env.NEXT_PUBLIC_VOYAGE_API_KEY || "", chat);
      console.log('Chat successfully saved and processed for embeddings');
    } catch (error) {
      console.error('Error finishing chat:', error);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `
      }} />
      <div style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
        fontFamily: "sans-serif"
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Reflective Journal</h2>
        <button
          onClick={handleFinish}
          disabled={finishing || loading || chat.length <= 1}
          style={{
            padding: "8px 16px",
            borderRadius: 16,
            border: "none",
            background: finishing ? "#9ca3af" : "#10b981",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: finishing || loading || chat.length <= 1 ? "not-allowed" : "pointer",
            opacity: finishing || loading || chat.length <= 1 ? 0.6 : 1
          }}
        >
          {finishing ? "Finishing..." : "Finish"}
        </button>
      </div>
      <div style={{
        minHeight: 300,
        marginBottom: 16,
        padding: 12,
        background: "#fafbfc",
        borderRadius: 6,
        overflowY: "auto",
        border: "1px solid #f0f0f0",
        position: "relative"
      }}>
        {finishing ? (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(250, 251, 252, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}>
            <div style={{
              color: "#666",
              fontStyle: "italic",
              fontSize: 18,
              animation: "pulse 1.5s ease-in-out infinite"
            }}>
              Saving...
            </div>
          </div>
        ) : null}
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
          disabled={loading || finishing}
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
            cursor: loading || finishing ? "not-allowed" : "pointer"
          }}
          disabled={loading || finishing}
        >
          Send
        </button>
      </form>
      </div>
    </>
  );
}

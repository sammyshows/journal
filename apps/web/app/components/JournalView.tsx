'use client'

import React, { useState } from "react";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export default function JournalView(): React.ReactElement {
  const [input, setInput] = useState("Hi, I've just finished watching the four seasons on netflix, it really dives into the humanity of people");
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "ai", content: "What's been on your mind lately? I'm here to help you explore your thoughts." }
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat: [...chat, userMessage]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      setChat((prev) => [
        ...prev,
        { role: "ai", content: data.reply || "Sorry, I couldn't respond." }
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
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const response = await fetch('/api/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to finish chat');
      }

      console.log('Chat successfully saved and processed for embeddings');
    } catch (error) {
      console.error('Error finishing chat:', error);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Reflective Journal</h2>
          <button
            onClick={handleFinish}
            disabled={finishing || loading || chat.length <= 1}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              finishing || loading || chat.length <= 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {finishing ? "Finishing..." : "Finish"}
          </button>
        </div>

        <div className="relative mb-6 h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 border">
          {finishing && (
            <div className="absolute inset-0 bg-gray-50/90 flex items-center justify-center z-10">
              <div className="text-gray-600 font-medium animate-pulse">
                Saving...
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-600 px-4 py-3 rounded-lg border border-gray-200 italic">
                  AI is thinking...
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your journal entry..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || finishing}
          />
          <button
            type="submit"
            disabled={loading || finishing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading || finishing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
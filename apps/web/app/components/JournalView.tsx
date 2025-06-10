'use client'

import React, { useState } from "react";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

type JournalMode = 'standard' | 'guided';
type InputMode = 'keyboard' | 'microphone';

export default function JournalView(): React.ReactElement {
  const [mode, setMode] = useState<JournalMode>('standard');
  const [inputMode, setInputMode] = useState<InputMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('journal-input-mode') as InputMode) || 'keyboard';
    }
    return 'keyboard';
  });
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const handleModeChange = (newMode: JournalMode) => {
    setMode(newMode);
    if (newMode === 'guided' && chat.length === 0) {
      setChat([{ role: "ai", content: "What's been on your mind lately? I'm here to help you explore your thoughts." }]);
    } else if (newMode === 'standard') {
      setChat([]);
    }
  };

  const handleInputModeChange = (newInputMode: InputMode) => {
    setInputMode(newInputMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('journal-input-mode', newInputMode);
    }
  };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || mode === 'standard') return;

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
      const chatData = mode === 'standard' 
        ? [{ role: "user" as const, content: input }]
        : chat;
      
      const response = await fetch('/api/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat: chatData, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to finish chat');
      }

      console.log('Journal entry successfully saved and processed for embeddings');
      
      setInput("");
      setChat([]);
      if (mode === 'guided') {
        setChat([{ role: "ai", content: "What's been on your mind lately? I'm here to help you explore your thoughts." }]);
      }
    } catch (error) {
      console.error('Error finishing journal entry:', error);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-3xl w-full">
        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/20">
            <div 
              className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-in-out ${
                mode === 'standard' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+4px-1px)] w-[calc(50%-4px)]'
              }`}
            />
            <div className="relative flex">
              <button
                onClick={() => handleModeChange('standard')}
                className={`px-8 py-3 rounded-xl font-medium text-sm transition-colors duration-300 relative z-10 ${
                  mode === 'standard' 
                    ? 'text-slate-800' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => handleModeChange('guided')}
                className={`px-8 py-3 rounded-xl font-medium text-sm transition-colors duration-300 relative z-10 ${
                  mode === 'guided' 
                    ? 'text-slate-800' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Guided
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100">
            <h2 className="text-2xl font-semibold text-slate-800">
              {mode === 'guided' ? 'Guided Reflection' : 'Personal Journal'}
            </h2>
            {((mode === 'guided' && chat.some(msg => msg.role === 'user')) || (mode === 'standard' && input.trim())) && (
              <button
                onClick={handleFinish}
                disabled={finishing || loading}
                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                  finishing || loading
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg hover:shadow-emerald-200"
                }`}
              >
                {finishing ? "Saving..." : "Save Entry"}
              </button>
            )}
          </div>

          {/* Chat Area (only for guided mode) */}
          {mode === 'guided' && (
            <div className="relative h-96 overflow-y-auto p-6">
              {finishing && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-slate-600 font-medium flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    Saving your reflection...
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {chat.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-6 py-4 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "bg-slate-50 text-slate-800 border border-slate-200 shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 text-slate-600 px-6 py-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      AI is reflecting...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-slate-100">
            <form onSubmit={handleSend} className="flex gap-4">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={mode === 'guided' ? "Share your thoughts..." : "Write your journal entry..."}
                  className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-white/70 backdrop-blur-sm min-h-[120px]"
                  disabled={loading || finishing}
                  rows={mode === 'standard' ? 6 : 3}
                />
                
                {/* Input Mode Toggle - Only show when no content has been entered */}
                {!input.trim() && !loading && !finishing && (
                  <div className="absolute bottom-4 left-4">
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-lg border border-white/30">
                      <div 
                        className={`absolute top-1 h-[calc(100%-8px)] rounded-full shadow-md transition-all duration-300 ease-in-out ${
                          inputMode === 'keyboard' 
                            ? 'left-1 w-[calc(50%-4px)] bg-gradient-to-r from-blue-500 to-blue-600' 
                            : 'left-[calc(50%+4px-1px)] w-[calc(50%-4px)] bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                      />
                      <div className="relative flex">
                        <button
                          type="button"
                          onClick={() => handleInputModeChange('keyboard')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full font-medium text-sm transition-colors duration-300 relative z-10 ${
                            inputMode === 'keyboard' 
                              ? 'text-white' 
                              : 'text-slate-600 hover:text-slate-800'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
                          </svg>
                          Type
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputModeChange('microphone')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full font-medium text-sm transition-colors duration-300 relative z-10 ${
                            inputMode === 'microphone' 
                              ? 'text-white' 
                              : 'text-slate-600 hover:text-slate-800'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                          </svg>
                          Speak
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {mode === 'guided' && (
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading || finishing || !input.trim()}
                    className={`px-8 py-4 rounded-2xl font-medium transition-all duration-200 ${
                      loading || finishing || !input.trim()
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-200"
                    }`}
                  >
                    Send
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
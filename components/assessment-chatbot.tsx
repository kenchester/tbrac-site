"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";

interface Props {
  assessmentId: string;
  companyName: string;
}

export function AssessmentChatbot({ assessmentId, companyName }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const { messages, loading, sendMessage } = useChat(assessmentId, language);

  const welcomeMessage =
    language === "zh"
      ? `您好！我是 TBRAC 助手。我可以帮您了解 ${companyName} 的评估状态、解释各模块的含义，以及提供改善评分的建议。请问有什么需要帮助的？`
      : `Hi! I'm the TBRAC Assistant. I can help you understand the assessment status for ${companyName}, explain what each module measures, and suggest how to improve scores. What would you like to know?`;

  const placeholder =
    language === "zh" ? "输入问题..." : "Ask a question...";

  const sendLabel = language === "zh" ? "发送" : "Send";

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions =
    language === "zh"
      ? [
          "哪些模块还没完成？",
          "我们的风险评分意味着什么？",
          "如何提高合规得分最低的模块？",
        ]
      : [
          "Which modules are still incomplete?",
          "What does our risk score mean?",
          "How can we improve our lowest scoring module?",
        ];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#0b1f3a] hover:bg-[#152d52] shadow-lg flex items-center justify-center transition-all hover:scale-105"
          aria-label="Open TBRAC Assistant"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px] bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0b1f3a] text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">TBRAC Assistant</p>
                <p className="text-xs text-white/50">{companyName}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
            {/* Welcome */}
            <div className="flex gap-2 items-start">
              <div className="h-6 w-6 rounded-full bg-[#0b1f3a] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-[#0b1f3a] shadow-sm max-w-[280px]">
                {welcomeMessage}
              </div>
            </div>

            {/* Suggested questions (only shown when no messages yet) */}
            {messages.length === 0 && (
              <div className="flex flex-col gap-1.5 pl-8">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs text-left text-[#0b1f3a] bg-white border border-[#e2e8f0] rounded-full px-3 py-1.5 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-[#0b1f3a] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm max-w-[280px] shadow-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#0b1f3a] text-white rounded-tr-sm"
                      : "bg-white text-[#0b1f3a] rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 animate-pulse rounded-sm" />
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-2 items-start">
                <div className="h-6 w-6 rounded-full bg-[#0b1f3a] flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0b1f3a]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#e2e8f0] bg-white shrink-0 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] focus:outline-none focus:border-sky-700 disabled:opacity-50 text-[#0b1f3a]"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-8 w-8 rounded-full bg-[#0b1f3a] hover:bg-[#152d52] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label={sendLabel}
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

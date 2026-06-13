"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Compass,
  FlaskConical,
  Loader2,
  Map as MapIcon,
  RotateCcw,
  Send,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";

type Role = "user" | "assistant";
type Mode = "strategy" | "diagnosis" | "roadmap" | "experiment";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  pending?: boolean;
  offline?: boolean;
};

const starterPrompts: { title: string; prompt: string }[] = [
  {
    title: "Next quarter priorities",
    prompt: "What should we prioritise next quarter and why?",
  },
  {
    title: "Promotions risk",
    prompt: "Explain why Promotions is at risk.",
  },
  {
    title: "Compare two bets",
    prompt: "Compare airport pickup and promo auto-apply as roadmap bets.",
  },
  {
    title: "Competitor gaps",
    prompt: "Which competitor gaps matter most for Zig?",
  },
];

const modeOptions: { value: Mode; label: string; icon: LucideIcon; hint: string }[] = [
  { value: "strategy", label: "Strategy", icon: Compass, hint: "Prioritise bets and tradeoffs" },
  { value: "diagnosis", label: "Diagnosis", icon: Stethoscope, hint: "Find root causes in signals" },
  { value: "roadmap", label: "Roadmap", icon: MapIcon, hint: "Sequence product work" },
  { value: "experiment", label: "Experiment", icon: FlaskConical, hint: "Shape test plans" },
];

const sourceNames = [
  "Beacon Score",
  "Complaints",
  "Signals",
  "Opportunities",
  "Competitors",
];

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSessionId() {
  return `coach-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function CoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("strategy");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sourceCount, setSourceCount] = useState<number | null>(null);
  const sessionId = useMemo(() => createSessionId(), []);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function sendMessage(promptOverride?: string) {
    const content = (promptOverride ?? input).trim();
    if (!content || isStreaming) return;

    const userMessage: ChatMessage = { id: newId(), role: "user", content };
    const assistantId = newId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      pending: true,
    };

    const history = [...messages, userMessage];
    setMessages([...history, assistantMessage]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Coach-Session": sessionId,
        },
        body: JSON.stringify({
          mode,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const sources = response.headers.get("X-Coach-Sources");
      if (sources) setSourceCount(Number(sources));

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; fallback?: string; sourceCount?: number }
          | null;
        if (payload?.sourceCount) setSourceCount(payload.sourceCount);
        setMessages((current) =>
          current.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  pending: false,
                  offline: true,
                  content:
                    payload?.fallback ??
                    payload?.error ??
                    "AI Coach is offline. Start Ollama to enable live responses.",
                }
              : m
          )
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const text = accumulated;
        setMessages((current) =>
          current.map((m) =>
            m.id === assistantId ? { ...m, pending: false, content: text } : m
          )
        );
      }

      setMessages((current) =>
        current.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                pending: false,
                content:
                  accumulated.trim() ||
                  "I did not receive a response from the local model.",
              }
            : m
        )
      );
    } catch {
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                pending: false,
                offline: true,
                content:
                  "AI Coach could not connect to the local route. Check that the dev server and Ollama are running.",
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  const activeMode = modeOptions.find((m) => m.value === mode)!;

  return (
    <div className="mx-auto flex h-[calc(100dvh-12rem)] min-h-[480px] max-w-3xl flex-col">
      {/* Conversation header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isStreaming ? "animate-pulse bg-brand" : "bg-success"
            )}
          />
          {isStreaming
            ? "Streaming from local model…"
            : sourceCount
              ? `Grounded in ${sourceCount} portal data slices`
              : "Grounded in live portal data"}
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setSourceCount(null);
            }}
            disabled={isStreaming}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RotateCcw size={13} />
            New chat
          </button>
        )}
      </div>

      {/* Messages / empty state */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-foreground text-background">
              <Brain size={26} />
            </div>
            <h2 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
              What do you want to figure out?
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">
              Answers are grounded in your Beacon Scores, complaints, signals,
              opportunities and the competitor matrix — not generic advice.
            </p>
            <div className="mt-7 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
              {starterPrompts.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => void sendMessage(s.prompt)}
                  className="rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-brand/40 hover:bg-brand/5"
                >
                  <p className="text-[13px] font-semibold text-foreground">{s.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{s.prompt}</p>
                </button>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted">Sources</span>
              {sourceNames.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 pb-4 pr-1">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", message.role === "user" && "justify-end")}
                >
                  {message.role === "user" ? (
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm leading-6 text-background">
                      {message.content}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "max-w-[92%] text-foreground",
                        message.offline &&
                          "rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3"
                      )}
                    >
                      {message.pending ? (
                        <span className="inline-flex items-center gap-2 text-sm text-muted">
                          <Loader2 className="animate-spin" size={14} />
                          Analysing portal sources…
                        </span>
                      ) : (
                        <Markdown content={message.content} />
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="pt-3">
        <div className="rounded-2xl border border-border bg-background shadow-sm transition-colors focus-within:border-brand">
          <textarea
            ref={textareaRef}
            rows={1}
            className="max-h-40 w-full resize-none bg-transparent px-4 pt-3.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted"
            disabled={isStreaming}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow();
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Ask in ${activeMode.label.toLowerCase()} mode — ${activeMode.hint.toLowerCase()}…`}
            value={input}
          />
          <div className="flex items-center justify-between gap-3 px-2.5 pb-2.5 pt-1.5">
            <div className="flex gap-1 overflow-x-auto">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                const active = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    title={option.hint}
                    disabled={isStreaming}
                    onClick={() => setMode(option.value)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted hover:bg-surface hover:text-foreground"
                    )}
                  >
                    <Icon size={13} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Send message"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-foreground text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!input.trim() || isStreaming}
              onClick={() => void sendMessage()}
            >
              {isStreaming ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          Enter to send · Shift+Enter for a new line · runs fully on your local Ollama
        </p>
      </div>
    </div>
  );
}

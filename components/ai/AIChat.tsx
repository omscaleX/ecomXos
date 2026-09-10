"use client";

import * as React from "react";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import type { BrandId, Platform } from "@/types";
import { brandsById } from "@/data/brands";
import { answerQuestion } from "@/lib/ai/aiEngine";
import { getSuggestedQuestions, type AIMessage as AIMessageType } from "@/lib/ai/aiContext";
import { useAppState } from "@/components/providers/AppStateProvider";
import { AIMessage } from "@/components/ai/AIMessage";
import { AISuggestions } from "@/components/ai/AISuggestion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AIChatProps {
  brandId?: BrandId;
  platform?: Platform;
  initialQuestion?: string;
  variant?: "page" | "drawer";
  /** Called when the user clicks an action link (drawer closes itself). */
  onNavigate?: () => void;
  className?: string;
}

let messageCounter = 0;
const nextId = () => `m-${++messageCounter}`;

/**
 * Chat UI shared by the /ai page and the context-aware drawer. All answers
 * come from the deterministic engine in lib/ai using the same data and
 * calculations as the dashboards.
 */
export function AIChat({ brandId, platform, initialQuestion, variant = "page", onNavigate, className }: AIChatProps) {
  const { currentUser, targets, tasks, today } = useAppState();
  const brand = brandId ? brandsById[brandId] : undefined;
  const [messages, setMessages] = React.useState<AIMessageType[]>([]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timer = React.useRef<number | null>(null);

  const suggestions = React.useMemo(() => getSuggestedQuestions(currentUser, brand), [currentUser, brand]);

  const ask = React.useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || thinking) return;
      const userMessage: AIMessageType = { id: nextId(), role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setThinking(true);
      const history = [...messages, userMessage];
      timer.current = window.setTimeout(() => {
        const answer = answerQuestion(trimmed, {
          user: currentUser,
          brandId,
          platform,
          targets,
          tasks,
          history,
          today,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: answer.content,
            actions: answer.actions,
            subjectBrandId: answer.subjectBrandId,
            subjectUserId: answer.subjectUserId,
          },
        ]);
        setThinking(false);
      }, 450);
    },
    [thinking, messages, currentUser, brandId, platform, targets, tasks, today],
  );

  // Reset the conversation when the user or brand context changes.
  const contextKey = `${currentUser.id}:${brandId ?? ""}`;
  const lastKey = React.useRef(contextKey);
  React.useEffect(() => {
    if (lastKey.current !== contextKey) {
      lastKey.current = contextKey;
      setMessages([]);
      setThinking(false);
    }
  }, [contextKey]);

  // Ask the initial question once, if provided.
  const askedInitial = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (initialQuestion && askedInitial.current !== initialQuestion) {
      askedInitial.current = initialQuestion;
      ask(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  React.useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const reset = () => {
    setMessages([]);
    setThinking(false);
    inputRef.current?.focus();
  };

  const intro = brand
    ? `I'm looking at ${brand.name}. What would you like to know?`
    : "How can I help?";

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700" aria-hidden>
            <Sparkles className="size-4" />
          </span>
          <div className="space-y-3">
            <div className="inline-block rounded-lg border bg-card px-3.5 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">Agency AI</p>
              <p className="text-sm">{intro}</p>
            </div>
            {messages.length === 0 && <AISuggestions questions={suggestions} onSelect={ask} />}
          </div>
        </div>

        {messages.map((m) => (
          <AIMessage key={m.id} message={m} onAction={onNavigate} />
        ))}

        {thinking && (
          <div className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700" aria-hidden>
              <Sparkles className="size-4" />
            </span>
            <div className="inline-flex items-center gap-1 rounded-lg border bg-card px-3.5 py-3" aria-live="polite" aria-label="Agency AI is thinking">
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {messages.length > 0 && !thinking && variant === "page" && (
          <AISuggestions questions={suggestions.slice(0, 4)} onSelect={ask} className="pl-11" />
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t bg-background p-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        {messages.length > 0 && (
          <Button type="button" variant="ghost" size="icon" onClick={reset} aria-label="Start a new conversation">
            <RotateCcw />
          </Button>
        )}
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          aria-label="Ask Agency AI"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || thinking} aria-label="Send">
          <ArrowUp />
        </Button>
      </form>
    </div>
  );
}

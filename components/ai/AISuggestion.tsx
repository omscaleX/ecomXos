"use client";

import { cn } from "@/lib/utils";

/** Clickable suggested question chips. */
export function AISuggestions({
  questions,
  onSelect,
  className,
  disabled,
}: {
  questions: string[];
  onSelect: (question: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(q)}
          className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50 cursor-pointer"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

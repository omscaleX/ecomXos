"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { AIMessage as AIMessageType } from "@/lib/ai/aiContext";
import { useCurrentUser } from "@/components/providers/AppStateProvider";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Renders **bold** segments inside a line. */
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

/** Minimal markdown: paragraphs, line breaks, "- " bullets and "1. " numbered lists. */
export function AIRichText({ content, className }: { content: string; className?: string }) {
  const blocks = content.split(/\n\n+/);
  return (
    <div className={cn("space-y-2 text-sm leading-relaxed", className)}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isBullets = lines.every((l) => /^- /.test(l));
        const isNumbered = lines.every((l) => /^\d+\. /.test(l));
        if (isBullets) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}><InlineText text={l.replace(/^- /, "")} /></li>
              ))}
            </ul>
          );
        }
        if (isNumbered) {
          return (
            <ol key={bi} className="list-decimal space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}><InlineText text={l.replace(/^\d+\. /, "")} /></li>
              ))}
            </ol>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <React.Fragment key={li}>
                {li > 0 && <br />}
                <InlineText text={l} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function AIMessage({ message, onAction }: { message: AIMessageType; onAction?: () => void }) {
  const user = useCurrentUser();
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {isUser ? (
        <UserAvatar user={user} size="md" />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700" aria-hidden>
          <Sparkles className="size-4" />
        </span>
      )}
      <div className={cn("max-w-[85%] space-y-2", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-lg px-3.5 py-2.5 text-left",
            isUser ? "bg-primary text-primary-foreground" : "border bg-card",
          )}
        >
          {isUser ? <p className="text-sm">{message.content}</p> : <AIRichText content={message.content} />}
        </div>
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.actions.map((a) => (
              <Button key={`${a.label}-${a.href}`} asChild variant="outline" size="sm" onClick={onAction}>
                <Link href={a.href}>{a.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import type { UserId } from "@/types";
import { dataSources } from "@/data/sources";
import { ROLE_DEFINITIONS, SIDE_BLURB, SIDE_LABEL, rolesForSide, type RoleDefinition, type RoleSide } from "@/lib/roles";
import { getHomePath } from "@/lib/permissions";
import { useAppState } from "@/components/providers/AppStateProvider";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Dummy login screen. Pick your side of the agency, then your role and
 * the person. No password is checked – this is demo only. In production
 * real authentication decides the role and the backend enforces it.
 */
export function LoginScreen() {
  const router = useRouter();
  const { login } = useAppState();
  const [side, setSide] = React.useState<RoleSide>("marketing");
  const [role, setRole] = React.useState<RoleDefinition>(ROLE_DEFINITIONS[0]);
  const [userId, setUserId] = React.useState<UserId>(ROLE_DEFINITIONS[0].users[0].id);
  const [email, setEmail] = React.useState(ROLE_DEFINITIONS[0].users[0].email);
  const [password, setPassword] = React.useState("demo1234");
  const [busy, setBusy] = React.useState(false);

  const selectRole = (r: RoleDefinition) => {
    setRole(r);
    setUserId(r.users[0].id);
    setEmail(r.users[0].email);
  };

  const selectSide = (s: RoleSide) => {
    setSide(s);
    selectRole(rolesForSide(s)[0]);
  };

  const selectUser = (id: UserId, userEmail: string) => {
    setUserId(id);
    setEmail(userEmail);
  };

  const selectedUser = role.users.find((u) => u.id === userId) ?? role.users[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      login(userId);
      router.replace(getHomePath(selectedUser));
    }, 400);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-5">
      {/* Left: what the product does */}
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:col-span-2 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-white/15 text-base font-bold">A</span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Agency OS</span>
            <span className="block text-[11px] text-primary-foreground/70">One place to run the agency</span>
          </span>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold leading-snug">One place for ads, sales and content.</h2>
          <ol className="space-y-2 text-sm text-primary-foreground/80">
            {[
              "Meta ads, Google ads and Shopify sales in one place",
              "Real ROAS = Shopify sales ÷ what you spent on ads",
              "Targets, tasks and who is busy",
              "Ask for scripts, videos and creatives, and track them",
              "Chat with anyone, or start a huddle to talk",
            ].map((line, i) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">{i + 1}</span>
                {line}
              </li>
            ))}
          </ol>
          <ul className="space-y-1.5 text-xs text-primary-foreground/70">
            {dataSources.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden /> {s.name} · Connected (demo)
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/60">Demo build. No real login, no real data.</p>
      </aside>

      {/* Right: sign-in */}
      <main className="flex items-center justify-center px-4 py-10 lg:col-span-3 lg:px-12">
        <form onSubmit={submit} className="w-full max-w-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Sign in to Agency OS</h1>
              <p className="text-sm text-muted-foreground">Pick your team and your job. What you see depends on it.</p>
            </div>
            <Badge variant="neutral">Demo Data</Badge>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-muted-foreground">Which team are you on?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["marketing", "content"] as RoleSide[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectSide(s)}
                  aria-pressed={side === s}
                  className={cn(
                    "rounded-lg border bg-card p-3 text-left transition-colors cursor-pointer hover:border-primary/40",
                    side === s && "border-primary ring-2 ring-primary/20",
                  )}
                >
                  <span className="block text-sm font-semibold">{SIDE_LABEL[s]}</span>
                  <span className="block text-xs text-muted-foreground">{SIDE_BLURB[s]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-muted-foreground">What is your job?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {rolesForSide(side).map((r) => {
                const active = r.role === role.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => selectRole(r)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors cursor-pointer hover:border-primary/40",
                      active && "border-primary ring-2 ring-primary/20",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{r.label}</span>
                      <span className={cn("flex size-5 items-center justify-center rounded-full border", active ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                        {active && <Check className="size-3" />}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {r.canSee.slice(0, 3).map((c) => (
                        <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</span>
                      ))}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {r.users.map((u) => (
                        <UserAvatar key={u.id} user={u} size="sm" />
                      ))}
                      <span className="text-xs text-muted-foreground">{r.users.map((u) => u.name).join(" · ")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {role.users.length > 1 && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-muted-foreground">Who are you?</legend>
              <div className="flex flex-wrap gap-2">
                {role.users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u.id, u.email)}
                    aria-pressed={u.id === userId}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm cursor-pointer hover:border-primary/40",
                      u.id === userId && "border-primary ring-2 ring-primary/20",
                    )}
                  >
                    <UserAvatar user={u} size="sm" /> {u.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> Demo login. Any password works. Real sign-in comes with the backend.
            </p>
            <Button type="submit" size="lg" disabled={busy} className="sm:min-w-56">
              {busy ? "Signing in…" : (
                <>
                  <UserAvatar user={selectedUser} size="sm" className="bg-white/20 text-white" />
                  Continue as {selectedUser.name} <ArrowRight />
                </>
              )}
            </Button>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-violet-600" /> Tip: after signing in you can switch person from the top right to see the app as someone else.
          </p>
        </form>
      </main>
    </div>
  );
}

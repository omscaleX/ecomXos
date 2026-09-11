"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import type { UserId } from "@/types";
import { dataSources } from "@/data/sources";
import { ROLE_DEFINITIONS, type RoleDefinition } from "@/lib/roles";
import { useAppState } from "@/components/providers/AppStateProvider";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Dummy login screen. Pick a role (and a person for roles with more than
 * one), then continue. No password is checked – this is demo only. In
 * production real authentication decides the role and the backend enforces it.
 */
export function LoginScreen() {
  const router = useRouter();
  const { login } = useAppState();
  const [role, setRole] = React.useState<RoleDefinition>(ROLE_DEFINITIONS[0]);
  const [userId, setUserId] = React.useState<UserId>(ROLE_DEFINITIONS[0].users[0].id);
  const [email, setEmail] = React.useState("bhupes@agency.com");
  const [password, setPassword] = React.useState("demo1234");
  const [busy, setBusy] = React.useState(false);

  const selectRole = (r: RoleDefinition) => {
    setRole(r);
    setUserId(r.users[0].id);
    setEmail(`${r.users[0].name.toLowerCase()}@agency.com`);
  };
  const selectUser = (id: UserId, name: string) => {
    setUserId(id);
    setEmail(`${name.toLowerCase()}@agency.com`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      login(userId);
      router.replace("/dashboard");
    }, 400);
  };

  const selectedUser = role.users.find((u) => u.id === userId) ?? role.users[0];

  return (
    <div className="grid min-h-screen lg:grid-cols-5">
      {/* Left: product story */}
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:col-span-2 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-white/15 text-base font-bold">A</span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Agency OS</span>
            <span className="block text-[11px] text-primary-foreground/70">Marketing operations</span>
          </span>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold leading-snug">One operating system for the whole agency.</h2>
          <ol className="space-y-2 text-sm text-primary-foreground/80">
            {["Meta Ads + Google Ads + Shopify in one place", "Actual ROAS = Shopify Net Sales ÷ Total Ad Spend", "Targets, tasks and team workload", "Ask Agency AI anything about the numbers"].map((line, i) => (
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
        <form onSubmit={submit} className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Sign in to Agency OS</h1>
              <p className="text-sm text-muted-foreground">Choose your role. What you see after signing in depends on it.</p>
            </div>
            <Badge variant="neutral">Demo Data</Badge>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-muted-foreground">Role</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLE_DEFINITIONS.map((r) => {
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
              <legend className="text-xs font-medium text-muted-foreground">Sign in as</legend>
              <div className="flex flex-wrap gap-2">
                {role.users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u.id, u.name)}
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
              <Lock className="size-3.5" /> Demo login – any password works. Real authentication will be added with the backend.
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
            <Sparkles className="size-3.5 text-violet-600" /> Tip: after signing in you can still switch user from the top-right to demo other roles.
          </p>
        </form>
      </main>
    </div>
  );
}

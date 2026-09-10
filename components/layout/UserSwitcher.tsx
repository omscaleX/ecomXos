"use client";

import { Check, ChevronDown } from "lucide-react";
import { users } from "@/data/users";
import { useAppState } from "@/components/providers/AppStateProvider";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Demo user switcher. Switching users changes the role, sidebar, visible
 * brands, tasks and AI context. This is frontend state only – no login.
 */
export function UserSwitcher() {
  const { currentUser, setCurrentUserId } = useAppState();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 px-2 pr-3" aria-label={`Current user ${currentUser.name}, ${currentUser.roleLabel}. Switch user`}>
          <UserAvatar user={currentUser} size="md" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium">{currentUser.name}</span>
            <span className="block text-[11px] text-muted-foreground">{currentUser.shortRoleLabel}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch user (demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onSelect={() => setCurrentUserId(u.id)}
            className={cn("gap-3 py-2", u.id === currentUser.id && "bg-accent")}
          >
            <UserAvatar user={u} size="md" />
            <span className="flex-1 leading-tight">
              <span className="block text-sm font-medium">{u.name}</span>
              <span className="block text-xs text-muted-foreground">{u.roleLabel}</span>
            </span>
            {u.id === currentUser.id && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

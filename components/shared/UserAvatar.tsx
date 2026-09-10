import type { User } from "@/types";
import { cn } from "@/lib/utils";

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: User;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" && "size-6 text-[10px]",
        size === "md" && "size-8 text-xs",
        size === "lg" && "size-11 text-sm",
        user.avatarClass,
        className,
      )}
    >
      {user.initials}
    </span>
  );
}

export function UserChip({ user, withRole = false }: { user: User; withRole?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <UserAvatar user={user} size="sm" />
      <span className="leading-tight">
        <span className="block text-sm font-medium">{user.name}</span>
        {withRole && <span className="block text-xs text-muted-foreground">{user.shortRoleLabel}</span>}
      </span>
    </span>
  );
}

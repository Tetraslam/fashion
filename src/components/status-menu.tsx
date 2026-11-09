"use client";

import { useOptimistic, useTransition } from "react";
import { setStatus } from "@/app/actions";
import { STATUSES, type Status } from "@/lib/types";
import { STATUS_DOT } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const STATUS_HINT: Record<Status, string> = {
  idea: "saw it, no plans",
  want: "on the list",
  watching: "hunting a deal",
  owned: "in the closet",
  passed: "decided against",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-[12px] text-body",
        status === "passed" && "text-muted-foreground line-through",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {status}
    </span>
  );
}

export function StatusMenu({ id, status, className }: { id: string; status: Status; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, start] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn("outline-none", className)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <StatusBadge status={optimistic} className="cursor-pointer transition-colors hover:border-foreground/40" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuRadioGroup
          value={optimistic}
          onValueChange={(v) =>
            start(async () => {
              setOptimistic(v as Status);
              await setStatus(id, v as Status);
            })
          }
        >
          {STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s} className="gap-3">
              <span className={cn("size-1.5 rounded-full", STATUS_DOT[s])} />
              <span>{s}</span>
              <span className="ml-auto text-xs text-muted-foreground">{STATUS_HINT[s]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

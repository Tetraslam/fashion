"use client";

import { useOptimistic, useTransition } from "react";
import { setStatus } from "@/app/actions";
import { STATUSES, type Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const STATUS_STYLE: Record<Status, string> = {
  idea: "text-muted-foreground border-border",
  want: "text-sand border-sand/40",
  watching: "text-sky border-sky/40",
  owned: "text-moss border-moss/50 bg-moss/10",
  passed: "text-muted-foreground/60 border-border line-through",
};

export const STATUS_HINT: Record<Status, string> = {
  idea: "saw it, no plans",
  want: "on the list",
  watching: "hunting a deal",
  owned: "in the closet",
  passed: "decided against",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center border px-1.5 font-mono text-[10px] tracking-[0.08em] uppercase", STATUS_STYLE[status], className)}>
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
        <StatusBadge status={optimistic} className="cursor-pointer hover:brightness-125" />
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
              <span className="font-mono text-xs uppercase">{s}</span>
              <span className="ml-auto text-xs text-muted-foreground">{STATUS_HINT[s]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

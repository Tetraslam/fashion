"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { ThumbsUpIcon, ThumbsDownIcon, TrashIcon } from "@phosphor-icons/react";
import type { Comment, Target, Vote } from "@/lib/types";
import { addComment, deleteComment, vote } from "@/app/collab-actions";
import { useViewer } from "./viewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const ago = (iso: string) => {
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m < 1) return "just now";
  if (m < 60) return `${Math.floor(m)}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function Feedback({ target, comments, votes }: { target: Target; comments: Comment[]; votes: Vote[] }) {
  const me = useViewer();
  const [optimisticVotes, setVotes] = useOptimistic(votes);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const mine = optimisticVotes.find((v) => v.userId === me?.id)?.value ?? 0;
  const ups = optimisticVotes.filter((v) => v.value === 1);
  const downs = optimisticVotes.filter((v) => v.value === -1);

  const cast = (value: 1 | -1) =>
    start(async () => {
      const next = mine === value ? 0 : value;
      setVotes([...optimisticVotes.filter((v) => v.userId !== me?.id), ...(next ? [{ target, userId: me!.id, userName: me!.name, value: next, at: "" } as Vote] : [])]);
      await vote(target, next);
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <VoteButton active={mine === 1} count={ups.length} names={ups.map((v) => v.userName)} onClick={() => cast(1)} label="into it">
          <ThumbsUpIcon weight={mine === 1 ? "fill" : "regular"} />
        </VoteButton>
        <VoteButton active={mine === -1} count={downs.length} names={downs.map((v) => v.userName)} onClick={() => cast(-1)} label="not it">
          <ThumbsDownIcon weight={mine === -1 ? "fill" : "regular"} />
        </VoteButton>
      </div>
      {comments.length > 0 && (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {comments.map((c) => (
            <li key={c.id} className="group flex gap-3 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted font-serif text-base">{c.userName.trim()[0]?.toUpperCase()}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline gap-2 text-[13px]">
                  <span className="font-medium">{c.userName}</span>
                  <span className="text-muted-foreground">{ago(c.createdAt)}</span>
                  {(c.userId === me?.id || me?.role === "owner") && (
                    <button
                      aria-label="delete comment"
                      onClick={() => start(() => deleteComment(c.id))}
                      className="ml-auto text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[14.5px] leading-relaxed whitespace-pre-line text-body">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-2"
        action={() =>
          start(async () => {
            try {
              await addComment(target, body);
              setBody("");
            } catch (e) {
              toast.error((e as Error).message);
            }
          })
        }
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={me?.role === "owner" ? "note to self, or reply…" : "what do you think? fit, color, would you swap something?"}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘↵ to post</span>
          <Button size="sm" disabled={!body.trim() || pending}>
            post
          </Button>
        </div>
      </form>
    </div>
  );
}

function VoteButton({ active, count, names, onClick, label, children }: { active: boolean; count: number; names: string[]; onClick: () => void; label: string; children: React.ReactNode }) {
  const btn = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] transition-colors [&_svg]:size-4",
        active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/40",
      )}
    >
      {children}
      {label}
      {count > 0 && <span className="font-mono text-[12px] tabular-nums opacity-70">{count}</span>}
    </button>
  );
  if (!names.length) return btn;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent>{names.join(", ")}</TooltipContent>
    </Tooltip>
  );
}

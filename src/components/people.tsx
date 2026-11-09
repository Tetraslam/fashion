"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CopyIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { createInvite, removePerson, revokeInvite, type Person } from "@/app/collab-actions";
import type { Invite } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Section } from "./bits";

const link = (code: string) => `${window.location.origin}/join?code=${code}`;

async function copy(code: string) {
  await navigator.clipboard.writeText(link(code));
  toast.success("invite link copied");
}

export function People({ invites, people, activity }: { invites: Invite[]; people: Person[]; activity: Record<string, number> }) {
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();
  const open = invites.filter((i) => !i.usedBy).reverse();

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <Section title="invites" aside="each link works once">
        <form
          className="flex gap-2"
          action={() =>
            start(async () => {
              const code = await createInvite(label || "a friend");
              setLabel("");
              await copy(code);
            })
          }
        >
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="who's it for?" className="flex-1" />
          <Button disabled={pending}>
            <PlusIcon /> make link
          </Button>
        </form>
        {open.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {open.map((i) => (
              <li key={i.code} className="flex items-center gap-3 py-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-serif text-xl leading-tight">{i.label}</span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">/join?code={i.code}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(i.code)}>
                  <CopyIcon /> copy
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="revoke" onClick={() => start(() => revokeInvite(i.code))}>
                  <TrashIcon />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No unused invites. Make one, it gets copied to your clipboard.</p>
        )}
      </Section>
      <Section title="people" aside={`${people.length} account${people.length === 1 ? "" : "s"}`}>
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted font-serif text-lg">{p.name.trim()[0]?.toUpperCase()}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[14.5px]">
                  {p.name} {p.owner && <span className="ml-1 rounded-full bg-foreground px-2 py-0.5 text-[11px] text-background">owner</span>}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {p.email} · joined {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {activity[p.id] ? ` · ${activity[p.id]} comments` : ""}
                </span>
              </div>
              {!p.owner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (!confirm(`remove ${p.name}? they'll be signed out and lose access. their comments stay.`)) return;
                    start(() => removePerson(p.id));
                  }}
                >
                  remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

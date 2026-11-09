"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryStates, parseAsString } from "nuqs";
import { toast } from "sonner";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { resolveSuggestion } from "@/app/collab-actions";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "@/lib/types";

export function SuggestionActions({ id, kind, url }: { id: string; kind: Suggestion["kind"]; url?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [, set] = useQueryStates({ add: parseAsString, sug: parseAsString });
  const accept = () => {
    // Plain links need a category, so finish them in the add dialog.
    if (kind === "link" && url) return set({ add: url, sug: id });
    start(async () => {
      const r = await resolveSuggestion(id, "accept");
      toast.success(kind === "fit" ? "fit added to the lookbook" : "added to the closet as want");
      if (r?.href) router.push(r.href);
    });
  };
  return (
    <div className="flex shrink-0 gap-2">
      <Button onClick={accept} disabled={pending}>
        <CheckIcon /> {kind === "fit" ? "add fit" : "add"}
      </Button>
      <Button variant="outline" disabled={pending} onClick={() => start(async () => void (await resolveSuggestion(id, "dismiss")))}>
        <XIcon /> pass
      </Button>
    </div>
  );
}

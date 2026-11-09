"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString } from "nuqs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LinkIcon, SpinnerIcon } from "@phosphor-icons/react";
import { addFromUrl } from "@/app/actions";
import { CATEGORIES, STATUSES, type Category, type Status } from "@/lib/types";
import { ShaderZone } from "./shader-zone";

const draggedUrl = (dt: DataTransfer) =>
  dt.getData("text/uri-list").split("\n").find((l) => l && !l.startsWith("#")) || dt.getData("text/plain");

function guessCategory(url: string): Category | undefined {
  const u = url.toLowerCase();
  if (/jacket|coat|bomber|parka|outerwear|blazer|vest/.test(u)) return "outerwear";
  if (/jean|denim|pant|trouser|short|cargo/.test(u)) return "bottom";
  if (/boot|shoe|sneaker|footwear|loafer|1460|trainer/.test(u)) return "footwear";
  if (/ring|chain|necklace|bracelet|bandana|belt|hat|cap|bag|wallet|glasses/.test(u)) return "accessory";
  if (/t-shirt|tee|shirt|hoodie|sweat|knit|top/.test(u)) return "top";
}

export function AddItemDialog() {
  const [add, setAdd] = useQueryState("add", parseAsString);
  const open = add !== null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && setAdd(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>add a piece</DialogTitle>
          <DialogDescription>Paste or drag in a product link. Photos and price get pulled automatically.</DialogDescription>
        </DialogHeader>
        {open && <AddForm initial={add ?? ""} onDone={() => setAdd(null)} />}
      </DialogContent>
    </Dialog>
  );
}

function AddForm({ initial, onDone }: { initial: string; onDone: () => void }) {
  const [url, setUrl] = useState(initial);
  const [category, setCategory] = useState<Category | "">(guessCategory(initial) ?? "");
  const [status, setStatusV] = useState<Status>("want");
  const [pending, start] = useTransition();
  const router = useRouter();
  const valid = /^https?:\/\/\S+\.\S+/.test(url.trim());

  const submit = () =>
    start(async () => {
      if (!category) return;
      try {
        const r = await addFromUrl({ url: url.trim(), category, status });
        toast.success(r.existed ? "already in the closet" : "added");
        onDone();
        router.push(`/pieces/${r.id}`);
      } catch (e) {
        toast.error(`couldn't add: ${(e as Error).message}`);
      }
    });

  return (
    <div className="flex flex-col gap-4">
      <ShaderZone
        className="h-28"
        accept={(dt) => dt.types.includes("text/uri-list") || dt.types.includes("text/plain")}
        onDropData={(dt) => {
          const u = draggedUrl(dt).trim();
          if (!u) return;
          setUrl(u);
          setCategory((c) => c || guessCategory(u) || "");
        }}
      >
        <div className="flex size-full flex-col items-center justify-center gap-2 text-center">
          <LinkIcon className="size-6 text-muted-foreground" />
          <span className="text-sm text-body">drop a link from another tab here</span>
        </div>
      </ShaderZone>
      <Input
        autoFocus
        value={url}
        placeholder="https://…"
        onChange={(e) => {
          setUrl(e.target.value);
          setCategory((c) => c || guessCategory(e.target.value) || "");
        }}
      />
      <div className="flex flex-col gap-2">
        <span className="label">category</span>
        <ToggleGroup type="single" variant="outline" value={category} onValueChange={(v) => setCategory(v as Category)} className="flex-wrap">
          {CATEGORIES.map((c) => (
            <ToggleGroupItem key={c} value={c} className="text-[13px]">
              {c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <span className="label">status</span>
        <ToggleGroup type="single" variant="outline" value={status} onValueChange={(v) => v && setStatusV(v as Status)} className="flex-wrap">
          {STATUSES.filter((s) => s !== "passed").map((s) => (
            <ToggleGroupItem key={s} value={s} className="text-[13px]">
              {s}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <Button onClick={submit} disabled={!valid || !category || pending} className="h-9">
        {pending ? (
          <>
            <SpinnerIcon className="animate-spin" /> scraping…
          </>
        ) : (
          "add to closet"
        )}
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString } from "nuqs";
import { toast } from "sonner";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ArrowSquareOutIcon, LinkIcon, MagnifyingGlassIcon, PlusIcon, TagIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { checkAllMarkets } from "@/app/actions";
import { SECTIONS } from "@/lib/sections";
import type { BrandStance, Status } from "@/lib/types";

const EVENT = "palette:open";
export const openPalette = () => window.dispatchEvent(new Event(EVENT));

type Props = {
  items: { id: string; brand: string; name: string; status: Status; image?: string }[];
  outfits: { id: string; name: string; palette: string[] }[];
  brands: { name: string; slug: string; stance: BrandStance }[];
};

export function PaletteClient({ items, outfits, brands }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const [, setAdd] = useQueryState("add", parseAsString);
  const [pending, start] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };
  const isUrl = /^https?:\/\/\S+\.\S+/.test(q.trim());

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-xl" title="Closet" description="Search the closet">
      <Command>
      <CommandInput placeholder="find a piece, fit, brand… or paste a product link" value={q} onValueChange={setQ} />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>nothing here. try grailed?</CommandEmpty>
        {q.trim() && (
          <CommandGroup heading="actions">
            {isUrl ? (
              <CommandItem
                value={`add ${q}`}
                onSelect={() => {
                  setOpen(false);
                  setAdd(q.trim());
                  setQ("");
                }}
              >
                <LinkIcon />
                add this link to the closet
              </CommandItem>
            ) : (
              <CommandItem value={`grailed ${q}`} onSelect={() => go(`/grailed?q=${encodeURIComponent(q.trim())}`)}>
                <MagnifyingGlassIcon />
                search grailed for “{q.trim()}”
              </CommandItem>
            )}
          </CommandGroup>
        )}
        <CommandGroup heading="go">
          {SECTIONS.map((s) => (
            <CommandItem key={s.href} value={`go ${s.label} ${s.hint}`} onSelect={() => go(s.href)}>
              <span>{s.label}</span>
              <span className="text-muted-foreground">{s.hint}</span>
            </CommandItem>
          ))}
          <CommandItem
            value="add item link url new piece"
            onSelect={() => {
              setOpen(false);
              setAdd("");
            }}
          >
            <PlusIcon />
            add a piece from a link
          </CommandItem>
          <CommandItem
            value="check grailed prices deals refresh market"
            disabled={pending}
            onSelect={() =>
              start(async () => {
                setOpen(false);
                const id = toast.loading("checking grailed for everything on the list…");
                const r = await checkAllMarkets();
                toast.success(`priced ${r.done}/${r.total} pieces`, { id });
              })
            }
          >
            <ArrowsClockwiseIcon />
            check grailed prices for the want list
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="fits">
          {outfits.map((o) => (
            <CommandItem key={o.id} value={`fit ${o.name}`} onSelect={() => go(`/outfits/${o.id}`)}>
              <span className="flex h-3 w-6 shrink-0 overflow-hidden">
                {o.palette.map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              {o.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="pieces">
          {items.map((i) => (
            <CommandItem key={i.id} value={`piece ${i.brand} ${i.name} ${i.id}`} onSelect={() => go(`/pieces/${i.id}`)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.image ? <img src={i.image} alt="" className="size-6 shrink-0 bg-white object-contain" /> : <TagIcon />}
              <span className="truncate">
                <span className="text-muted-foreground">{i.brand}</span> {i.name}
              </span>
              <CommandShortcut>{i.status}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="brands">
          {brands.map((b) => (
            <CommandItem key={b.slug} value={`brand ${b.name}`} onSelect={() => go(`/brands#${b.slug}`)}>
              <ArrowSquareOutIcon />
              {b.name}
              <CommandShortcut>{b.stance}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}

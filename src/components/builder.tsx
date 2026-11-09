"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryStates, parseAsString, parseAsArrayOf } from "nuqs";
import { toast } from "sonner";
import { TextMorph } from "torph/react";
import { XIcon, ShuffleIcon, FloppyDiskIcon, MagnifyingGlassIcon, PlusIcon, EraserIcon } from "@phosphor-icons/react";
import { CATEGORIES, type Category, type Item, type Outfit, type Status } from "@/lib/types";
import { money } from "@/lib/wardrobe";
import { saveOutfit } from "@/app/actions";
import { ShaderZone } from "./shader-zone";
import { ItemPhoto } from "./item-card";
import { StatusBadge } from "./status-menu";
import { Chip } from "./bits";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const MIME = "application/x-closet-item";
const SLOT_KEYS = { outerwear: "o", top: "t", bottom: "b", footwear: "f" } as const;
const LABEL: Record<Category, string> = { outerwear: "outer layer", top: "top", bottom: "bottom", footwear: "shoes", accessory: "extras" };

const slotParams = {
  edit: parseAsString,
  o: parseAsString,
  t: parseAsString,
  b: parseAsString,
  f: parseAsString,
  a: parseAsArrayOf(parseAsString).withDefault([]),
};

export function Builder({ items, outfits, costs }: { items: Item[]; outfits: Outfit[]; costs: Record<string, number | null> }) {
  const [s, set] = useQueryStates(slotParams);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const editing = s.edit ? outfits.find((o) => o.id === s.edit) : undefined;
  const [name, setName] = useState(editing?.name ?? "");
  const [vibe, setVibe] = useState(editing?.vibe ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();

  // Opening /builder?edit=<fit> loads that fit's pieces into the slots once.
  const empty = !s.o && !s.t && !s.b && !s.f && !s.a.length;
  useEffect(() => {
    if (!editing || !empty) return;
    const patch: Partial<Record<"o" | "t" | "b" | "f", string>> & { a: string[] } = { a: [] };
    for (const id of editing.itemIds) {
      const it = byId.get(id);
      if (!it) continue;
      if (it.category === "accessory") patch.a.push(id);
      else patch[SLOT_KEYS[it.category]] ??= id;
    }
    set(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  const slotted: Item[] = [s.o, s.t, s.b, s.f, ...s.a].map((id) => (id ? byId.get(id) : undefined)).filter(Boolean) as Item[];
  const put = (item: Item) => {
    if (item.category === "accessory") {
      if (!s.a.includes(item.id)) set({ a: [...s.a, item.id].slice(-3) });
    } else set({ [SLOT_KEYS[item.category]]: item.id });
  };
  const clear = (cat: Category, id?: string) =>
    cat === "accessory" ? set({ a: s.a.filter((x) => x !== id) }) : set({ [SLOT_KEYS[cat]]: null });

  const roll = (pool: Status[]) => {
    const pick = (cat: Category) => {
      const c = items.filter((i) => i.category === cat && pool.includes(i.status));
      return c.length ? c[Math.floor(Math.random() * c.length)].id : null;
    };
    const acc = pick("accessory");
    set({ o: pick("outerwear"), t: pick("top"), b: pick("bottom"), f: pick("footwear"), a: acc ? [acc] : [] });
  };

  const palette = slotted.map((i) => i.colors[0]).filter(Boolean);
  const retail = slotted.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const toGo = slotted.filter((i) => i.status !== "owned").reduce((sum, i) => sum + (costs[i.id] ?? 0), 0);
  const owned = slotted.filter((i) => i.status === "owned").length;

  const save = () =>
    start(async () => {
      if (!slotted.length) {
        toast.error("add some pieces first");
        return;
      }
      const id = await saveOutfit({ id: editing?.id, name: name.trim() || "Untitled fit", vibe: vibe.trim(), itemIds: slotted.map((i) => i.id) });
      toast.success(editing ? "fit updated" : "fit saved");
      router.push(`/outfits/${id}`);
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 border-b border-border pb-6">
          <div className="font-mono text-[13px] tracking-[0.12em] text-signal uppercase">
            builder / {editing ? `editing ${editing.name}` : "new fit"}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this fit"
            className="bg-transparent text-4xl font-bold tracking-[-0.03em] outline-none placeholder:text-muted-foreground/40 md:text-5xl"
          />
          <input
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="One line on the vibe…"
            className="bg-transparent text-lg text-body outline-none placeholder:text-muted-foreground/40"
          />
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button onClick={save} disabled={pending} size="lg">
              <FloppyDiskIcon /> {editing ? "update fit" : "save fit"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => roll(["owned"])}>
              <ShuffleIcon /> roll from what i own
            </Button>
            <Button variant="outline" size="lg" onClick={() => roll(["owned", "want", "watching", "idea"])}>
              <ShuffleIcon /> roll from everything
            </Button>
            <Button variant="ghost" size="lg" onClick={() => set({ o: null, t: null, b: null, f: null, a: null })}>
              <EraserIcon /> clear
            </Button>
          </div>
        </div>

        <div className="flex h-3">
          {(palette.length ? palette : ["#202023"]).map((c, i) => (
            <span key={i} className="flex-1 transition-colors duration-500" style={{ background: c }} />
          ))}
        </div>

        <div className="grid auto-rows-[210px] grid-cols-2 gap-3 md:grid-cols-[1.25fr_1fr_1fr] md:auto-rows-[230px]">
          <Slot cat="outerwear" item={s.o ? byId.get(s.o) : undefined} onDrop={put} onClear={() => clear("outerwear")} byId={byId} className="row-span-2" />
          <Slot cat="top" item={s.t ? byId.get(s.t) : undefined} onDrop={put} onClear={() => clear("top")} byId={byId} />
          <Slot cat="bottom" item={s.b ? byId.get(s.b) : undefined} onDrop={put} onClear={() => clear("bottom")} byId={byId} className="row-span-2" />
          <Slot cat="footwear" item={s.f ? byId.get(s.f) : undefined} onDrop={put} onClear={() => clear("footwear")} byId={byId} />
          <AccessorySlot ids={s.a} byId={byId} onDrop={put} onClear={(id) => clear("accessory", id)} />
        </div>

        <div className="grid grid-cols-3 gap-3 font-mono text-xs">
          <Readout label="owned" value={`${owned}/${slotted.length}`} />
          <Readout label="retail" value={money(retail)} />
          <Readout label="to complete" value={toGo ? `~${money(toGo)}` : owned === slotted.length && slotted.length ? "wearable" : "–"} />
        </div>
      </div>

      <Library items={items} onPick={put} selected={new Set(slotted.map((i) => i.id))} />
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border border-border p-3">
      <span className="label">{label}</span>
      <TextMorph as="span" className="text-lg text-foreground">
        {value}
      </TextMorph>
    </div>
  );
}

function readItem(dt: DataTransfer, byId: Map<string, Item>) {
  return byId.get(dt.getData(MIME));
}

function Slot({
  cat,
  item,
  onDrop,
  onClear,
  byId,
  className,
}: {
  cat: Category;
  item?: Item;
  onDrop: (i: Item) => void;
  onClear: () => void;
  byId: Map<string, Item>;
  className?: string;
}) {
  return (
    <ShaderZone
      className={className}
      accept={(dt) => dt.types.includes(MIME)}
      onDropData={(dt) => {
        const it = readItem(dt, byId);
        if (!it) return;
        if (it.category !== cat) toast(`that's ${it.category}, put it in its slot`);
        onDrop(it);
      }}
    >
      {item ? (
        <div className="group relative flex size-full flex-col">
          <ItemPhoto item={item} className="m-2 mb-0 flex-1" />
          <div className="flex items-center gap-2 p-2">
            <div className="min-w-0 flex-1">
              <div className="label truncate">{item.brand}</div>
              <div className="truncate text-sm">{item.name}</div>
            </div>
            <StatusBadge status={item.status} />
          </div>
          <button
            onClick={onClear}
            aria-label="remove"
            className="absolute top-3 right-3 bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <XIcon />
          </button>
        </div>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center">
          <PlusIcon className="size-6 text-muted-foreground" />
          <span className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">{LABEL[cat]}</span>
          <span className="text-xs text-muted-foreground/60">drag a piece here</span>
        </div>
      )}
    </ShaderZone>
  );
}

function AccessorySlot({ ids, byId, onDrop, onClear }: { ids: string[]; byId: Map<string, Item>; onDrop: (i: Item) => void; onClear: (id: string) => void }) {
  return (
    <ShaderZone
      className="col-span-2 md:col-span-2"
      accept={(dt) => dt.types.includes(MIME)}
      onDropData={(dt) => {
        const it = readItem(dt, byId);
        if (it) onDrop(it);
      }}
    >
      <div className="flex size-full items-center gap-2 p-2">
        {ids.map((id) => {
          const it = byId.get(id);
          if (!it) return null;
          return (
            <div key={id} className="group relative h-full w-28 shrink-0">
              <ItemPhoto item={it} className="size-full" />
              <button
                onClick={() => onClear(id)}
                aria-label="remove"
                className="absolute top-1 right-1 bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          );
        })}
        <span className="flex-1 text-center font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
          {ids.length ? "+ more extras" : "extras: rings, chains, bandanas"}
        </span>
      </div>
    </ShaderZone>
  );
}

function Library({ items, onPick, selected }: { items: Item[]; onPick: (i: Item) => void; selected: Set<string> }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const shown = items.filter(
    (i) =>
      (!cat || i.category === cat) &&
      (!ownedOnly || i.status === "owned") &&
      (!q || `${i.brand} ${i.name} ${i.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[12px] tracking-[0.12em] uppercase">library</span>
        <span className="text-xs text-muted-foreground">drag, or click to drop in its slot</span>
      </div>
      <InputGroup>
        <InputGroupAddon>
          <MagnifyingGlassIcon />
        </InputGroupAddon>
        <InputGroupInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="search pieces…" />
      </InputGroup>
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)}>
            {c}
          </Chip>
        ))}
        <Chip active={ownedOnly} onClick={() => setOwnedOnly(!ownedOnly)}>
          owned
        </Chip>
      </div>
      <div className="grid grid-cols-3 gap-1.5 overflow-y-auto pr-1 pb-2">
        {shown.map((i) => (
          <button
            key={i.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(MIME, i.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onPick(i)}
            title={`${i.brand} ${i.name}`}
            className={cn(
              "group relative cursor-grab border text-left active:cursor-grabbing",
              selected.has(i.id) ? "border-signal" : "border-border hover:border-foreground/40",
            )}
          >
            <ItemPhoto item={i} className="pointer-events-none aspect-square" />
            {i.status === "owned" && <span className="absolute top-1 left-1 size-1.5 rounded-full bg-moss" />}
            <div className="truncate px-1 py-0.5 text-[10px] text-muted-foreground">{i.name}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}

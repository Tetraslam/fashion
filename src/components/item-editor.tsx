"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TShirtIcon, TrashIcon } from "@phosphor-icons/react";
import { CATEGORIES, type Category, type Item } from "@/lib/types";
import { CATEGORY_PATHS } from "@/lib/grailed-meta";
import { updateItem, deleteItem, logWear } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

// Every field saves on blur/change, straight into data/items.json.
export function ItemEditor({ item }: { item: Item }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const save = (patch: Partial<Item>, quiet = false) =>
    start(async () => {
      await updateItem(item.id, patch);
      if (!quiet) toast.success("saved");
    });
  const onBlurText = (key: "notes" | "grailedQuery", v: string) => v !== (item[key] ?? "") && save({ [key]: v });
  const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="priority" hint="1 = buy next">
          <ToggleGroup
            type="single"
            variant="outline"
            value={item.priority ? String(item.priority) : "none"}
            onValueChange={(v) => v && save({ priority: v === "none" ? undefined : (Number(v) as 1 | 2 | 3) }, true)}
          >
            {["1", "2", "3", "none"].map((p) => (
              <ToggleGroupItem key={p} value={p} className="font-mono text-xs">
                {p}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field label="category">
          <Select value={item.category} onValueChange={(v) => save({ category: v as Category }, true)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="grailed search" hint="what to look for on grailed">
          <Input defaultValue={item.grailedQuery} onBlur={(e) => onBlurText("grailedQuery", e.target.value.trim())} />
        </Field>
        <Field label="grailed category">
          <Select value={item.grailedCategory ?? "any"} onValueChange={(v) => save({ grailedCategory: v === "any" ? undefined : v }, true)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="any">any category</SelectItem>
              {Object.entries(CATEGORY_PATHS).map(([top, subs]) => (
                <SelectGroup key={top}>
                  <SelectLabel>{top}</SelectLabel>
                  <SelectItem value={top}>all {top}</SelectItem>
                  {subs.map((s) => (
                    <SelectItem key={s} value={`${top}.${s}`}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="deal under ($)" hint="flag grailed asks in your size below this">
          <Input
            type="number"
            inputMode="numeric"
            defaultValue={item.maxPrice ?? ""}
            placeholder={item.price ? String(Math.round(item.price * 0.6)) : "e.g. 300"}
            onBlur={(e) => num(e.target.value) !== item.maxPrice && save({ maxPrice: num(e.target.value) })}
          />
        </Field>
        <Field label="style tags" hint="comma separated">
          <Input
            defaultValue={item.tags.join(", ")}
            onBlur={(e) => {
              const tags = e.target.value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
              if (tags.join() !== item.tags.join()) save({ tags });
            }}
          />
        </Field>
      </div>
      {item.status === "owned" && (
        <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-3">
          <Field label="paid ($)">
            <Input
              type="number"
              defaultValue={item.owned?.paid ?? ""}
              onBlur={(e) => num(e.target.value) !== item.owned?.paid && save({ owned: { ...item.owned, paid: num(e.target.value) } })}
            />
          </Field>
          <Field label="size">
            <Input defaultValue={item.owned?.size ?? ""} onBlur={(e) => e.target.value !== (item.owned?.size ?? "") && save({ owned: { ...item.owned, size: e.target.value } })} />
          </Field>
          <Field label="from">
            <Input
              defaultValue={item.owned?.from ?? ""}
              placeholder="grailed, store, gift…"
              onBlur={(e) => e.target.value !== (item.owned?.from ?? "") && save({ owned: { ...item.owned, from: e.target.value } })}
            />
          </Field>
        </div>
      )}
      <Field label="notes">
        <Textarea
          defaultValue={item.notes ?? ""}
          rows={3}
          placeholder="fit notes, sizing advice, where you saw it…"
          onBlur={(e) => onBlurText("notes", e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        {item.status === "owned" && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await logWear(item.id);
                toast.success("wear logged");
              })
            }
          >
            <TShirtIcon /> wore it today
          </Button>
        )}
        <Button
          variant="ghost"
          className="ml-auto text-muted-foreground hover:text-signal"
          onClick={() => {
            if (!confirm(`delete ${item.name}? it'll be removed from every fit.`)) return;
            start(async () => {
              await deleteItem(item.id);
              router.push("/pieces");
            });
          }}
        >
          <TrashIcon /> delete
        </Button>
      </div>
    </div>
  );
}

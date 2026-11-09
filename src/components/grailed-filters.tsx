"use client";

import { useQueryStates, debounce } from "nuqs";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { grailedParams, SORT_KEYS } from "@/lib/grailed-params";
import { CATEGORY_PATHS, CONDITIONS } from "@/lib/grailed-meta";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Chip } from "./bits";

export function GrailedFilters() {
  const [f, set] = useQueryStates(grailedParams, { shallow: false });
  // Any filter change goes back to page 1.
  const update = (patch: Omit<Parameters<typeof set>[0] & object, "page">) => set({ ...patch, page: null });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="max-w-md flex-1">
          <InputGroupAddon>
            <MagnifyingGlassIcon />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            placeholder="designer, model, vibe…"
            value={f.q}
            onChange={(e) => set({ q: e.target.value || null, page: null }, { limitUrlUpdates: debounce(450) })}
            onKeyDown={(e) => e.key === "Enter" && update({ q: f.q || null })}
          />
        </InputGroup>
        <Select value={f.cat ?? "any"} onValueChange={(v) => update({ cat: v === "any" ? null : v })}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-96">
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
        <Input
          type="number"
          placeholder="min $"
          className="w-24"
          defaultValue={f.min ?? ""}
          onBlur={(e) => update({ min: Number(e.target.value) || null })}
        />
        <Input
          type="number"
          placeholder="max $"
          className="w-24"
          defaultValue={f.max ?? ""}
          onBlur={(e) => update({ max: Number(e.target.value) || null })}
        />
        <span className="ml-auto flex items-center gap-1">
          <span className="label mr-1">sort</span>
          <Select value={f.sort} onValueChange={(v) => update({ sort: v as (typeof SORT_KEYS)[number] })} disabled={f.sold}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {{ relevant: "trending", new: "newest", low: "price ↑", high: "price ↓" }[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={f.mine} onClick={() => update({ mine: !f.mine })}>
          my sizes
        </Chip>
        <Chip active={f.sold} onClick={() => update({ sold: !f.sold })}>
          sold comps
        </Chip>
        <span className="mx-1 h-4 w-px bg-border" />
        {Object.entries(CONDITIONS)
          .filter(([k]) => k !== "is_not_specified")
          .map(([k, label]) => (
            <Chip
              key={k}
              active={f.cond.includes(k)}
              onClick={() => update({ cond: f.cond.includes(k) ? f.cond.filter((c) => c !== k) : [...f.cond, k] })}
            >
              {label}
            </Chip>
          ))}
      </div>
    </div>
  );
}

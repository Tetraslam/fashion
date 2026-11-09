"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { MEASURES, type MeasureGroup, type Profile } from "@/lib/types";
import { SIZES } from "@/lib/grailed-meta";
import { updateProfile } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Chip, Section } from "./bits";
import { useIsOwner } from "./viewer";

const MEASURE_HINT: Record<string, string> = {
  chest: "pit to pit",
  length: "collar seam to hem, back",
  shoulders: "seam to seam",
  sleeve_length: "shoulder seam to cuff",
  waist: "straight across, doubled",
  inseam: "crotch to hem",
  leg_opening: "across the hem",
  front_rise: "crotch to top of waistband",
  thigh: "across, just below crotch",
};

const GROUP_HINT: Record<MeasureGroup, string> = {
  outerwear: "Lay your best-fitting jacket flat (the red Has2sons?) and measure it.",
  tops: "Your favorite tee or hoodie, flat.",
  bottoms: "Jeans that fit the way you want new ones to.",
};

function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="grid gap-2 border-b border-border py-4 md:grid-cols-[220px_1fr]">
      <div className="flex flex-col">
        <span className="label">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [p, setP] = useState<Profile>({ ...profile, measurements: profile.measurements ?? {} });
  const [pending, start] = useTransition();
  const owner = useIsOwner();
  const dirty = JSON.stringify(p) !== JSON.stringify({ ...profile, measurements: profile.measurements ?? {} });

  const toggleSize = (key: keyof Profile["sizes"], v: string) => {
    const cur = p.sizes[key] ?? [];
    setP({ ...p, sizes: { ...p.sizes, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } });
  };
  const setMeasure = (g: MeasureGroup, name: string, v: string) => {
    const group = { ...(p.measurements[g] ?? {}) };
    if (v === "") delete group[name];
    else group[name] = Number(v);
    setP({ ...p, measurements: { ...p.measurements, [g]: group } });
  };

  const save = () =>
    start(async () => {
      await updateProfile({ ...p, styles: p.styles.map((x) => x.trim()).filter(Boolean), rules: p.rules.map((x) => x.trim()).filter(Boolean) });
      toast.success("saved");
    });

  return (
    <fieldset disabled={!owner} className="flex flex-col gap-10 disabled:[&_button]:cursor-default">
      <Section title="sizes" aside="pick every size that can work; measurements decide the rest">
        <div>
          <Row label="tops + outerwear" hint="letter sizes on grailed">
            <div className="flex flex-wrap gap-1">
              {SIZES.top.map((s) => (
                <Chip key={s} active={p.sizes.top?.includes(s)} onClick={() => toggleSize("top", s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </Row>
          <Row label="waist" hint="tagged waist, inches">
            <div className="flex flex-wrap gap-1">
              {SIZES.bottomWaist.map((s) => (
                <Chip key={s} active={p.sizes.bottomWaist?.includes(s)} onClick={() => toggleSize("bottomWaist", s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </Row>
          <Row label="shoes" hint="US men's">
            <div className="flex flex-wrap gap-1">
              {SIZES.shoe.map((s) => (
                <Chip key={s} active={p.sizes.shoe?.includes(s)} onClick={() => toggleSize("shoe", s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </Row>
        </div>
      </Section>

      <Section title="reference measurements" aside="inches, measured flat">
        <div className="grid gap-6 lg:grid-cols-3">
          {(Object.keys(MEASURES) as MeasureGroup[]).map((g) => (
            <div key={g} className="flex flex-col gap-3 rounded-sm border border-border bg-card p-5">
              <div className="flex flex-col gap-1">
                <span className="font-serif text-2xl capitalize">{g}</span>
                <span className="text-xs text-muted-foreground">{GROUP_HINT[g]}</span>
              </div>
              {MEASURES[g].map((m) => (
                <label key={m} className="grid grid-cols-[1fr_90px] items-center gap-3">
                  <span className="flex flex-col">
                    <span className="text-sm">{m.replace("_", " ")}</span>
                    <span className="text-[11px] text-muted-foreground">{MEASURE_HINT[m]}</span>
                  </span>
                  <Input
                    type="number"
                    step="0.25"
                    inputMode="decimal"
                    value={p.measurements[g]?.[m] ?? ""}
                    onChange={(e) => setMeasure(g, m, e.target.value)}
                    className="text-right font-mono"
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section title="you">
        <div>
          <Row label="height">
            <Input value={p.height ?? ""} onChange={(e) => setP({ ...p, height: e.target.value })} placeholder={`e.g. 6'2"`} className="max-w-xs" />
          </Row>
          <Row label="build">
            <Input value={p.build ?? ""} onChange={(e) => setP({ ...p, build: e.target.value })} placeholder="slim, long arms, broad shoulders…" className="max-w-md" />
          </Row>
          <Row label="monthly budget" hint="spreads the buy queue over months">
            <Input
              type="number"
              value={p.budget.monthly ?? ""}
              onChange={(e) => setP({ ...p, budget: { ...p.budget, monthly: e.target.value ? Number(e.target.value) : undefined } })}
              placeholder="300"
              className="max-w-40"
            />
          </Row>
          <Row label="styles" hint="one per line">
            <Textarea value={p.styles.join("\n")} onChange={(e) => setP({ ...p, styles: e.target.value.split("\n") })} rows={4} className="max-w-md" />
          </Row>
          <Row label="fit rules" hint="one per line, shown on the lookbook">
            <Textarea value={p.rules.join("\n")} onChange={(e) => setP({ ...p, rules: e.target.value.split("\n") })} rows={4} className="max-w-2xl" />
          </Row>
        </div>
      </Section>

      {owner && (
        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={save} disabled={!dirty || pending} className="shadow-lg">
            <FloppyDiskIcon /> {dirty ? "save" : "saved"}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

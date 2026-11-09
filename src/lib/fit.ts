// Compare a listing's flat measurements with the profile's reference garment.
import type { Profile, MeasureGroup } from "./types";

// How far off (inches) still reads as "fits". Length-type measurements matter
// most on a tall frame, so being short there is flagged even inside tolerance.
const TOL: Record<string, number> = {
  chest: 1,
  length: 1.5,
  shoulders: 1,
  sleeve_length: 1,
  waist: 1,
  inseam: 1.5,
  leg_opening: 1,
  front_rise: 1,
  thigh: 1,
};
const LENGTHS = new Set(["length", "sleeve_length", "inseam"]);

export type FitRow = { name: string; label: string; theirs: number; mine?: number; delta?: number; verdict: "ok" | "short" | "long" | "tight" | "loose" | "n/a" };

export function groupFor(categoryPath?: string): MeasureGroup | undefined {
  const top = categoryPath?.split(".")[0];
  return top === "outerwear" || top === "tops" || top === "bottoms" ? top : undefined;
}

export function fitCheck(
  measurements: { name: string; label: string; inches: number }[],
  categoryPath: string | undefined,
  profile: Profile,
) {
  const group = groupFor(categoryPath);
  const ref = group ? profile.measurements?.[group] ?? {} : {};
  const rows: FitRow[] = measurements.map((m) => {
    const mine = ref[m.name];
    if (mine == null) return { ...m, theirs: m.inches, verdict: "n/a" };
    const delta = +(m.inches - mine).toFixed(1);
    const tol = TOL[m.name] ?? 1;
    const verdict: FitRow["verdict"] =
      Math.abs(delta) <= tol && !(LENGTHS.has(m.name) && delta < -tol / 2)
        ? "ok"
        : LENGTHS.has(m.name)
          ? delta < 0 ? "short" : "long"
          : delta < 0 ? "tight" : "loose";
    return { name: m.name, label: m.label, theirs: m.inches, mine, delta, verdict };
  });
  const scored = rows.filter((r) => r.verdict !== "n/a");
  const score = scored.length ? scored.filter((r) => r.verdict === "ok").length / scored.length : undefined;
  return { rows, score, group };
}

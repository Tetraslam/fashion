import { Suspense } from "react";
import type { Metadata } from "next";
import { getData } from "@/lib/data";
import { Builder } from "@/components/builder";
import { GridSkeleton } from "@/components/skeletons";
import { expectedCost } from "@/lib/wardrobe";

export const metadata: Metadata = { title: "builder" };

export default function BuilderPage() {
  return (
    <Suspense fallback={<GridSkeleton header count={6} />}>
      <BuilderData />
    </Suspense>
  );
}

async function BuilderData() {
  const { items, outfits, watchById } = await getData();
  const costs = Object.fromEntries(items.map((i) => [i.id, expectedCost(i, watchById.get(i.id)) ?? null]));
  return <Builder items={items.filter((i) => i.status !== "passed")} outfits={outfits} costs={costs} />;
}

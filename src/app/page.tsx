import { Suspense } from "react";
import { getData } from "@/lib/data";
import { outfitProgress, expectedCost } from "@/lib/wardrobe";
import { Lookbook, type OutfitView } from "@/components/lookbook";
import { GridSkeleton } from "@/components/skeletons";

export default function Home() {
  return (
    <Suspense fallback={<GridSkeleton header />}>
      <LookbookData />
    </Suspense>
  );
}

async function LookbookData() {
  const { outfits, byId, watchById, profile, comments, votes } = await getData();
  const views: OutfitView[] = outfits.map((o, i) => {
    const { items, owned, missing } = outfitProgress(o, byId);
    const toComplete = missing.reduce((sum, it) => sum + (expectedCost(it, watchById.get(it.id)) ?? 0), 0);
    return {
      ...o,
      num: String(i + 1).padStart(2, "0"),
      pieces: items.map((it) => ({ id: it.id, brand: it.brand, name: it.name, image: it.images[0], status: it.status, category: it.category })),
      owned,
      toComplete,
      unknownCost: missing.some((it) => expectedCost(it, watchById.get(it.id)) == null),
      ups: votes.filter((v) => v.target.type === "outfit" && v.target.id === o.id && v.value === 1).length,
      downs: votes.filter((v) => v.target.type === "outfit" && v.target.id === o.id && v.value === -1).length,
      commentCount: comments.filter((c) => c.target.type === "outfit" && c.target.id === o.id).length,
    };
  });
  return <Lookbook outfits={views} styles={profile.styles} rule={profile.rules[0]} />;
}

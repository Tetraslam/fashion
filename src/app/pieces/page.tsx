import { Suspense } from "react";
import type { Metadata } from "next";
import { getData } from "@/lib/data";
import { Pieces } from "@/components/pieces";
import { GridSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "pieces" };

export default function PiecesPage() {
  return (
    <Suspense fallback={<GridSkeleton header count={12} />}>
      <PiecesData />
    </Suspense>
  );
}

async function PiecesData() {
  const { items, watches, outfits } = await getData();
  const usage = Object.fromEntries(items.map((i) => [i.id, outfits.filter((o) => o.itemIds.includes(i.id)).length]));
  return <Pieces items={items} watches={watches} usage={usage} />;
}

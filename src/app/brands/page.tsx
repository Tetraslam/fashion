import { Suspense } from "react";
import type { Metadata } from "next";
import { getData } from "@/lib/data";
import { BRAND_STANCES } from "@/lib/types";
import { PageHeader, Section } from "@/components/bits";
import { BrandCard } from "@/components/brand-card";
import { GridSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "brands" };

const TITLES = { love: "love", curious: "curious about", nope: "not for me" } as const;

export default function BrandsPage() {
  return (
    <Suspense fallback={<GridSkeleton header />}>
      <Brands />
    </Suspense>
  );
}

async function Brands() {
  const { brands, items } = await getData();
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        kicker={`brands / ${brands.length}`}
        title="Who makes it"
        sub="Mark brands you love, are curious about, or are done with. Loved brands are the ones to watch on Grailed."
      />
      {BRAND_STANCES.map((stance) => {
        const list = brands
          .filter((b) => b.stance === stance)
          .sort((a, b) => a.tier.length - b.tier.length || a.name.localeCompare(b.name));
        if (!list.length) return null;
        return (
          <Section key={stance} title={TITLES[stance]} aside={`${list.length}`}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((b) => {
                const mine = items.filter((i) => i.brand === b.name);
                return (
                  <BrandCard
                    key={b.slug}
                    brand={b}
                    counts={{ owned: mine.filter((i) => i.status === "owned").length, total: mine.length }}
                    images={mine.flatMap((i) => i.images.slice(0, 1)).slice(0, 4)}
                  />
                );
              })}
            </div>
          </Section>
        );
      })}
    </div>
  );
}

import { getData } from "@/lib/data";
import { PaletteClient } from "./palette-client";

export async function Palette() {
  const { items, outfits, brands } = await getData();
  return (
    <PaletteClient
      items={items.map((i) => ({ id: i.id, brand: i.brand, name: i.name, status: i.status, image: i.images[0] }))}
      outfits={outfits.map((o) => ({ id: o.id, name: o.name, palette: o.palette }))}
      brands={brands.map((b) => ({ name: b.name, slug: b.slug, stance: b.stance }))}
    />
  );
}

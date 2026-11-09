import { connection } from "next/server";
import { getViewer } from "@/lib/session";
import { readAll } from "@/lib/store";
import { PaletteClient } from "./palette-client";

export async function Palette() {
  await connection();
  if (!(await getViewer())) return null;
  const { items, outfits, brands } = await readAll();
  return (
    <PaletteClient
      items={items.map((i) => ({ id: i.id, brand: i.brand, name: i.name, status: i.status, image: i.images[0] }))}
      outfits={outfits.map((o) => ({ id: o.id, name: o.name, palette: o.palette }))}
      brands={brands.map((b) => ({ name: b.name, slug: b.slug, stance: b.stance }))}
    />
  );
}

export const SECTIONS = [
  { href: "/", label: "Lookbook", hint: "outfits" },
  { href: "/pieces", label: "Pieces", hint: "every item" },
  { href: "/builder", label: "Builder", hint: "make a fit" },
  { href: "/grailed", label: "Grailed", hint: "hunt used" },
  { href: "/plan", label: "Plan", hint: "what to buy" },
  { href: "/brands", label: "Brands", hint: "who's good" },
  { href: "/me", label: "Me", hint: "sizes + fit" },
  { href: "/guide", label: "Guide", hint: "how this works" },
] as const;

export function section(pathname: string) {
  return [...SECTIONS].reverse().find((s) => (s.href === "/" ? pathname === "/" || pathname.startsWith("/outfits") : pathname.startsWith(s.href)));
}

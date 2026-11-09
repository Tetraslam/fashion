export const SECTIONS = [
  { href: "/", label: "Lookbook", hint: "outfits", owner: false },
  { href: "/pieces", label: "Pieces", hint: "every item", owner: false },
  { href: "/builder", label: "Builder", hint: "make a fit", owner: false },
  { href: "/grailed", label: "Grailed", hint: "hunt used", owner: false },
  { href: "/plan", label: "Plan", hint: "what to buy", owner: false },
  { href: "/brands", label: "Brands", hint: "who's good", owner: false },
  { href: "/me", label: "Me", hint: "sizes + fit", owner: false },
  { href: "/inbox", label: "Inbox", hint: "friends' feedback", owner: true },
  { href: "/guide", label: "Guide", hint: "how this works", owner: false },
] as const;

export type Section = (typeof SECTIONS)[number];

export function section(pathname: string) {
  return [...SECTIONS].reverse().find((s) => (s.href === "/" ? pathname === "/" || pathname.startsWith("/outfits") : pathname.startsWith(s.href)));
}

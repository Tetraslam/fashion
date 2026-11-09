export const SECTIONS = [
  { href: "/", label: "lookbook", hint: "outfits" },
  { href: "/pieces", label: "pieces", hint: "every item" },
  { href: "/builder", label: "builder", hint: "make a fit" },
  { href: "/grailed", label: "grailed", hint: "hunt" },
  { href: "/plan", label: "plan", hint: "what to buy" },
  { href: "/brands", label: "brands", hint: "who's good" },
  { href: "/me", label: "me", hint: "sizes + fit" },
] as const;

export function section(pathname: string) {
  return [...SECTIONS].reverse().find((s) => (s.href === "/" ? pathname === "/" || pathname.startsWith("/outfits") : pathname.startsWith(s.href)));
}

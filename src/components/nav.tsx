"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState, parseAsString } from "nuqs";
import { TextMorph } from "torph/react";
import { SignOutIcon, UsersThreeIcon, LinkIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { openPalette } from "@/components/palette-client";
import { useViewer, type ViewerInfo } from "@/components/viewer";
import { authClient } from "@/lib/auth-client";
import { SECTIONS, section } from "@/lib/sections";

export function Nav() {
  return <NavFrame current={section(usePathname())} viewer={useViewer()} />;
}

// Rendered without a pathname or viewer as the static-shell fallback.
export function NavFrame({ current, viewer }: { current?: ReturnType<typeof section>; viewer?: ViewerInfo }) {
  const owner = viewer?.role === "owner";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-5 md:px-8">
        <Link href="/" className="flex shrink-0 items-baseline gap-1.5 font-serif text-[26px] leading-none">
          <span>Closet</span>
          <TextMorph className="min-w-[6ch] text-muted-foreground italic">{current && viewer ? current.label : ""}</TextMorph>
        </Link>
        {viewer && (
          <>
            <nav className="scrollbar-none -mx-2 flex flex-1 items-center gap-1 overflow-x-auto">
              {SECTIONS.filter((s) => owner || !s.owner).map((s) => {
                const active = current?.href === s.href;
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] whitespace-nowrap transition-colors",
                      active ? "bg-foreground text-background" : "text-body hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={openPalette}
              className="hidden h-9 w-56 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground xl:flex"
            >
              search, {owner ? "add" : "suggest"}, jump
              <Kbd className="ml-auto">⌘K</Kbd>
            </button>
            <UserMenu viewer={viewer} />
          </>
        )}
      </div>
    </header>
  );
}

function UserMenu({ viewer }: { viewer: NonNullable<ViewerInfo> }) {
  const router = useRouter();
  const [, setAdd] = useQueryState("add", parseAsString);
  const owner = viewer.role === "owner";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground font-serif text-lg text-background outline-none hover:bg-brand">
        {viewer.name.trim()[0]?.toUpperCase() ?? "?"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">{viewer.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{owner ? "owner, can edit everything" : "guest, can look, vote, comment, and suggest"}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {owner ? (
          <DropdownMenuItem onSelect={() => router.push("/people")}>
            <UsersThreeIcon /> people + invites
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => setAdd("")}>
            <LinkIcon /> suggest a piece
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={async () => {
            await authClient.signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          <SignOutIcon /> sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

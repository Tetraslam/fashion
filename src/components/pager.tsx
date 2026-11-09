"use client";

import { useQueryState, parseAsInteger } from "nuqs";
import { Button } from "@/components/ui/button";

export function Pager({ page, pages }: { page: number; pages: number }) {
  const [, setPage] = useQueryState("page", parseAsInteger.withOptions({ shallow: false, scroll: true }));
  return (
    <div className="flex items-center justify-center gap-3 pt-4 font-mono text-xs">
      <Button variant="outline" disabled={page <= 0} onClick={() => setPage(page - 1 || null)}>
        ← prev
      </Button>
      <span className="text-muted-foreground">
        {page + 1} / {pages}
      </span>
      <Button variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
        next →
      </Button>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { checkAllMarkets } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function PlanActions() {
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const id = toast.loading("pricing everything on the list against grailed…");
          const r = await checkAllMarkets();
          toast.success(`priced ${r.done}/${r.total}`, { id });
        })
      }
    >
      <ArrowsClockwiseIcon className={pending ? "animate-spin" : ""} /> check all prices
    </Button>
  );
}

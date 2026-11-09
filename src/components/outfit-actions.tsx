"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StarIcon, PencilSimpleIcon, TrashIcon, TShirtIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteOutfit, toggleFavorite, wearOutfit } from "@/app/actions";
import { useIsOwner } from "./viewer";

export function OutfitActions({ id, favorite, wearable }: { id: string; favorite: boolean; wearable: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!useIsOwner()) return null;
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            disabled={pending || !wearable}
            onClick={() =>
              start(async () => {
                await wearOutfit(id);
                toast.success("logged a wear for every piece");
              })
            }
          >
            <TShirtIcon /> wore it today
          </Button>
        </TooltipTrigger>
        <TooltipContent>{wearable ? "adds a wear to each piece (cost per wear)" : "own every piece first"}</TooltipContent>
      </Tooltip>
      <Button variant="outline" size="icon-lg" aria-label="favorite" onClick={() => start(() => toggleFavorite(id))}>
        <StarIcon weight={favorite ? "fill" : "regular"} className={favorite ? "text-warn" : ""} />
      </Button>
      <Button variant="outline" size="icon-lg" asChild aria-label="edit">
        <Link href={`/builder?edit=${id}`}>
          <PencilSimpleIcon />
        </Link>
      </Button>
      <Button
        variant="outline"
        size="icon-lg"
        aria-label="delete"
        className="hover:border-brand hover:text-brand"
        onClick={() => {
          if (!confirm("delete this fit? the pieces stay.")) return;
          start(async () => {
            await deleteOutfit(id);
            router.push("/");
          });
        }}
      >
        <TrashIcon />
      </Button>
    </>
  );
}

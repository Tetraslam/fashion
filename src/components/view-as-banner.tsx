"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon } from "@phosphor-icons/react";
import { stopViewingAs } from "@/app/collab-actions";
import { useViewer } from "./viewer";

export function ViewAsBanner() {
  const me = useViewer();
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!me?.viewingAs) return null;
  return (
    <div className="sticky top-16 z-30 border-b border-brand/30 bg-brand text-brand-foreground">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-5 py-2 text-[13px] md:px-8">
        <EyeIcon className="size-4 shrink-0" />
        <span>
          Viewing as <strong className="font-medium">{me.name}</strong>. This is exactly what they see; it&apos;s read-only, so nothing gets posted as them.
        </span>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await stopViewingAs();
              router.push("/people");
            })
          }
          className="ml-auto shrink-0 rounded-full bg-brand-foreground px-3 py-1 text-brand transition-opacity hover:opacity-90"
        >
          stop
        </button>
      </div>
    </div>
  );
}

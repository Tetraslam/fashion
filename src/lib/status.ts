import type { Status } from "./types";

export const STATUS_DOT: Record<Status, string> = {
  idea: "bg-muted-foreground/40",
  want: "bg-warn",
  watching: "bg-brand",
  owned: "bg-ok",
  passed: "bg-transparent ring-1 ring-muted-foreground/40",
};

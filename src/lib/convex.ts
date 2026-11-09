// How the app talks to Convex. Inside a request, calls carry the visitor's
// session and Convex decides what they may do. Scripts on the owner's machine
// have no session; they call actAsMachine() first and pass CLOSET_MACHINE_KEY,
// which Convex treats as the owner.
import { ConvexHttpClient } from "convex/browser";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

let machine: { client: ConvexHttpClient; key: string } | undefined;

export function actAsMachine() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const key = process.env.CLOSET_MACHINE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_CONVEX_URL and CLOSET_MACHINE_KEY must be set (see .env.local)");
  machine = { client: new ConvexHttpClient(url), key };
}

export const isMachine = () => !!machine;

type Q = FunctionReference<"query">;
type M = FunctionReference<"mutation">;

export async function query<F extends Q>(fn: F, args: FunctionArgs<F>): Promise<FunctionReturnType<F>> {
  if (machine) return machine.client.query(fn, { ...args, machineKey: machine.key });
  const { fetchAuthQuery } = await import("./auth-server");
  return fetchAuthQuery(fn, args);
}

export async function mutation<F extends M>(fn: F, args: FunctionArgs<F>): Promise<FunctionReturnType<F>> {
  if (machine) return machine.client.mutation(fn, { ...args, machineKey: machine.key });
  const { fetchAuthMutation } = await import("./auth-server");
  return fetchAuthMutation(fn, args);
}

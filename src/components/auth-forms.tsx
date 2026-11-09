"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

// Only same-site paths, so ?next= can't bounce people elsewhere.
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-4"
      action={(form) =>
        start(async () => {
          setError(undefined);
          const { error } = await authClient.signIn.email({
            email: String(form.get("email")),
            password: String(form.get("password")),
            rememberMe: true,
          });
          if (error) return setError(error.message ?? "couldn't sign in");
          router.push(safeNext(params.get("next")));
          router.refresh();
        })
      }
    >
      <Field label="email">
        <Input name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="lg" disabled={pending}>
        {pending ? "signing in…" : "sign in"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Got an invite link? Open it to make an account. <Link href="/join?owner=1" className="underline underline-offset-4 hover:text-foreground">Owner setup</Link>
      </p>
    </form>
  );
}

export function JoinForm() {
  const params = useSearchParams();
  const router = useRouter();
  const owner = params.get("owner") === "1";
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-4"
      action={(form) =>
        start(async () => {
          setError(undefined);
          const code = owner ? String(form.get("setup")) : (params.get("code") ?? "");
          const { error } = await authClient.signUp.email(
            { name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) },
            { query: { invite: code } },
          );
          if (error) return setError(error.message ?? "couldn't create the account");
          router.push("/");
          router.refresh();
        })
      }
    >
      {!owner && !params.get("code") && <p className="text-sm text-destructive">This link is missing its invite code. Ask for a new one.</p>}
      <Field label="your name">
        <Input name="name" autoComplete="name" required autoFocus />
      </Field>
      <Field label="email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="password">
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      {owner && (
        <Field label="owner setup code">
          <Input name="setup" required />
        </Field>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="lg" disabled={pending}>
        {pending ? "creating…" : owner ? "create owner account" : "join"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="underline underline-offset-4 hover:text-foreground">Sign in</Link>
      </p>
    </form>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { JoinForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "join" };

export default function JoinPage() {
  return (
    <AuthShell title="You're invited" sub="Make an account to see the closet. You can vote on fits, leave comments, and suggest pieces.">
      <Suspense>
        <JoinForm />
      </Suspense>
    </AuthShell>
  );
}

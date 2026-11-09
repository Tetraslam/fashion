import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "sign in" };

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" sub="tetraslam's closet. Friends can look around and leave notes; only the owner can change things.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

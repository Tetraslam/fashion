import { Suspense } from "react";
import type { Metadata } from "next";
import { getData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { ProfileForm } from "@/components/profile-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "me" };

export default function MePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        kicker="me / sizes + fit"
        title="What fits"
        sub="Sizes filter every Grailed search. Measurements of clothes that already fit you well get compared against each listing's, which is the only reliable way to buy used on a tall frame."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Profile />
      </Suspense>
    </div>
  );
}

async function Profile() {
  const { profile } = await getData();
  return <ProfileForm profile={profile} />;
}

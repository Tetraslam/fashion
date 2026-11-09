import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getData } from "@/lib/data";
import { listPeople } from "@/app/collab-actions";
import { PageHeader } from "@/components/bits";
import { Skeleton } from "@/components/ui/skeleton";
import { People } from "@/components/people";

export const metadata: Metadata = { title: "people" };

export default function PeoplePage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        kicker="people / owner only"
        title="Who can see this"
        sub="Make a single-use invite link per friend. Anyone signed in can see everything and vote, comment, and suggest. Only you can change things."
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <PeopleData />
      </Suspense>
    </div>
  );
}

async function PeopleData() {
  const { viewer, invites, comments } = await getData();
  if (viewer.role !== "owner") redirect("/");
  const people = await listPeople();
  const activity = Object.fromEntries(people.map((p) => [p.id, comments.filter((c) => c.userId === p.id).length]));
  return <People invites={invites} people={people} activity={activity} />;
}

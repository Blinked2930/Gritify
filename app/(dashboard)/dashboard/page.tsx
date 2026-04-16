import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gritify Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to your 75 Hard challenge tracker.
      </p>
    </div>
  );
}

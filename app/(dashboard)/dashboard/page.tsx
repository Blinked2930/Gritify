import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./ClientPage";


export default async function DashboardPage() {
  // This physically blocks anyone without an account
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <DashboardClient />;
}
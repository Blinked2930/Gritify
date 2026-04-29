import { PushNotificationManager } from "@/components/features/PushNotificationManager";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* This only mounts when a user navigates to /dashboard or /stats.
        Because they are protected routes, we know the user is authenticated, 
        so it is safe to request push notification permissions.
      */}
      <PushNotificationManager />
      {children}
    </>
  );
}
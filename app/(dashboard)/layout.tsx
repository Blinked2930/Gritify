import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css"; // FIXED: Added '../' to correctly point up one folder level
import { Providers } from "@/components/providers";
import { PushNotificationManager } from "@/components/features/PushNotificationManager";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gritify",
  description: "Track your 75 Hard challenge with discipline and social connection",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gritify",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a", // Exact hex code for Tailwind's bg-neutral-950
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
  viewportFit: "cover", // CRITICAL: Tells iOS to push the background up into the notch
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* CRITICAL FIX: bg-neutral-950 applied to the body so iOS reads it for the status bar */}
      <body className={`${inter.className} bg-neutral-950 text-neutral-50 overscroll-none antialiased`}>
        <Providers>
          <PushNotificationManager />
          {children}
        </Providers>
      </body>
    </html>
  );
}
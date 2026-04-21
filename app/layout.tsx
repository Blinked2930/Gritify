import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
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
  themeColor: "#020617", // Grit Obsidian - makes the iPhone notch blend in perfectly
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Crucial for native app feel (stops pinch to zoom)
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overscroll-none`}>
        <Providers>
          <PushNotificationManager />
          {children}
        </Providers>
      </body>
    </html>
  );
}
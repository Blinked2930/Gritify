import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/providers";
import { PushNotificationManager } from "@/components/features/PushNotificationManager";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gritify",
  description: "Track your 75 Hard challenge with discipline and social connection",
  manifest: "/manifest.json",
  // CRITICAL FIX: Explicitly telling iOS where to find the home screen icon
  icons: {
    icon: "/icon-512.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gritify",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
  viewportFit: "cover", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-neutral-950 text-neutral-50 overscroll-none antialiased`}>
        <Providers>
          <PushNotificationManager />
          {children}
        </Providers>
      </body>
    </html>
  );
}
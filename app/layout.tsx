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
  themeColor: "#0a0a0a", // Exact hex code for Tailwind's bg-neutral-950
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Crucial for native app feel (stops pinch to zoom)
  userScalable: false,
  viewportFit: "cover", // CRITICAL: Tells iOS to push the background up into the notch
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // CRITICAL FIX: The html tag itself must have the dark background classes and inline styles to override iOS Light Mode
    <html lang="en" suppressHydrationWarning className="bg-neutral-950" style={{ backgroundColor: "#0a0a0a" }}>
      <body className={`${inter.className} bg-neutral-950 text-neutral-50 overscroll-none antialiased min-h-screen`}>
        <Providers>
          <PushNotificationManager />
          {children}
        </Providers>
      </body>
    </html>
  );
}
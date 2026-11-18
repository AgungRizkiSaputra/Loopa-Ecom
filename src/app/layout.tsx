import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Footer } from "@/components/footer";
import { AuthTransitionOverlay } from "@/components/auth-transition-overlay";
import { ChatNotificationListener } from "@/components/chat-notification-listener";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.brandName} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.brandName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.brandName,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.brandName,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#D9F36A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full overflow-x-clip">
      <body className="flex min-h-full w-full max-w-full flex-col overflow-x-clip overscroll-none bg-loopa-cream text-loopa-charcoal antialiased">
        <AuthTransitionOverlay />
        <ChatNotificationListener />
        <Navbar />
        <main className="flex-1 w-full max-w-full overflow-x-clip">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}

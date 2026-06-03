import type { Metadata } from "next";
import { Geist, Geist_Mono, Bai_Jamjuree, Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import NotificationPopup from "../components/NotificationPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baiJamjuree = Bai_Jamjuree({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-bai-jamjuree",
});

// Add Inter font
const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ShuttleFlow",
  description: "Track your bus in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${baiJamjuree.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<NotificationPopup /></body>
    </html>
  );
}
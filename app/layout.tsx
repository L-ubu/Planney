import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from "@/components/user-provider";
import { Navbar } from "@/components/navbar";
import { StarBackground } from "@/components/star-background";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planney",
  description: "Our shared calendar and finance tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UserProvider>
          <Navbar />
          <StarBackground />
          <main className="relative z-[1] flex-1 pb-20 md:pb-0">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}

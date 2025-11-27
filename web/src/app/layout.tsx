import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "DocTalk",
  description: "Chat with your documents using Gemini and Vertex AI Search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased flex min-h-screen`}
      >
        <Sidebar className="hidden md:block" />
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

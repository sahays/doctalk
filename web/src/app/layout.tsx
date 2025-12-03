import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased flex flex-col md:flex-row min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          {/* Mobile Header */}
          <div className="md:hidden p-4 border-b border-border flex items-center bg-muted/40">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <Sidebar className="w-full border-none h-full" mode="mobile" />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">DocTalk</h1>
          </div>

          {/* Desktop Sidebar */}
          <Sidebar className="hidden md:flex shrink-0" mode="desktop" />
          
          <main className="flex-1 overflow-x-hidden w-full h-[calc(100vh-65px)] md:h-screen">
              {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

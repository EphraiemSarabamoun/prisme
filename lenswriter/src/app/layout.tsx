import type { Metadata } from "next";
import { AgentProvider } from "@/lib/AgentContext";
import ThemeSync from "@/components/ThemeSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "LensWriter",
  description: "See your writing through every lens",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        <AgentProvider>
          <ThemeSync />
          {children}
        </AgentProvider>
      </body>
    </html>
  );
}

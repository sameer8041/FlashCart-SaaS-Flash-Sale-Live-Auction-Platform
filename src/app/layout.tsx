// src/app/layout.tsx
import { Providers } from "@/Components/Providers";
import Navbar from "@/Components/Navbar";
import "./globals.css";

export const metadata = {
  title: "FlashCart | High-Concurrency Flash Sales",
  description: "Buy limited edition products before they stock out.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <Providers>
          {/* Navbar ab Layout ka hissa hai (Static Shell) */}
          <Navbar />

          {/* Main content area (Dynamic Page Content) */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Footer bhi static hai, toh yahi aayega */}
          <footer className="bg-white border-t py-6 text-center text-sm text-gray-500 mt-auto">
            <p>© 2026 FlashCart SaaS. Built for high-concurrency.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
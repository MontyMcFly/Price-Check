import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Price Check App",
  description: "Smart savings for your daily shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        <AuthProvider>
          <main>
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}

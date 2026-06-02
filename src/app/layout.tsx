import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/i18n";
import AxolotlPet from "@/components/AxolotlPet";

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
        <LanguageProvider>
          <AuthProvider>
            <main className="app-container">
              {children}
            </main>
            <BottomNav />
            <AxolotlPet variant="floating" />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

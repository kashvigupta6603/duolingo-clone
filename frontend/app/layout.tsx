import type { Metadata } from "next";
import { Suspense } from "react";
import { Nunito } from "next/font/google";
import "./globals.css";
import UserProvider from "@/components/UserProvider";
import Shell from "@/components/Shell";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Duolingo Clone",
  description: "Learn Spanish the fun way",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <UserProvider>
          <Suspense fallback={null}>
            <Shell>{children}</Shell>
          </Suspense>
        </UserProvider>
      </body>
    </html>
  );
}
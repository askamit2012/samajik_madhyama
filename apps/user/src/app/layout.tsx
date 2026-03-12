import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "../components/auth-provider";
import { AppLayout } from "../components/app-layout";

export const metadata: Metadata = {
  title: "Social Media App - User",
  description: "User frontend for social media marketing app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}

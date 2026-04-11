import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "ResellerOS — The Reseller's Operating System",
  description: "Track inventory, calculate profit, manage orders, and generate receipts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#14141e",
              color: "#eeeef5",
              border: "1px solid #1c1c28",
              borderRadius: "12px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#2a9d8f", secondary: "#eeeef5" } },
            error:   { iconTheme: { primary: "#e63946", secondary: "#eeeef5" } },
          }}
        />
      </body>
    </html>
  );
}

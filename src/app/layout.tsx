import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import Link from "next/link";

const SITE = process.env.SITE_NAME || "Crab News";

export const metadata: Metadata = {
  title: SITE,
  description: `${SITE} — an invite-only computing link aggregator`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <div id="inside">{children}</div>
        <footer>
          <Link href="/about">About</Link>
          <Link href="/users">Users</Link>
          <Link href="/tags">Tags</Link>
          <Link href="/recent">Recent</Link>
          <span className="muted">
            invite-only · powered by Next.js + Drizzle
          </span>
        </footer>
      </body>
    </html>
  );
}

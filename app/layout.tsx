import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTML Studio",
  description: "Visual HTML editor and HTML splitter built for static deployment."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

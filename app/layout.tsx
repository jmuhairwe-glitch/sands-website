import "./globals.css";
import WhatsAppTracking from "./components/WhatsAppTracking";

export const metadata = {
  metadataBase: new URL('https://sands.co.ug'),
  title: "SANDS Fish Farm (U) Limited",
  description:
    "Practical aquaculture, quality fish, modern tank systems, farmer training and circular fish farming solutions in Uganda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}<WhatsAppTracking /></body>
    </html>
  );
}

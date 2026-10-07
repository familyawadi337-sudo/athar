import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "أثري — Teacher Portfolio",
  description: "منصة احترافية لتوثيق الأثر المهني للمعلمين",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}

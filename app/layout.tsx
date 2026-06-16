import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "대입 정시지원 상담 웹앱",
  description: "본교 졸업생의 정시 지원 사례 검색 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

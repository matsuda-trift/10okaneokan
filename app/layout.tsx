import type { Metadata } from "next";
import { Kosugi_Maru, Yomogi } from "next/font/google";
import "./globals.css";

const yomogi = Yomogi({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
});

const kosugiMaru = Kosugi_Maru({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "おかねおかん | 今月なんぼ使ったんや？怒らへんから正直に言うてみ",
  description:
    "収入・支出・貯金を入力すると、関西弁の“オカン”が点数とコメント、行動提案をくれるチャット家計アプリ。",
  applicationName: "おかねおかん",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${yomogi.variable} ${kosugiMaru.variable}`}>
        {children}
      </body>
    </html>
  );
}

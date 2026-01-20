import type { Metadata } from 'next';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Orbital Guardian - 宇宙デブリ監視・除去シミュレーション',
  description:
    '数理最適化を学びながら地球軌道を守る戦略シミュレーションゲーム。監視レーダー網と除去衛星を最適配置し、宇宙デブリ問題に挑戦しよう。',
  keywords: [
    '宇宙デブリ',
    'space debris',
    '数理最適化',
    'optimization',
    'シミュレーション',
    'ゲーム',
    '施設配置問題',
    'facility location',
  ],
  authors: [{ name: 'Orbital Guardian Team' }],
  openGraph: {
    title: 'Orbital Guardian',
    description: '宇宙デブリ監視・除去ネットワーク最適化ゲーム',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orbital Guardian',
    description: '宇宙デブリ監視・除去ネットワーク最適化ゲーム',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-space-900 text-gray-100 antialiased">
        {/* グリッドオーバーレイ背景 */}
        <div className="fixed inset-0 grid-overlay pointer-events-none opacity-50" />

        {/* メインコンテンツ */}
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}

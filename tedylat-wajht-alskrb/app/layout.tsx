import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    'https://tedylat-wajht-alskrb-mu.vercel.app'
  ),

  title:
    'TubeLens | محلل فيديوهات يوتيوب وكتابة اسكربت بالذكاء الاصطناعي',

  description:
    'TubeLens أداة لتحليل فيديوهات يوتيوب، اكتشاف المشاهدات والكلمات المفتاحية، وكتابة اسكربتات الفيديو بالذكاء الاصطناعي.',

  keywords: [
    'تحليل فيديوهات يوتيوب',
    'محلل فيديو يوتيوب',
    'كتابة اسكربت',
    'YouTube Video Analyzer',
    'AI Video Script Generator',
    'TubeLens',
  ],

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0F0F0F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${plexArabic.variable} bg-background`}
    >

      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6721672829345043"
          crossOrigin="anonymous"
        />
      </head>

      <body className="antialiased">

        {children}

        {process.env.NODE_ENV === 'production' && (
          <Analytics />
        )}

      </body>

    </html>
  )
}

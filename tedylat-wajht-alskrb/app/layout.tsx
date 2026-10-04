import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google'
import type { ReactNode } from 'react'
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
    'TubeLens | تحليل الفيديوهات واستخراج النصوص بالذكاء الاصطناعي',

  description:
    'TubeLens أداة ذكية لتحليل الفيديوهات واستخراج النص من الصوت وتحويل الفيديو إلى كتابة وإنشاء اسكربتات بالذكاء الاصطناعي.',

  keywords: [
    'تحليل الفيديو',
    'تحليل فيديو بالذكاء الاصطناعي',
    'استخراج النص من الفيديو',
    'تحويل الفيديو إلى نص',
    'تفريغ الفيديو',
    'تحويل الصوت إلى كتابة',
    'تحليل فيديوهات يوتيوب',
    'محلل فيديو يوتيوب',
    'كتابة اسكربت',
    'YouTube Video Analyzer',
    'AI Script Generator',
    'TubeLens',
  ],

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title:
      'TubeLens | تحليل الفيديوهات واستخراج النصوص',

    description:
      'حلل الفيديوهات واستخرج النصوص واكتب اسكربتات باستخدام الذكاء الاصطناعي.',

    url:
      'https://tedylat-wajht-alskrb-mu.vercel.app',

    siteName: 'TubeLens',

    type: 'website',

    locale: 'ar_AR',
  },

  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],

    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0F0F0F',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${plexArabic.variable} bg-background`}
    >

      <head>

        {/* Google Web App Schema */}
        <Script
          id="website-schema"
          type="application/ld+json"
        >
          {`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "TubeLens",
            "applicationCategory": "AI Tool",
            "operatingSystem": "Web",
            "description": "أداة لتحليل الفيديوهات واستخراج النصوص وتحويل الصوت إلى كتابة باستخدام الذكاء الاصطناعي."
          }
          `}
        </Script>


        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-9SQ7G09KBD"
        />

        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9SQ7G09KBD');
          `}
        </Script>


        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6721672829345043"
          crossOrigin="anonymous"
        />


        {/* Adsterra Popunder */}
        <Script
          id="adsterra-popunder"
          src="https://4xfreedom.com/1/1d5c5e10aa61dd7bee676f8900a62ce2"
          data-cfasync="false"
          strategy="afterInteractive"
        />


        {/* Adsterra DCENGG */}
        <Script
          id="adsterra-dcengg"
          src="https://dcengg.org/14/0ffd0cfc67988e1f614e62faec4e17eb"
          data-cfasync="false"
          strategy="afterInteractive"
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

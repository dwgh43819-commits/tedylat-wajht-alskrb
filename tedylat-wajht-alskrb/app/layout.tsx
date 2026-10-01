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

title: 'TubeLens | محلل فيديوهات يوتيوب وكتابة اسكربت',

description:
'TubeLens أداة لتحليل فيديوهات يوتيوب واكتشاف المشاهدات والكلمات المفتاحية وكتابة اسكربت الفيديو.',

keywords: [
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
title: 'TubeLens | محلل فيديوهات يوتيوب',
description:
'حلل فيديوهات يوتيوب واكتب اسكربتات بالذكاء الاصطناعي.',
url: 'https://tedylat-wajht-alskrb-mu.vercel.app',
siteName: 'TubeLens',
type: 'website',
locale: 'ar_AR',
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
> <head>
{/* Google Analytics - Google Tag */} <Script
       async
       src="https://www.googletagmanager.com/gtag/js?id=G-9SQ7G09KBD"
     />

```
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
  </head>

  <body className="antialiased">
    {children}

    {process.env.NODE_ENV === 'production' && (
      <Analytics />
    )}
  </body>
</html>
```

)
}

```

### بعد اللصق اعمل 3 خطوات فقط:

1. في GitHub اضغط **Commit changes**.
2. انتظر Vercel حتى يعمل **Deployment جديد** ويظهر **Ready**.
3. افتح موقعك:
   `https://tedylat-wajht-alskrb-mu.vercel.app`

بعدها ارجع إلى **Google Analytics → التقارير → الوقت الفعلي** وافتح الموقع من متصفح آخر أو نافذة خفية. قد يستغرق ظهور أول مستخدم بعض الوقت.

**مهم:** لا تحذف `@vercel/analytics`؛ ده نظام مختلف عن Google Analytics.
```

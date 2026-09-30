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

title: {
default:
'TubeLens | محلل فيديوهات يوتيوب وكتابة اسكربت بالذكاء الاصطناعي',
template: '%s | TubeLens',
},

description:
'TubeLens أداة مجانية لتحليل فيديوهات يوتيوب واكتشاف المشاهدات والتفاعل والكلمات المفتاحية والوسوم، مع أدوات لكتابة اسكربت الفيديو وتحليل المحتوى بالذكاء الاصطناعي.',

applicationName: 'TubeLens',

authors: [
{
name: 'TubeLens',
},
],

creator: 'TubeLens',
publisher: 'TubeLens',

category: 'technology',

keywords: [
'تحليل فيديوهات',
'محلل فيديوهات يوتيوب',
'تحليل فيديو يوتيوب',
'تحليل فيديو بالذكاء الاصطناعي',
'تحليل فيديوهات يوتيوب',
'تحليل محتوى يوتيوب',
'تحليل قناة يوتيوب',
'إحصائيات يوتيوب',
'مشاهدات يوتيوب',
'الكلمات المفتاحية يوتيوب',
'وسوم يوتيوب',
'كتابة اسكربت',
'كتابة اسكربت يوتيوب',
'مولد اسكربت فيديو',
'اسكربت فيديو بالذكاء الاصطناعي',
'YouTube Video Analyzer',
'AI Video Analyzer',
'YouTube Script Generator',
'AI Video Script Generator',
'YouTube Analytics Tool',
'YouTube Video Analysis',
'TubeLens',
],

alternates: {
canonical: '/',
},

robots: {
index: true,
follow: true,
googleBot: {
index: true,
follow: true,
'max-image-preview': 'large',
'max-snippet': -1,
'max-video-preview': -1,
},
},

openGraph: {
title: 'TubeLens | محلل فيديوهات يوتيوب',
description:
'حلل فيديوهات يوتيوب واكتشف المشاهدات والتفاعل والكلمات المفتاحية والوسوم، وأنشئ اسكربتات للفيديو.',
url: 'https://tedylat-wajht-alskrb-mu.vercel.app',
siteName: 'TubeLens',
type: 'website',
locale: 'ar_AR',
},

twitter: {
card: 'summary_large_image',
title: 'TubeLens | محلل فيديوهات يوتيوب',
description:
'أداة لتحليل فيديوهات يوتيوب وكتابة اسكربتات وتحليل المحتوى.',
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

generator: 'v0.app',
}

export const viewport: Viewport = {
colorScheme: 'dark',
themeColor: '#0F0F0F',
}

const structuredData = {
'@context': 'https://schema.org',
'@type': 'WebApplication',
name: 'TubeLens',
alternateName: 'TubeLens YouTube Toolkit',
url: 'https://tedylat-wajht-alskrb-mu.vercel.app',
applicationCategory: 'MultimediaApplication',
operatingSystem: 'Web Browser',
inLanguage: ['ar', 'en'],
description:
'TubeLens أداة لتحليل فيديوهات يوتيوب واكتشاف المشاهدات والتفاعل والكلمات المفتاحية والوسوم وكتابة اسكربتات الفيديو.',
featureList: [
'تحليل فيديوهات يوتيوب',
'تحليل مشاهدات وتفاعل الفيديو',
'اكتشاف الكلمات المفتاحية',
'تحليل الوسوم',
'تحليل محتوى الفيديو',
'كتابة اسكربت الفيديو',
'استخراج النص من الفيديو',
'أدوات الصوت والفيديو',
'YouTube Video Analysis',
'YouTube Script Generator',
'AI Video Analysis',
],
}

export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode
}>) {
return (
<html
lang="ar"
dir="rtl"
className={`${inter.variable} ${plexArabic.variable} bg-background`}
> <head> <Script
       async
       src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6721672829345043"
       crossOrigin="anonymous"
     />

```
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  </head>

  <body className="antialiased">
    {children}

    {process.env.NODE_ENV === 'production' && <Analytics />}
  </body>
</html>
```

)
}

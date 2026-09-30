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
'TubeLens أداة مجانية لتحليل فيديوهات يوتيوب واكتشاف المشاه

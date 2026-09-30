export type Lang = 'ar' | 'en'

export type ToolId =
  | 'analytics'
  | 'script'
  | 'audio'


export const isRtl = (lang: Lang) => {
  return lang === 'ar'
}


export const dictionaries = {

  ar: {

    heroBadge: 'مدعوم بالذكاء الاصطناعي',

    heroAnalytics:
      'تحليل فيديوهات يوتيوب',

    heroAnalyticsDesc:
      'حلل الفيديوهات واكتشف الإحصائيات والكلمات المفتاحية',

    heroScript:
      'كتابة اسكربت الفيديو',

    heroScriptDesc:
      'إنشاء اسكربتات احترافية للفيديوهات',

    heroAudio:
      'عزل الصوت',

    heroAudioDesc:
      'افصل الصوت والموسيقى من الفيديو',

    footer:
      'جميع الحقوق محفوظة',

    openMenu:
      'فتح القائمة',

  },


  en: {

    heroBadge:
      'Powered by AI',

    heroAnalytics:
      'YouTube Video Analysis',

    heroAnalyticsDesc:
      'Analyze videos and discover statistics and keywords',

    heroScript:
      'Video Script Generator',

    heroScriptDesc:
      'Create professional video scripts',

    heroAudio:
      'Audio Isolation',

    heroAudioDesc:
      'Separate voice and music',

    footer:
      'All rights reserved',

    openMenu:
      'Open menu',

  }

} as const

export type VideoInfo = {
  id: string
  title: string
  channel: string
  views: number
  likes: number
  comments: number
  publishedAt: string
  description: string
  tags: string[]
  thumbnailUrl: string
  url: string
}

export const DEFAULT_URL = ''

export function parseVideoId(input: string): string | null {
  const value = input.trim()
  if (/^[\w-]{11}$/.test(value)) return value
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\.|^m\./, '').toLowerCase()
    if (host === 'youtu.be') return url.pathname.slice(1, 12) || null
    if (host === 'youtube.com' || host === 'music.youtube.com') {
      const v = url.searchParams.get('v')
      if (v && /^[\w-]{11}$/.test(v)) return v
      const match = url.pathname.match(/^\/(shorts|embed|live)\/([\w-]{11})/)
      if (match) return match[2]
    }
  } catch {
    return null
  }
  return null
}

export function emptyVideo(): VideoInfo {
  return {
    id: '',
    title: '',
    channel: '',
    views: 0,
    likes: 0,
    comments: 0,
    publishedAt: '',
    description: '',
    tags: [],
    thumbnailUrl: '',
    url: '',
  }
}

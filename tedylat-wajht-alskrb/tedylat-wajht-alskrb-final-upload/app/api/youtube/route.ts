import { NextResponse } from 'next/server'
import { parseVideoId } from '@/lib/demo-data'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    const id = typeof url === 'string' ? parseVideoId(url) : null
    if (!id) return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 })

    const key = process.env.YOUTUBE_API_KEY
    if (!key) return NextResponse.json({ error: 'YOUTUBE_API_KEY is not configured on the server.' }, { status: 500 })

    const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos')
    endpoint.searchParams.set('part', 'snippet,statistics,contentDetails')
    endpoint.searchParams.set('id', id)
    endpoint.searchParams.set('key', key)

    const response = await fetch(endpoint, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) {
      const message = data?.error?.message || 'YouTube API request failed.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const item = data?.items?.[0]
    if (!item) return NextResponse.json({ error: 'Video not found or not publicly accessible.' }, { status: 404 })

    const snippet = item.snippet ?? {}
    const stats = item.statistics ?? {}
    const thumbnail = snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`

    return NextResponse.json({
      id,
      title: snippet.title || '',
      channel: snippet.channelTitle || '',
      views: Number(stats.viewCount || 0),
      likes: Number(stats.likeCount || 0),
      comments: Number(stats.commentCount || 0),
      publishedAt: snippet.publishedAt || '',
      description: snippet.description || '',
      tags: Array.isArray(snippet.tags) ? snippet.tags : [],
      thumbnailUrl: thumbnail,
      url: `https://www.youtube.com/watch?v=${id}`,
      duration: item.contentDetails?.duration || null,
    })
  } catch {
    return NextResponse.json({ error: 'Could not analyze the video.' }, { status: 500 })
  }
}

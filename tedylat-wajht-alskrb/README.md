# TubeLens — fixed comparison build

## Vercel Environment Variables

Add these in **Vercel → Project → Settings → Environment Variables**:

- `YOUTUBE_API_KEY` — YouTube Data API v3 key
- `GEMINI_API_KEY` — Gemini API key
- `GEMINI_MODEL` — optional; defaults to `gemini-3.8-flash`

Do not use `NEXT_PUBLIC_` for these secrets.

## What changed

- YouTube analytics now use the YouTube Data API instead of generated demo numbers.
- Public YouTube tags are read from the video's real `snippet.tags` when available.
- Gemini summary and timestamped script requests are server-side and use the public YouTube URL as video input.
- Removed the old fake/demo analytics, tags, summary, and script data from the active UI path.
- Removed `typescript.ignoreBuildErrors` from `next.config.mjs`.
- Reduced client-side FFmpeg input limits to more realistic browser-safe limits.
- No API key is stored in the source code.

## Audio isolation note

The existing audio isolator is still browser-side FFmpeg filtering. It is not a neural source-separation model such as Demucs. Real AI vocal/music separation requires a dedicated separation engine/service; YouTube and Gemini keys alone do not provide that operation.

Use the audio tool only with media you are authorized to process.

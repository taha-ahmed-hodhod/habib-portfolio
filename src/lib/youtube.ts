/**
 * Video & YouTube Utility functions for validation, ID extraction,
 * playback settings persistence, and embed URL generation.
 */

// Matches standard, shortened, shorts, and embed YouTube URLs
const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i

export interface VideoPlaybackSettings {
  autoplay?: boolean
  mute?: boolean
  loop?: boolean
  controls?: boolean // default true
  start?: number // in seconds, non-negative
}

/**
 * Parses time formats such as "773", "773s", "1m30s", "1h2m3s" into total seconds.
 */
export function parseTimeString(timeStr: string | null | undefined): number {
  if (!timeStr) return 0
  const clean = timeStr.trim().toLowerCase()
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10)
  }
  if (/^\d+s$/.test(clean)) {
    return parseInt(clean.replace('s', ''), 10)
  }

  // Handle formats like 1h2m3s or 90m
  let totalSeconds = 0
  const hours = clean.match(/(\d+)h/)
  const minutes = clean.match(/(\d+)m/)
  const seconds = clean.match(/(\d+)s/)

  if (hours) totalSeconds += parseInt(hours[1], 10) * 3600
  if (minutes) totalSeconds += parseInt(minutes[1], 10) * 60
  if (seconds) totalSeconds += parseInt(seconds[1], 10)

  return totalSeconds > 0 ? totalSeconds : 0
}

/**
 * Extracts YouTube video ID from a URL safely.
 * Returns null if the URL is invalid or not a YouTube URL.
 */
export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  const match = trimmed.match(YOUTUBE_REGEX)
  return match ? match[1] : null
}

/**
 * Checks whether a given URL is a valid YouTube video URL.
 */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  return Boolean(getYouTubeVideoId(url))
}

/**
 * Parses a video URL (YouTube or Self-Hosted) and extracts its clean URL and playback settings.
 * Defaults: autoplay = false, mute = false, loop = false, controls = true, start = 0.
 */
export function parseVideoUrl(url: string | null | undefined): {
  cleanUrl: string
  isYouTube: boolean
  videoId: string | null
  settings: VideoPlaybackSettings
} {
  const defaultSettings: VideoPlaybackSettings = {
    autoplay: false,
    mute: false,
    loop: false,
    controls: true,
    start: 0,
  }

  if (!url || typeof url !== 'string') {
    return { cleanUrl: '', isYouTube: false, videoId: null, settings: defaultSettings }
  }

  const trimmed = url.trim()
  const videoId = getYouTubeVideoId(trimmed)
  const isYouTube = Boolean(videoId)

  let cleanUrl = trimmed
  const settings: VideoPlaybackSettings = { ...defaultSettings }

  try {
    // Extract parameters from query string and hash fragment
    const queryPart = trimmed.includes('?') ? trimmed.split('?')[1].split('#')[0] : ''
    const hashPart = trimmed.includes('#') ? trimmed.split('#')[1] : ''

    const searchParams = new URLSearchParams(queryPart)
    const hashParams = new URLSearchParams(hashPart)

    const getParam = (key: string) => searchParams.get(key) || hashParams.get(key)

    // Autoplay
    if (getParam('autoplay') === '1' || getParam('autoplay') === 'true') {
      settings.autoplay = true
    }

    // Mute
    if (getParam('mute') === '1' || getParam('muted') === '1' || getParam('mute') === 'true') {
      settings.mute = true
    }

    // Loop
    if (getParam('loop') === '1' || getParam('loop') === 'true') {
      settings.loop = true
    }

    // Controls (default is true; check if explicitly 0 or false)
    if (getParam('controls') === '0' || getParam('controls') === 'false') {
      settings.controls = false
    } else {
      settings.controls = true
    }

    // Start time (check start, t, or time)
    const rawStart = getParam('start') || getParam('t') || getParam('time')
    if (rawStart) {
      settings.start = parseTimeString(rawStart)
    }

    // Compute cleanUrl:
    if (isYouTube && videoId) {
      cleanUrl = `https://www.youtube.com/watch?v=${videoId}`
    } else {
      // Remove query and hash for clean storage URL
      cleanUrl = trimmed.split(/[?#]/)[0]
    }
  } catch (err) {
    console.warn('Error parsing video URL parameters:', err)
  }

  return { cleanUrl, isYouTube, videoId, settings }
}

/**
 * Builds a persisted video URL by attaching playback settings onto the base URL.
 * For YouTube: uses standard query parameters.
 * For Self-Hosted: uses standard hash fragment parameters.
 */
export function buildVideoUrl(rawUrl: string, settings: VideoPlaybackSettings): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  const trimmed = rawUrl.trim()
  const videoId = getYouTubeVideoId(trimmed)

  if (videoId) {
    const params = new URLSearchParams()
    params.set('v', videoId)

    if (settings.autoplay) params.set('autoplay', '1')
    if (settings.mute || settings.autoplay) params.set('mute', '1')
    if (settings.loop) params.set('loop', '1')
    if (settings.controls === false) params.set('controls', '0')
    if (settings.start && settings.start > 0) {
      params.set('start', String(Math.floor(settings.start)))
      params.set('t', `${Math.floor(settings.start)}s`)
    }

    return `https://www.youtube.com/watch?${params.toString()}`
  }

  // Self-hosted video file:
  const baseStorageUrl = trimmed.split(/[?#]/)[0]
  const fragmentParams = new URLSearchParams()

  if (settings.autoplay) fragmentParams.set('autoplay', '1')
  if (settings.mute || settings.autoplay) fragmentParams.set('mute', '1')
  if (settings.loop) fragmentParams.set('loop', '1')
  if (settings.controls === false) fragmentParams.set('controls', '0')
  if (settings.start && settings.start > 0) {
    fragmentParams.set('start', String(Math.floor(settings.start)))
  }

  const fragmentStr = fragmentParams.toString()
  return fragmentStr ? `${baseStorageUrl}#${fragmentStr}` : baseStorageUrl
}

/**
 * Generates an official YouTube embed URL with standard parameters and playback settings.
 */
export function getYouTubeEmbedUrl(
  urlOrId: string | null | undefined,
  options: VideoPlaybackSettings & { rel?: boolean } = {}
): string | null {
  if (!urlOrId) return null

  // Extract video ID and any embedded settings from the input
  const parsed = parseVideoUrl(urlOrId)
  const videoId = parsed.videoId || (urlOrId && /^[a-zA-Z0-9_-]{11}$/.test(urlOrId.trim()) ? urlOrId.trim() : null)
  if (!videoId) return null

  // Merge options with parsed settings (options take precedence)
  const merged: VideoPlaybackSettings = {
    autoplay: options.autoplay !== undefined ? options.autoplay : parsed.settings.autoplay,
    mute: options.mute !== undefined ? options.mute : parsed.settings.mute,
    loop: options.loop !== undefined ? options.loop : parsed.settings.loop,
    controls: options.controls !== undefined ? options.controls : parsed.settings.controls,
    start: options.start !== undefined ? options.start : parsed.settings.start,
  }

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  })

  if (merged.autoplay) {
    params.set('autoplay', '1')
    // Browsers require autoplay to be muted
    params.set('mute', '1')
  } else if (merged.mute) {
    params.set('mute', '1')
  }

  if (merged.controls === false) {
    params.set('controls', '0')
  }

  if (merged.loop) {
    params.set('loop', '1')
    params.set('playlist', videoId)
  }

  if (merged.start && merged.start > 0) {
    params.set('start', String(Math.floor(merged.start)))
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

/**
 * Returns a high-quality thumbnail image URL for a YouTube video.
 */
export function getYouTubeThumbnailUrl(
  urlOrId: string | null | undefined,
  quality: 'maxres' | 'hq' = 'hq'
): string | null {
  const videoId = getYouTubeVideoId(urlOrId) || (urlOrId && /^[a-zA-Z0-9_-]{11}$/.test(urlOrId.trim()) ? urlOrId.trim() : null)
  if (!videoId) return null

  const file = quality === 'maxres' ? 'maxresdefault.jpg' : 'hqdefault.jpg'
  return `https://img.youtube.com/vi/${videoId}/${file}`
}

/**
 * Generates an optimized, muted, borderless embed URL for card hover/viewport preview.
 * Includes loop, playlist, muted autoplay, no controls, playsinline, and rel=0.
 */
export function getYouTubeCardPreviewUrl(urlOrId: string | null | undefined): string | null {
  const videoId = getYouTubeVideoId(urlOrId)
  if (!videoId) return null

  const origin =
    typeof window !== 'undefined' && window.location.origin.startsWith('http')
      ? window.location.origin
      : undefined

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    playsinline: '1',
    loop: '1',
    playlist: videoId,
    rel: '0',
    modestbranding: '1',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    enablejsapi: '1',
  })

  if (origin) {
    params.set('origin', origin)
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}


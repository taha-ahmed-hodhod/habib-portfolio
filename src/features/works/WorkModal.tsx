import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  X,
  ExternalLink,
  FileText,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
} from 'lucide-react'
import type { Work } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getYouTubeEmbedUrl, parseVideoUrl } from '@/lib/youtube'

export interface WorkModalProps {
  work: Work | null
  onClose: () => void
  isAr: boolean
}

export const WorkModal: React.FC<WorkModalProps> = ({ work, onClose, isAr }) => {
  const parsed = parseVideoUrl(work?.media_url)
  const isYouTube = Boolean(work && work.media_type === 'video' && parsed.isYouTube)
  const settings = parsed.settings
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Player States
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [bufferedEnd, setBufferedEnd] = useState(0)

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }

  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current)
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2500)
    }
  }, [isPlaying])

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
    resetControlsTimer()
  }

  // Seek time
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    const newTime = percent * (videoRef.current.duration || 0)
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    resetControlsTimer()
  }

  // Quick skip
  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return
    const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds))
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    resetControlsTimer()
  }

  // Volume toggle
  const toggleMute = () => {
    if (!videoRef.current) return
    if (isMuted) {
      videoRef.current.muted = false
      setIsMuted(false)
      videoRef.current.volume = volume || 0.5
    } else {
      videoRef.current.muted = true
      setIsMuted(true)
    }
    resetControlsTimer()
  }

  // Volume slider change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val
      if (val === 0) {
        videoRef.current.muted = true
        setIsMuted(true)
      } else {
        videoRef.current.muted = false
        setIsMuted(false)
      }
    }
    resetControlsTimer()
  }

  // Playback rate toggle (1 -> 1.25 -> 1.5 -> 2 -> 1)
  const togglePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2]
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length
    const nextRate = rates[nextIndex]
    setPlaybackRate(nextRate)
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate
    }
    resetControlsTimer()
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
    resetControlsTimer()
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          onClose()
        }
        return
      }

      // If YouTube or not a self-hosted video, don't intercept player keys
      if (isYouTube || work?.media_type !== 'video') {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleSkip(5)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSkip(-5)
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault()
        toggleMute()
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    if (work) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [work, onClose, isPlaying, isMuted, volume, playbackRate])

  // Track video progress and buffer
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)

    if (videoRef.current.buffered.length > 0) {
      const buffered = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      setBufferedEnd(buffered)
    }
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)

    if (settings.start && settings.start > 0) {
      videoRef.current.currentTime = settings.start
      setCurrentTime(settings.start)
    }

    if (settings.mute || settings.autoplay) {
      videoRef.current.muted = true
      setIsMuted(true)
    }

    if (settings.autoplay) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  if (!work) return null

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-[#080808] border border-[#242424] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4.5 border-b border-[#1A1A1A] bg-[#0C0C0C]/90 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <Badge variant="accent" className="font-semibold text-xs">
              {work.media_type === 'video'
                ? isAr ? 'فيديو سينمائي' : 'Cinematic Video'
                : work.media_type === 'document'
                ? isAr ? 'مستند رقمي' : 'Digital Document'
                : isAr ? 'صورة / تصميم' : 'Image / Design'}
            </Badge>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
              {isAr ? work.title_ar : work.title_en}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl bg-[#161616] border border-[#282828] flex items-center justify-center text-[#9B9B9B] hover:text-white hover:bg-[#222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Container with Cinematic Player */}
        <div
          ref={containerRef}
          onMouseMove={resetControlsTimer}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[68vh] overflow-hidden group select-none"
        >
          {work.media_type === 'video' ? (
            isYouTube ? (
              <div className="relative w-full aspect-video max-h-[68vh] flex items-center justify-center bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(work.media_url, settings) || ''}
                  title={isAr ? work.title_ar : work.title_en}
                  className="w-full h-full border-0 max-h-[68vh]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <>
                {/* Ambient Cinematic Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none z-10" />

              <video
                ref={videoRef}
                src={parsed.cleanUrl}
                poster={work.thumbnail_url || undefined}
                playsInline
                loop={settings.loop}
                muted={settings.mute || settings.autoplay || isMuted}
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
                className="w-full max-h-[68vh] object-contain cursor-pointer"
              />

              {/* Big Centered Play/Pause Overlay Indicator */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer bg-black/35 hover:bg-black/25 transition-colors"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#B51D19] to-[#080707] p-[2px] shadow-2xl shadow-[#B51D19]/20 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-white">
                      <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-current ml-1 text-white" />
                    </div>
                  </div>
                </button>
              )}

              {/* Bottom Custom Cinematic Control Bar */}
              {settings.controls !== false && (
                <div
                  className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-30 transition-opacity duration-300 ${
                    showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                {/* Scrubbable Progress Bar */}
                <div
                  ref={progressBarRef}
                  onClick={handleSeek}
                  className="relative w-full h-2 rounded-full bg-white/15 hover:h-2.5 transition-all cursor-pointer mb-3 group/bar overflow-hidden"
                >
                  {/* Buffer track */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-full"
                    style={{ width: `${bufferPercent}%` }}
                  />
                  {/* Progress track */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#B51D19] to-[#E63B32] rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Control Icons & Time Row */}
                <div className="flex items-center justify-between text-white text-xs gap-3">
                  {/* Left Controls: Play, Skips, Volume, Time */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                      title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkip(-10)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors hidden sm:block"
                      title="Rewind 10s"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkip(10)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors hidden sm:block"
                      title="Forward 10s"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-1.5 group/vol">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                        title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-5 h-5 text-rose-400" />
                        ) : volume < 0.5 ? (
                          <Volume1 className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 accent-[#B51D19] bg-white/20 rounded-lg cursor-pointer hidden sm:block opacity-75 group-hover/vol:opacity-100 transition-opacity"
                      />
                    </div>

                    {/* Time Counter */}
                    <span className="font-mono text-[11px] sm:text-xs text-[#C5C5C5] tracking-wide ml-1">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Right Controls: Speed, Fullscreen */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Playback speed toggle */}
                    <button
                      type="button"
                      onClick={togglePlaybackRate}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold tracking-tight text-white transition-colors"
                      title="Playback Speed"
                    >
                      {playbackRate}x
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                      title="Fullscreen (F)"
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </>
          )) : work.media_type === 'document' ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-[#151515] border border-[#282828] flex items-center justify-center text-[#38BDF8] shadow-2xl">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  {isAr ? work.title_ar : work.title_en}
                </h4>
                <p className="text-xs text-[#888]">
                  {isAr ? 'مستند رقمي مرفق' : 'Attached Digital Document'}
                </p>
              </div>
              <a href={work.media_url} target="_blank" rel="noreferrer" download>
                <Button variant="primary" size="md" icon={<ExternalLink className="w-4 h-4" />}>
                  {isAr ? 'فتح أو تحميل المستند' : 'Open or Download Document'}
                </Button>
              </a>
            </div>
          ) : (
            <img
              src={work.media_url}
              alt={work.title_ar}
              loading="lazy"
              className="w-full max-h-[68vh] object-contain"
            />
          )}
        </div>

        {/* Details Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1A1A1A] bg-[#0A0A0A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-20">
          <div>
            <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed max-w-xl">
              {isAr ? work.description_ar : work.description_en}
            </p>
          </div>

          {work.project_url && (
            <a href={work.project_url} target="_blank" rel="noreferrer" className="shrink-0">
              <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                {isAr ? 'زيارة رابط المشروع' : 'View Project'}
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}


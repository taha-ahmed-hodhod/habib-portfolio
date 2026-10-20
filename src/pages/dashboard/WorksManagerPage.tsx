import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Edit2, Image as ImageIcon, Star, AlertCircle, FileText, Play, Upload, Sliders } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Work, Category, Client } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediaUploader } from '@/components/media/MediaUploader'
import { deleteStorageMedia } from '@/services/storageService'
import { dataSync } from '@/services/dataSync'
import {
  isYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  parseVideoUrl,
  buildVideoUrl,
  type VideoPlaybackSettings,
} from '@/lib/youtube'

export const WorksManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [works, setWorks] = useState<Work[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingWork, setEditingWork] = useState<Partial<Work> | null>(null)
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string | null>(null)
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState<string | null>(null)

  // YouTube and Video Playback state
  const [videoSource, setVideoSource] = useState<'upload' | 'youtube'>('upload')
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('')
  const [youtubeError, setYoutubeError] = useState<string | null>(null)
  const [playbackSettings, setPlaybackSettings] = useState<VideoPlaybackSettings>({
    autoplay: false,
    mute: false,
    loop: false,
    controls: true,
    start: 0,
  })

  const fetchData = async () => {
    try {
      const [
        { data: worksData },
        { data: catsData },
        { data: clientsData },
      ] = await Promise.all([
        supabase.from('works').select('*, category:categories(*), client:clients(*)').order('sort_order', { ascending: true }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('clients').select('*').order('name_ar', { ascending: true }),
      ])

      if (worksData) setWorks(worksData)
      if (catsData) setCategories(catsData)
      if (clientsData) setClients(clientsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenAddModal = () => {
    setEditingWork({
      media_type: 'video',
      is_visible: true,
      is_featured: false,
      sort_order: works.length + 1,
    })
    setVideoSource('upload')
    setYoutubeUrlInput('')
    setYoutubeError(null)
    setPlaybackSettings({
      autoplay: false,
      mute: false,
      loop: false,
      controls: true,
      start: 0,
    })
    setOriginalMediaUrl(null)
    setOriginalThumbnailUrl(null)
    setErrorMessage(null)
    setShowModal(true)
  }

  const handleOpenEditModal = (w: Work) => {
    setEditingWork(w)
    setOriginalMediaUrl(w.media_url || null)
    setOriginalThumbnailUrl(w.thumbnail_url || null)

    const parsed = parseVideoUrl(w.media_url)
    setPlaybackSettings(parsed.settings)

    if (w.media_type === 'video' && parsed.isYouTube) {
      setVideoSource('youtube')
      setYoutubeUrlInput(parsed.cleanUrl)
      setYoutubeError(null)
    } else {
      setVideoSource('upload')
      setYoutubeUrlInput('')
      setYoutubeError(null)
    }
    setErrorMessage(null)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWork) return

    // Validate YouTube URL if video source is YouTube
    if (editingWork.media_type === 'video' && videoSource === 'youtube') {
      if (!editingWork.media_url || !isYouTubeUrl(editingWork.media_url)) {
        setErrorMessage(
          isAr
            ? 'يرجى إدخال رابط YouTube صالح (مثل: youtube.com/watch?v=... أو youtu.be/...)'
            : 'Please enter a valid YouTube URL (e.g. youtube.com/watch?v=... or youtu.be/...)'
        )
        return
      }
    } else if (!editingWork.media_url) {
      setErrorMessage(isAr ? 'يرجى رفع ملف الوسائط (فيديو أو صورة أو مستند)' : 'Please upload a media file (video, image, or document)')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    // Build final media_url including playback settings for video media
    let finalMediaUrl = editingWork.media_url || ''
    if (editingWork.media_type === 'video' && finalMediaUrl) {
      finalMediaUrl = buildVideoUrl(finalMediaUrl, playbackSettings)
    }

    // Automatically fall back to YouTube thumbnail if user didn't upload a custom thumbnail for YouTube video
    const fallbackThumb =
      editingWork.media_type === 'video' && isYouTubeUrl(finalMediaUrl)
        ? getYouTubeThumbnailUrl(finalMediaUrl, 'hq')
        : (editingWork.media_type === 'image' ? finalMediaUrl : null)

    const payload = {
      title_ar: editingWork.title_ar,
      title_en: editingWork.title_en || editingWork.title_ar,
      description_ar: editingWork.description_ar,
      description_en: editingWork.description_en,
      media_type: editingWork.media_type || 'video',
      media_url: finalMediaUrl,
      thumbnail_url: editingWork.thumbnail_url || fallbackThumb,
      category_id: editingWork.category_id || null,
      client_id: editingWork.client_id || null,
      project_url: editingWork.project_url,
      is_featured: editingWork.is_featured ?? false,
      is_visible: editingWork.is_visible ?? true,
      sort_order: editingWork.sort_order ?? 0,
    }

    try {
      let resultError = null

      if (editingWork.id) {
        const { error } = await supabase.from('works').update(payload).eq('id', editingWork.id)
        resultError = error
      } else {
        const { error } = await supabase.from('works').insert([payload])
        resultError = error
      }

      if (resultError) {
        throw new Error(resultError.message)
      }

      // Safe media cleanup: only delete old storage files if not YouTube and not matching new url
      if (originalMediaUrl && !isYouTubeUrl(originalMediaUrl) && originalMediaUrl !== editingWork.media_url) {
        await deleteStorageMedia(originalMediaUrl)
      }
      if (originalThumbnailUrl && !isYouTubeUrl(originalThumbnailUrl) && originalThumbnailUrl !== editingWork.thumbnail_url) {
        await deleteStorageMedia(originalThumbnailUrl)
      }

      dataSync.emit('works.updated')
      setShowModal(false)
      setEditingWork(null)
      setOriginalMediaUrl(null)
      setOriginalThumbnailUrl(null)
      setYoutubeUrlInput('')
      setYoutubeError(null)
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save work'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (work: Work) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا العمل؟' : 'Are you sure you want to delete this work?')) {
      const { error } = await supabase.from('works').delete().eq('id', work.id)
      if (!error) {
        if (work.media_url) await deleteStorageMedia(work.media_url)
        if (work.thumbnail_url && work.thumbnail_url !== work.media_url) {
          await deleteStorageMedia(work.thumbnail_url)
        }
        dataSync.emit('works.updated')
        fetchData()
      } else {
        alert(error.message)
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'الأعمال والمشاريع' : 'Works & Portfolio'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr ? 'إدارة فيديوهات الذكاء الاصطناعي والأعمال المميزة' : 'Manage AI videos and featured portfolio works'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAddModal}
        >
          {isAr ? 'إضافة عمل جديد' : 'New Work'}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[#0B0B0B] border-[#242424] overflow-hidden p-0 animate-pulse">
              <div className="aspect-video bg-[#141414]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#1C1C1C] rounded w-2/3" />
                <div className="h-3 bg-[#181818] rounded w-1/3" />
                <div className="h-3 bg-[#181818] rounded w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {works.map((w) => (
            <Card key={w.id} className="bg-[#0B0B0B] border-[#242424] overflow-hidden p-0 flex flex-col justify-between group">
              <div className="relative aspect-video bg-[#121212] overflow-hidden">
                {w.thumbnail_url ? (
                  <img src={w.thumbnail_url} alt={w.title_ar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : w.media_type === 'video' ? (
                  isYouTubeUrl(w.media_url) && getYouTubeThumbnailUrl(w.media_url) ? (
                    <img src={getYouTubeThumbnailUrl(w.media_url)!} alt={w.title_ar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <video
                      src={`${w.media_url}#t=0.001`}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#444]">
                    {w.media_type === 'document' ? (
                      <FileText className="w-8 h-8 text-[#38BDF8]" />
                    ) : (
                      <ImageIcon className="w-8 h-8" />
                    )}
                  </div>
                )}

              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <Badge variant="accent" className="bg-black/70 backdrop-blur-sm text-[10px]">
                  {w.media_type === 'video'
                    ? (isAr ? 'فيديو' : 'Video')
                    : w.media_type === 'document'
                    ? (isAr ? 'مستند' : 'Document')
                    : (isAr ? 'صورة' : 'Image')}
                </Badge>
                {w.is_featured && (
                  <Badge variant="dot" className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{isAr ? 'مميز' : 'Featured'}</span>
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-[#F5F5F5] text-sm">
                  {isAr ? w.title_ar : w.title_en}
                </h4>
                {w.client && (
                  <span className="text-[11px] text-[#E63B32] block mt-0.5">
                    {isAr ? w.client.name_ar : w.client.name_en}
                  </span>
                )}
                <p className="text-xs text-[#9B9B9B] mt-1.5 line-clamp-2">
                  {isAr ? w.description_ar : w.description_en}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1C1C1C]">
                <Badge variant={w.is_visible ? 'accent' : 'default'} className="text-[10px]">
                  {w.is_visible ? (isAr ? 'ظاهر' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}
                </Badge>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(w)}
                    className="p-1.5 rounded-lg text-[#9B9B9B] hover:text-white hover:bg-[#1A1A1A]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!loading && works.length === 0 && (
          <div className="col-span-full p-12 text-center text-sm text-[#777] border border-dashed border-[#242424] rounded-2xl">
            {isAr ? 'لا توجد أعمال مضافة بعد.' : 'No works added yet.'}
          </div>
        )}
      </div>
      )}

      {showModal && editingWork && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0B0B0B] border-[#242424] w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">
              {editingWork.id ? (isAr ? 'تعديل عمل' : 'Edit Work') : (isAr ? 'إضافة عمل جديد' : 'New Work')}
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'عنوان العمل (بالعربية)' : 'Title (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingWork.title_ar || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, title_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'عنوان العمل (بالإنجليزية)' : 'Title (English)'}
                </label>
                <input
                  type="text"
                  value={editingWork.title_en || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, title_en: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                    {isAr ? 'نوع الوسائط' : 'Media Type'}
                  </label>
                  <select
                    value={editingWork.media_type || 'video'}
                    onChange={(e) => setEditingWork({ ...editingWork, media_type: e.target.value as 'image' | 'video' | 'document' })}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                  >
                    <option value="video">{isAr ? 'فيديو سينمائي' : 'Video'}</option>
                    <option value="image">{isAr ? 'صورة / تصميم' : 'Image'}</option>
                    <option value="document">{isAr ? 'مستند (PDF / ملف)' : 'Document (PDF / File)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={editingWork.category_id || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, category_id: e.target.value || null })}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                  >
                    <option value="">{isAr ? 'بدون تصنيف' : 'Uncategorized'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isAr ? c.name_ar : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'العميل أو البراند المرتبط' : 'Associated Client'}
                </label>
                <select
                  value={editingWork.client_id || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, client_id: e.target.value || null })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                >
                  <option value="">{isAr ? 'لا يوجد عميل مرتبط' : 'None'}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.name_ar : c.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Media File Upload (Video, Document, or Image) */}
              {editingWork.media_type === 'video' ? (
                <div className="space-y-4">
                  {/* Video Source Switcher */}
                  <div>
                    <label className="block text-xs font-medium text-[#B3B3B3] mb-2">
                      {isAr ? 'مصدر الفيديو' : 'Video Source'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-[#121212] p-1 rounded-xl border border-[#262626]">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoSource('upload')
                          setEditingWork((prev) => ({
                            ...prev,
                            media_url: isYouTubeUrl(prev?.media_url || '') ? '' : prev?.media_url,
                          }))
                        }}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                          videoSource === 'upload'
                            ? 'bg-[#B51D19] text-white shadow-sm'
                            : 'text-[#9B9B9B] hover:text-white'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isAr ? 'رفع ملف فيديو' : 'Upload Video File'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoSource('youtube')
                          const initialUrl = isYouTubeUrl(editingWork.media_url || '')
                            ? editingWork.media_url || ''
                            : youtubeUrlInput
                          setEditingWork((prev) => ({
                            ...prev,
                            media_url: initialUrl,
                          }))
                        }}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                          videoSource === 'youtube'
                            ? 'bg-[#B51D19] text-white shadow-sm'
                            : 'text-[#9B9B9B] hover:text-white'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        YouTube
                      </button>
                    </div>
                  </div>

                  {videoSource === 'upload' ? (
                    <>
                      <MediaUploader
                        label={isAr ? 'ملف الفيديو (MP4, WebM)' : 'Video File (MP4, WebM)'}
                        folder="works/videos"
                        mediaType="video"
                        maxSizeBytes={100 * 1024 * 1024}
                        currentUrl={editingWork.media_url || undefined}
                        onUploadComplete={(url) => setEditingWork({ ...editingWork, media_url: url })}
                        onRemove={() => setEditingWork({ ...editingWork, media_url: '' })}
                      />

                      <MediaUploader
                        label={isAr ? 'الصورة المصغرة للغلاف (Thumbnail Poster)' : 'Video Thumbnail (Poster Image)'}
                        folder="works/thumbnails"
                        mediaType="image"
                        maxSizeBytes={10 * 1024 * 1024}
                        currentUrl={editingWork.thumbnail_url || undefined}
                        onUploadComplete={(url) => setEditingWork({ ...editingWork, thumbnail_url: url })}
                        onRemove={() => setEditingWork({ ...editingWork, thumbnail_url: '' })}
                      />
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                          {isAr ? 'رابط فيديو YouTube' : 'YouTube Video URL'}
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          value={youtubeUrlInput}
                          onChange={(e) => {
                            const val = e.target.value
                            setYoutubeUrlInput(val)
                            if (!val.trim()) {
                              setYoutubeError(null)
                              setEditingWork((prev) => ({ ...prev, media_url: '' }))
                            } else if (isYouTubeUrl(val.trim())) {
                              setYoutubeError(null)
                              const parsed = parseVideoUrl(val.trim())
                              if (parsed.settings.start && parsed.settings.start > 0) {
                                setPlaybackSettings((prev) => ({ ...prev, start: parsed.settings.start }))
                              }
                              setEditingWork((prev) => ({ ...prev, media_url: val.trim() }))
                            } else {
                              setYoutubeError(
                                isAr
                                  ? 'صيغة الرابط غير صحيحة. أمثلة مدعومة: youtube.com/watch?v=... أو youtu.be/...'
                                  : 'Invalid YouTube URL. Supported formats: youtube.com/watch?v=... or youtu.be/...'
                              )
                              setEditingWork((prev) => ({ ...prev, media_url: '' }))
                            }
                          }}
                          className={`w-full bg-[#121212] border ${
                            youtubeError ? 'border-red-500/50 focus:border-red-500' : 'border-[#262626] focus:border-[#B51D19]'
                          } rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none transition-colors`}
                          dir="ltr"
                        />
                        {youtubeError && (
                          <p className="text-xs text-red-400 mt-1">{youtubeError}</p>
                        )}
                        <p className="text-[11px] text-[#666] mt-1">
                          {isAr
                            ? 'يدعم روابط watch?v= و youtu.be و shorts/ و embed/'
                            : 'Supports watch?v=, youtu.be, shorts/, and embed/ URLs'}
                        </p>
                      </div>

                      {/* Live Preview */}
                      {isYouTubeUrl(youtubeUrlInput.trim()) && (
                        <div className="rounded-xl overflow-hidden border border-[#262626] bg-[#050505] p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-[#9B9B9B]">
                            <span className="flex items-center gap-1.5 font-medium text-[#F5F5F5]">
                              <Play className="w-3.5 h-3.5 text-[#E63B32]" />
                              {isAr ? 'معاينة مباشرة من YouTube' : 'Live YouTube Preview'}
                            </span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {isAr ? 'رابط صالح' : 'Valid URL'}
                            </span>
                          </div>
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-[#1a1a1a]">
                            <iframe
                              key={`${youtubeUrlInput}-${playbackSettings.autoplay}-${playbackSettings.mute}-${playbackSettings.loop}-${playbackSettings.controls}-${playbackSettings.start}`}
                              src={getYouTubeEmbedUrl(youtubeUrlInput.trim(), playbackSettings) || undefined}
                              title="YouTube Live Preview"
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}

                      {/* Optional Custom Thumbnail Poster */}
                      <MediaUploader
                        label={
                          isAr
                            ? 'الصورة المصغرة للغلاف (اختياري - يتم استخدام صورة YouTube تلقائياً في حال عدم الرفع)'
                            : 'Cover Thumbnail (Optional - defaults to YouTube cover if not provided)'
                        }
                        folder="works/thumbnails"
                        mediaType="image"
                        maxSizeBytes={10 * 1024 * 1024}
                        currentUrl={editingWork.thumbnail_url || undefined}
                        onUploadComplete={(url) => setEditingWork((prev) => ({ ...prev, thumbnail_url: url }))}
                        onRemove={() => setEditingWork((prev) => ({ ...prev, thumbnail_url: '' }))}
                      />
                    </div>
                  )}

                  {/* Video Playback Settings Section */}
                  <div className="rounded-2xl border border-[#242424] bg-[#0D0D0D] p-4 space-y-3.5 mt-2">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#1F1F1F]">
                      <span className="text-xs font-bold text-[#F5F5F5] flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-[#E63B32]" />
                        {isAr ? 'إعدادات تشغيل الفيديو' : 'Video Playback Settings'}
                      </span>
                      <span className="text-[10px] text-[#777]">
                        {videoSource === 'youtube'
                          ? (isAr ? 'مشغل YouTube المدمج' : 'Embedded YouTube Player')
                          : (isAr ? 'المشغل السينمائي المخصص' : 'Custom Cinematic Player')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Autoplay */}
                      <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#141414] border border-[#222] cursor-pointer hover:border-[#333] transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-medium text-white block">
                            {isAr ? 'تشغيل تلقائي' : 'Autoplay'}
                          </span>
                          <span className="text-[10px] text-[#777] block">
                            {isAr
                              ? 'المتصفح يتطلب كتم الصوت تلقائياً للبدء'
                              : 'Browsers require muted audio for autoplay'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={playbackSettings.autoplay ?? false}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPlaybackSettings((prev) => ({
                              ...prev,
                              autoplay: val,
                              mute: val ? true : prev.mute,
                            }))
                          }}
                          className="mt-1 w-4 h-4 rounded accent-[#B51D19] cursor-pointer"
                        />
                      </label>

                      {/* Mute by default */}
                      <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#141414] border border-[#222] cursor-pointer hover:border-[#333] transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-medium text-white block">
                            {isAr ? 'كتم الصوت افتراضياً' : 'Mute by Default'}
                          </span>
                          <span className="text-[10px] text-[#777] block">
                            {isAr ? 'يبدأ الفيديو بمستوى صوت مكتوم' : 'Initializes video in muted state'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={playbackSettings.mute ?? false}
                          onChange={(e) =>
                            setPlaybackSettings((prev) => ({ ...prev, mute: e.target.checked }))
                          }
                          className="mt-1 w-4 h-4 rounded accent-[#B51D19] cursor-pointer"
                        />
                      </label>

                      {/* Loop */}
                      <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#141414] border border-[#222] cursor-pointer hover:border-[#333] transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-medium text-white block">
                            {isAr ? 'تكرار التشغيل (Loop)' : 'Loop Playback'}
                          </span>
                          <span className="text-[10px] text-[#777] block">
                            {isAr ? 'إعادة تشغيل الفيديو فور انتهائه' : 'Repeats video continuously'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={playbackSettings.loop ?? false}
                          onChange={(e) =>
                            setPlaybackSettings((prev) => ({ ...prev, loop: e.target.checked }))
                          }
                          className="mt-1 w-4 h-4 rounded accent-[#B51D19] cursor-pointer"
                        />
                      </label>

                      {/* Player Controls */}
                      <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#141414] border border-[#222] cursor-pointer hover:border-[#333] transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-medium text-white block">
                            {isAr ? 'عناصر التحكم' : 'Player Controls'}
                          </span>
                          <span className="text-[10px] text-[#777] block">
                            {isAr ? 'إظهار شريط وأزرار التحكم' : 'Display player control bar'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={playbackSettings.controls ?? true}
                          onChange={(e) =>
                            setPlaybackSettings((prev) => ({ ...prev, controls: e.target.checked }))
                          }
                          className="mt-1 w-4 h-4 rounded accent-[#B51D19] cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Start Time */}
                    <div className="pt-1">
                      <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                        {isAr ? 'وقت البدء (بالثواني)' : 'Start Time (in seconds)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={playbackSettings.start || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                          setPlaybackSettings((prev) => ({ ...prev, start: val }))
                        }}
                        className="w-full bg-[#121212] border border-[#262626] focus:border-[#B51D19] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-colors"
                        dir="ltr"
                      />
                      <p className="text-[10px] text-[#666] mt-1">
                        {isAr
                          ? 'يبدأ تشغيل الفيديو من هذه الثانية المحددة (اتركه فارغاً أو 0 للبدء من البداية)'
                          : 'Starts playback at the specified second (leave empty or 0 to start from the beginning)'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : editingWork.media_type === 'document' ? (
                <>
                  <MediaUploader
                    label={isAr ? 'ملف المستند (PDF, Word, Excel)' : 'Document File (PDF, Word, Excel)'}
                    folder="works/documents"
                    mediaType="document"
                    maxSizeBytes={30 * 1024 * 1024}
                    currentUrl={editingWork.media_url || undefined}
                    onUploadComplete={(url) => setEditingWork({ ...editingWork, media_url: url })}
                    onRemove={() => setEditingWork({ ...editingWork, media_url: '' })}
                  />

                  <MediaUploader
                    label={isAr ? 'غلاف المستند الاختياري (Thumbnail)' : 'Optional Document Cover (Thumbnail)'}
                    folder="works/thumbnails"
                    mediaType="image"
                    maxSizeBytes={10 * 1024 * 1024}
                    currentUrl={editingWork.thumbnail_url || undefined}
                    onUploadComplete={(url) => setEditingWork({ ...editingWork, thumbnail_url: url })}
                    onRemove={() => setEditingWork({ ...editingWork, thumbnail_url: '' })}
                  />
                </>
              ) : (
                <MediaUploader
                  label={isAr ? 'صورة العمل (JPEG, PNG, WebP)' : 'Work Image (JPEG, PNG, WebP)'}
                  folder="works/images"
                  mediaType="image"
                  maxSizeBytes={10 * 1024 * 1024}
                  currentUrl={editingWork.media_url || undefined}
                  onUploadComplete={(url) =>
                    setEditingWork({
                      ...editingWork,
                      media_url: url,
                      thumbnail_url: url,
                    })
                  }
                  onRemove={() =>
                    setEditingWork({
                      ...editingWork,
                      media_url: '',
                      thumbnail_url: '',
                    })
                  }
                />
              )}

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'رابط المشروع الخارجي (اختياري)' : 'Project External URL (Optional)'}
                </label>
                <input
                  type="url"
                  value={editingWork.project_url || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, project_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={editingWork.description_ar || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, description_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-[#D1D1D1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingWork.is_featured ?? false}
                    onChange={(e) => setEditingWork({ ...editingWork, is_featured: e.target.checked })}
                    className="rounded border-[#303030] text-[#B51D19] accent-[#B51D19]"
                  />
                  <span>{isAr ? 'تمييز العمل في الصفحة الرئيسية' : 'Feature on homepage'}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#D1D1D1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingWork.is_visible ?? true}
                    onChange={(e) => setEditingWork({ ...editingWork, is_visible: e.target.checked })}
                    className="rounded border-[#303030] text-[#B51D19] accent-[#B51D19]"
                  />
                  <span>{isAr ? 'إظهار العمل' : 'Visible'}</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1F1F1F]">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" variant="primary" isLoading={saving}>
                  {isAr ? 'حفظ العمل' : 'Save Work'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SocialLink } from '@/types/database'
import { dataSync } from '@/services/dataSync'

let cachedLinks: SocialLink[] | null = null
let fetchPromise: Promise<SocialLink[]> | null = null

async function fetchSocialLinks(): Promise<SocialLink[]> {
  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('owner_type', 'profile')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

    if (!error && data) {
      cachedLinks = data
      return data
    }
    return cachedLinks || []
  } catch (err) {
    console.warn('fetchSocialLinks error:', err)
    return cachedLinks || []
  }
}

/**
 * Shared hook for profile dynamic links.
 * Avoids duplicate requests between Hero and Footer.
 * Subscribes to immediate dataSync events.
 */
export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>(() => cachedLinks || [])
  const [loading, setLoading] = useState<boolean>(() => !cachedLinks)

  const loadLinks = async () => {
    if (!fetchPromise) {
      fetchPromise = fetchSocialLinks().finally(() => {
        fetchPromise = null
      })
    }
    const result = await fetchPromise
    setLinks(result)
    setLoading(false)
  }

  useEffect(() => {
    loadLinks()

    const unsub = dataSync.on('links.updated', () => {
      cachedLinks = null
      loadLinks()
    })

    return () => unsub()
  }, [])

  const heroLinks = links.filter((l) => l.show_in_hero !== false)
  const footerLinks = links.filter((l) => l.show_in_footer !== false)

  return {
    links,
    heroLinks,
    footerLinks,
    loading,
    refresh: loadLinks,
  }
}

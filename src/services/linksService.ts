import { supabase } from '@/lib/supabase'
import type { SocialLink, OwnerType } from '@/types/database'
import { dataSync } from './dataSync'

/**
 * Fetch dynamic links for a specific entity (profile, page, client)
 */
export async function getEntityLinks(
  ownerType: OwnerType,
  ownerId?: string | null,
  includeHidden = false
): Promise<SocialLink[]> {
  try {
    let query = supabase
      .from('social_links')
      .select('*')
      .eq('owner_type', ownerType)
      .order('sort_order', { ascending: true })

    if (!includeHidden) {
      query = query.eq('is_visible', true)
    }

    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }

    const { data, error } = await query
    if (error) {
      console.warn(`Error fetching links for ${ownerType}:`, error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error('getEntityLinks exception:', err)
    return []
  }
}

/**
 * Fetch all page links grouped by page ID
 */
export async function getAllPageLinks(includeHidden = false): Promise<Record<string, SocialLink[]>> {
  try {
    let query = supabase
      .from('social_links')
      .select('*')
      .eq('owner_type', 'page')
      .order('sort_order', { ascending: true })

    if (!includeHidden) {
      query = query.eq('is_visible', true)
    }

    const { data, error } = await query

    if (error || !data) return {}

    const map: Record<string, SocialLink[]> = {}
    data.forEach((link) => {
      if (!map[link.owner_id]) map[link.owner_id] = []
      map[link.owner_id].push(link)
    })
    return map
  } catch (err) {
    console.error('getAllPageLinks error:', err)
    return {}
  }
}

/**
 * Fetch all client links grouped by client ID
 */
export async function getAllClientLinks(includeHidden = false): Promise<Record<string, SocialLink[]>> {
  try {
    let query = supabase
      .from('social_links')
      .select('*')
      .eq('owner_type', 'client')
      .order('sort_order', { ascending: true })

    if (!includeHidden) {
      query = query.eq('is_visible', true)
    }

    const { data, error } = await query

    if (error || !data) return {}

    const map: Record<string, SocialLink[]> = {}
    data.forEach((link) => {
      if (!map[link.owner_id]) map[link.owner_id] = []
      map[link.owner_id].push(link)
    })
    return map
  } catch (err) {
    console.error('getAllClientLinks error:', err)
    return {}
  }
}

/**
 * Save / sync links for an entity (page, client, or profile)
 */
export async function saveEntityLinks(
  ownerType: OwnerType,
  ownerId: string,
  links: Partial<SocialLink>[]
): Promise<void> {
  try {
    // 1. Delete existing links for this owner
    const { error: deleteError } = await supabase
      .from('social_links')
      .delete()
      .eq('owner_type', ownerType)
      .eq('owner_id', ownerId)

    if (deleteError) {
      console.error('saveEntityLinks delete error:', deleteError)
      throw deleteError
    }

    // 2. Filter valid links with non-empty URLs
    const validLinks = links.filter((l) => l.url && l.url.trim() !== '')

    // 3. Insert new links
    if (validLinks.length > 0) {
      const isProfile = ownerType === 'profile'
      const payload = validLinks.map((link, idx) => {
        let finalUrl = (link.url || '').trim()
        if (finalUrl && !/^(https?:\/\/|mailto:|tel:)/i.test(finalUrl)) {
          finalUrl = `https://${finalUrl}`
        }

        return {
          owner_type: ownerType,
          owner_id: ownerId,
          platform: link.platform || 'Custom',
          label_ar: link.label_ar || link.platform || 'رابط',
          label_en: link.label_en || link.platform || 'Link',
          url: finalUrl,
          icon: link.icon || 'link',
          sort_order: link.sort_order ?? idx + 1,
          is_visible: link.is_visible ?? true,
          show_in_hero: isProfile ? (link.show_in_hero ?? true) : false,
          show_in_footer: isProfile ? (link.show_in_footer ?? true) : false,
        }
      })

      const { error: insertError } = await supabase.from('social_links').insert(payload)
      if (insertError) {
        console.error('saveEntityLinks insert error:', insertError)
        throw insertError
      }
    }

    dataSync.emit('links.updated')
  } catch (err) {
    console.error('saveEntityLinks error:', err)
    throw err
  }
}

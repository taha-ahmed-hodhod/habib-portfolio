import { supabase } from '@/lib/supabase'
import type { SocialLink, OwnerType } from '@/types/database'
import { dataSync } from './dataSync'

/**
 * Fetch dynamic links for a specific entity (profile, page, client)
 */
export async function getEntityLinks(
  ownerType: OwnerType,
  ownerId?: string | null
): Promise<SocialLink[]> {
  try {
    let query = supabase
      .from('social_links')
      .select('*')
      .eq('owner_type', ownerType)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

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
export async function getAllPageLinks(): Promise<Record<string, SocialLink[]>> {
  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('owner_type', 'page')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

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
 * Save / sync links for an entity (page, client, or profile)
 */
export async function saveEntityLinks(
  ownerType: OwnerType,
  ownerId: string,
  links: Partial<SocialLink>[]
): Promise<void> {
  try {
    // 1. Delete existing links for this owner
    await supabase.from('social_links').delete().eq('owner_type', ownerType).eq('owner_id', ownerId)

    // 2. Insert new links
    if (links.length > 0) {
      const payload = links.map((link, idx) => ({
        owner_type: ownerType,
        owner_id: ownerId,
        platform: link.platform || 'Custom',
        label_ar: link.label_ar || link.platform || 'رابط',
        label_en: link.label_en || link.platform || 'Link',
        url: link.url || 'https://',
        icon: link.icon || 'link',
        sort_order: link.sort_order ?? idx + 1,
        is_visible: link.is_visible ?? true,
        show_in_hero: link.show_in_hero ?? true,
        show_in_footer: link.show_in_footer ?? true,
      }))

      const { error: insertError } = await supabase.from('social_links').insert(payload)
      if (insertError) {
        console.warn('saveEntityLinks insert warning:', insertError.message)
      }
    }

    dataSync.emit('links.updated')
  } catch (err) {
    console.error('saveEntityLinks error:', err)
  }
}

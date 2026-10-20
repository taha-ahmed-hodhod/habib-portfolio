import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import { dataSync } from '@/services/dataSync'

let cachedProfile: Profile | null = null
let fetchPromise: Promise<Profile | null> | null = null

export async function fetchProfile(): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      cachedProfile = data
      return data
    }
    return cachedProfile
  } catch (err) {
    console.warn('fetchProfile error:', err)
    return cachedProfile
  }
}

/**
 * Shared hook for the single source of truth Profile data.
 * Used by HeroSection, Navbar, GlobalInitialLoader, and DashboardLayout.
 * Subscribes to immediate local dataSync and multi-tab Supabase Realtime events.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(() => cachedProfile)
  const [loading, setLoading] = useState<boolean>(() => !cachedProfile)

  const load = async () => {
    if (!fetchPromise) {
      fetchPromise = fetchProfile().finally(() => {
        fetchPromise = null
      })
    }
    const result = await fetchPromise
    if (result) {
      setProfile(result)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()

    const unsub = dataSync.on('profile.updated', (updatedProfile?: Profile) => {
      if (updatedProfile && updatedProfile.id) {
        cachedProfile = updatedProfile
        setProfile(updatedProfile)
      } else {
        cachedProfile = null
        load()
      }
    })

    return () => unsub()
  }, [])

  return {
    profile,
    loading,
    avatarUrl: profile?.avatar_url || null,
    refresh: load,
  }
}

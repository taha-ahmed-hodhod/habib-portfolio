import { supabase } from '@/lib/supabase'

export type SyncEventType =
  | 'profile.updated'
  | 'clients.updated'
  | 'pages.updated'
  | 'works.updated'
  | 'categories.updated'
  | 'testimonials.updated'
  | 'site_settings.updated'
  | 'social_links.updated'
  | 'links.updated'

type SyncListener<T = unknown> = (payload?: T) => void

/**
 * Lightweight in-memory event bus for immediate, zero-latency
 * synchronization between Dashboard actions and Public UI within the same SPA session.
 */
class DataSyncService {
  private listeners: Map<SyncEventType, Set<SyncListener>> = new Map()
  private realtimeChannel: ReturnType<typeof supabase.channel> | null = null

  /**
   * Subscribe a component callback to a specific sync event.
   * Returns an unsubscribe function for cleanup in useEffect.
   */
  subscribe<T = unknown>(event: SyncEventType, callback: SyncListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const set = this.listeners.get(event)!
    set.add(callback as SyncListener)

    return () => {
      set.delete(callback as SyncListener)
      if (set.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Alias for subscribe (standard event listener syntax).
   */
  on<T = unknown>(event: SyncEventType, callback: SyncListener<T>): () => void {
    return this.subscribe(event, callback)
  }

  /**
   * Emit an event immediately after a successful mutation.
   * Notifies all registered listeners in the current SPA session with zero latency.
   */
  emit<T = unknown>(event: SyncEventType, payload?: T): void {
    const set = this.listeners.get(event)
    if (set) {
      set.forEach((listener) => {
        try {
          listener(payload)
        } catch (err) {
          console.error(`Error in sync listener for ${event}:`, err)
        }
      })
    }
  }

  /**
   * Initialize Supabase Realtime subscription to handle multi-tab/cross-session sync.
   * Listens to Postgres changes on all application tables.
   */
  initRealtime(): void {
    if (this.realtimeChannel) return

    this.realtimeChannel = supabase
      .channel('habib-portfolio-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => this.emit('profile.updated', payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => this.emit('clients.updated', payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolio_pages' },
        (payload) => this.emit('pages.updated', payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'works' },
        (payload) => this.emit('works.updated', payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => this.emit('categories.updated', payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'testimonials' },
        (payload) => this.emit('testimonials.updated', payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => this.emit('site_settings.updated', payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_links' },
        (payload) => {
          this.emit('social_links.updated', payload.new)
          this.emit('links.updated', payload.new)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected successfully
        }
      })
  }

  /**
   * Teardown the realtime channel when cleaning up.
   */
  destroyRealtime(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel)
      this.realtimeChannel = null
    }
  }
}

export const dataSync = new DataSyncService()

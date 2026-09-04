import { useCallback, useRef, useState } from 'react'
import { syncPlayer } from 'core/sync/sync-player'
import type { PlayerProfile, Battle } from 'core/domain/player'
import { ClashApiError, messageFor } from 'core/clash-api/errors'
import { repo, api, now } from './repo'

type Status = 'idle' | 'syncing' | 'ready' | 'error'

export function useSync() {
  const [status, setStatus] = useState<Status>('idle')
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [battles, setBattles] = useState<Battle[]>([])
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const run = useCallback(async (tag: string) => {
    if (inFlight.current) return
    inFlight.current = true
    setStatus('syncing'); setError(null)
    try {
      await syncPlayer(tag, { repo, api, now })
      setProfile(await api.getPlayer(tag))
      setBattles(await repo.getBattles())
      setStatus('ready')
    } catch (e) {
      setError(e instanceof ClashApiError ? messageFor(e.code) : 'Erreur inattendue.')
      setStatus('error')
    } finally {
      inFlight.current = false
    }
  }, [])

  return { status, profile, battles, error, run }
}

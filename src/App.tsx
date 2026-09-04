import { useEffect, useState } from 'react'
import './App.css'
import { Onboarding } from './screens/Onboarding'
import { Profile } from './screens/Profile'
import { useSync } from './state/useSync'
import { repo } from './state/repo'

export default function App() {
  const { status, profile, battles, error, run } = useSync()
  const [knownTag, setKnownTag] = useState<string | null | undefined>(undefined)

  useEffect(() => { repo.getSettings().then((s) => setKnownTag(s.playerTag)) }, [])
  useEffect(() => { if (knownTag) run(knownTag) }, [knownTag, run])

  if (knownTag === undefined) return <p>Chargement…</p>

  if (!knownTag && !profile) {
    return (
      <>
        <Onboarding onSubmit={(tag) => { setKnownTag(tag); }} />
        {error && <p className="error">{error}</p>}
      </>
    )
  }

  if (!profile) return <p>{status === 'error' ? <span className="error">{error}</span> : 'Synchronisation…'}</p>

  return (
    <>
      <Profile
        profile={profile} battles={battles}
        syncing={status === 'syncing'}
        onRefresh={() => knownTag && run(knownTag)}
      />
      {error && <p className="error">{error}</p>}
    </>
  )
}

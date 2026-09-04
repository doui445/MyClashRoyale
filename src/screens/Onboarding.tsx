import { useState } from 'react'
import { isValidTag, normalizeTag } from 'core/domain/tag'

export function Onboarding({ onSubmit }: { onSubmit: (tag: string) => void }) {
  const [value, setValue] = useState('')
  const valid = isValidTag(value)
  return (
    <form
      className="onboarding"
      onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(normalizeTag(value)) }}
    >
      <label htmlFor="tag">Ton tag joueur Clash Royale</label>
      <input
        id="tag" value={value} placeholder="#2PP0LYQ" autoCapitalize="characters"
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" disabled={!valid}>Se connecter</button>
      {value.length > 0 && !valid && <p className="hint">Format de tag invalide.</p>}
    </form>
  )
}

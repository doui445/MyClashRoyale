import type { PlayerProfile, Battle } from 'core/domain/player'
import { hasEvo, hasHero } from 'core/domain/card'

export function Profile({
  profile, battles, onRefresh, syncing,
}: {
  profile: PlayerProfile; battles: Battle[]; onRefresh: () => void; syncing: boolean
}) {
  return (
    <div className="profile">
      <header>
        <h1>{profile.name} <span>{profile.tag}</span></h1>
        <button onClick={onRefresh} disabled={syncing}>
          {syncing ? 'Synchro…' : 'Rafraîchir'}
        </button>
      </header>
      <p>{profile.trophies} 🏆 (record {profile.bestTrophies}) · Roi niv. {profile.kingLevel} · {profile.arena}</p>

      <h2>Cartes ({profile.cards.length})</h2>
      <p className="legend">✦ évolution débloquée · 👑 héros débloqué</p>
      <ul className="cards">
        {profile.cards.map((c) => (
          <li key={c.cardId}>
            {c.name} — niv. {c.level}/{c.maxLevel}
            {hasEvo(c) && <span title="Évolution débloquée" aria-label="évolution débloquée"> ✦</span>}
            {hasHero(c) && <span title="Héros débloqué" aria-label="héros débloqué"> 👑</span>}
          </li>
        ))}
      </ul>

      <h2>25 derniers combats</h2>
      <ul className="battles">
        {battles.slice(-25).reverse().map((b) => (
          <li key={b.id}>
            {b.result === 'win' ? '✅' : b.result === 'loss' ? '❌' : '➖'} {b.mode} · {b.crownsFor}-{b.crownsAgainst} · {b.trophyChange >= 0 ? '+' : ''}{b.trophyChange}
          </li>
        ))}
      </ul>
    </div>
  )
}

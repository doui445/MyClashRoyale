import type { CardState, CardLevelEvent } from 'core/domain/card'

export function diffCardStates(
  previous: CardState[],
  current: CardState[],
  at: string,
): CardLevelEvent[] {
  const prev = new Map(previous.map((c) => [c.cardId, c]))
  const events: CardLevelEvent[] = []
  for (const cur of current) {
    const p = prev.get(cur.cardId)
    const fromLevel = p?.level ?? 0
    const fromCount = p?.count ?? 0
    if (fromLevel !== cur.level || fromCount !== cur.count) {
      events.push({
        cardId: cur.cardId, at,
        fromLevel, toLevel: cur.level,
        fromCount, toCount: cur.count,
      })
    }
  }
  return events
}

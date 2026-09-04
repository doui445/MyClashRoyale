export type ClashApiErrorCode = 'NOT_FOUND' | 'RATE_LIMITED' | 'MAINTENANCE' | 'OFFLINE' | 'UNKNOWN'

export class ClashApiError extends Error {
  code: ClashApiErrorCode

  constructor(code: ClashApiErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
    this.name = 'ClashApiError'
  }
}

const MESSAGES: Record<ClashApiErrorCode, string> = {
  NOT_FOUND: 'Tag introuvable. Vérifie les caractères (le 0 et le O se confondent).',
  RATE_LIMITED: 'Trop de requêtes, réessaie dans un instant.',
  MAINTENANCE: 'API Clash Royale en maintenance (souvent pendant les mises à jour du jeu).',
  OFFLINE: 'Pas de connexion.',
  UNKNOWN: 'Erreur inattendue.',
}

export function messageFor(code: ClashApiErrorCode): string {
  return MESSAGES[code]
}

// Alphabet des tags Supercell (pas de I, O, S, T, W, Z, etc.).
const TAG_CHARS = '0289PYLQGRJCUV'
const TAG_RE = new RegExp(`^#[${TAG_CHARS}]{3,12}$`)

export function normalizeTag(input: string): string {
  const body = input.trim().toUpperCase().replace(/^#/, '').replace(/O/g, '0')
  return `#${body}`
}

export function isValidTag(input: string): boolean {
  return TAG_RE.test(normalizeTag(input))
}

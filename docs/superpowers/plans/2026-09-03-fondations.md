# Plan d'implémentation — Fondations (MVP, phase 1/3)

> **Pour les workers agentiques :** SOUS-SKILL REQUISE : utiliser
> `superpowers:subagent-driven-development` (recommandé) ou
> `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les
> étapes utilisent la syntaxe case à cocher (`- [ ]`).

**Goal :** une PWA où l'utilisateur saisit son tag joueur Clash Royale, l'app
synchronise via notre relais, et persiste + affiche le profil brut et le
battlelog.

**Architecture :** PWA React + Vite. Logique métier en TypeScript pur dans
`core/`, sans dépendance React ni navigateur. Persistance locale dans IndexedDB
via Dexie, cachée derrière l'interface `Repository` de `storage/`. Un relais
serverless (Cloudflare Pages Function) détient la clé de l'API Clash Royale et
fait du pass-through vers `proxy.royaleapi.com`.

**Tech Stack :** TypeScript, React 19, Vite 6, `vite-plugin-pwa`, Dexie 4,
Vitest, `fake-indexeddb`, Cloudflare Pages Functions, Wrangler.

**Spec :** `docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md`

## Global Constraints

- **Langue de l'UI et des messages utilisateur : français.**
- **`core/` et `storage/core-facing` n'importent JAMAIS React, le DOM, Dexie ni
  `window`.** Seule l'implémentation concrète dans `storage/dexie/` connaît Dexie.
- **La clé de l'API Clash Royale ne doit jamais apparaître dans le repo ni dans
  le bundle client.** C'est un secret Cloudflare (`CLASH_API_TOKEN`), et en
  local un fichier `.dev.vars` (déjà dans `.gitignore`).
- **Repo public** : aucun tag joueur réel, aucune donnée perso dans le code, les
  tests ou les commits. Les fixtures de test utilisent des tags factices et des
  données anonymisées.
- **Format des `cardId` : slug en kebab-case** dérivé du nom de carte de l'API
  (`Hog Rider` → `hog-rider`). Une seule fonction fait cette conversion.
- Commits fréquents, un par tâche minimum. Messages en français, format
  Conventional Commits.
- Chaque commit de tâche se termine par le trailer :
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`

---

## Structure de fichiers (créée par ce plan)

| Fichier | Responsabilité |
|---|---|
| `package.json`, `tsconfig*.json`, `vite.config.ts`, `index.html` | Scaffold Vite + React + TS + PWA + Vitest |
| `src/main.tsx`, `src/App.tsx` | Point d'entrée React, coquille de l'app |
| `src/pwa.ts` | Enregistrement du service worker (`virtual:pwa-register`) |
| `core/domain/card.ts` | Types `Card`, `CardState`, `CardLevelEvent`, `Rarity` |
| `core/domain/player.ts` | Types `PlayerProfile`, `Battle`, `SyncSnapshot` |
| `core/domain/ids.ts` | `toCardSlug(name: string): string` |
| `core/clash-api/types.ts` | Types bruts de la réponse du relais (`RawPlayer`, `RawBattle`) |
| `core/clash-api/client.ts` | `ClashApiClient` : appelle le relais, mappe vers le domaine, mappe les erreurs |
| `core/clash-api/errors.ts` | `ClashApiError` + codes (`NOT_FOUND`, `RATE_LIMITED`, `MAINTENANCE`, `OFFLINE`, `UNKNOWN`) |
| `core/clash-api/normalize.ts` | `normalizeCardLevel(apiLevel, apiMaxLevel): number` |
| `storage/repository.ts` | Interface `Repository` (contrat consommé par `core/`) |
| `storage/dexie/db.ts` | Schéma Dexie (les stores) |
| `storage/dexie/dexie-repository.ts` | Implémentation `DexieRepository implements Repository` |
| `storage/memory-repository.ts` | Implémentation en mémoire, pour les tests de `core/` |
| `core/sync/diff.ts` | `diffCardStates(previous, current): CardLevelEvent[]` (pure) |
| `core/sync/sync-player.ts` | `syncPlayer(deps): Promise<SyncResult>` orchestrateur |
| `functions/api/player/[tag].ts` | Relais : profil joueur |
| `functions/api/player/[tag]/battles.ts` | Relais : battlelog |
| `functions/api/cards.ts` | Relais : catalogue de cartes |
| `functions/_shared/proxy.ts` | `proxyToClashApi(env, path): Promise<Response>` mutualisé |
| `src/screens/Onboarding.tsx` | Saisie + validation du tag |
| `src/screens/Profile.tsx` | Affichage brut profil + battlelog |
| `src/state/useSync.ts` | Hook React : déclenche `syncPlayer`, expose l'état |
| `wrangler.toml` | Config Pages (dev local) |

---

## Task 1: Scaffold Vite + React + TS + Vitest + PWA

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`,
  `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/pwa.ts`
- Modify: `.gitignore` (ajouter `coverage/`)
- Test: `core/domain/ids.test.ts`

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `test`, `test:watch` ; alias TS `core/*`,
  `storage/*` ; `toCardSlug` (défini ici, Task 1 pour avoir un premier test qui
  tourne).

- [ ] **Step 1: Créer `package.json`**

```json
{
  "name": "clash-royale-coach",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "pages:dev": "wrangler pages dev --proxy 5173 -- npm run dev"
  },
  "dependencies": {
    "dexie": "^4.0.11",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vite-plugin-pwa": "^0.21.1",
    "vitest": "^2.1.8",
    "workbox-window": "^7.3.0",
    "wrangler": "^3.95.0"
  }
}
```

- [ ] **Step 2: Créer `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "types": ["vite/client", "vite-plugin-pwa/react"],
    "baseUrl": ".",
    "paths": {
      "core/*": ["core/*"],
      "storage/*": ["storage/*"]
    }
  },
  "include": ["src", "core", "storage", "functions"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Créer `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Créer `vite.config.ts`** (Vite + React + PWA + Vitest dans le même fichier)

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      core: new URL('./core', import.meta.url).pathname,
      storage: new URL('./storage', import.meta.url).pathname,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Clash Royale Coach',
        short_name: 'CR Coach',
        description: 'Conseils de deck et de progression pour Clash Royale',
        theme_color: '#1e293b',
        background_color: '#1e293b',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/meta-decks.json',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'meta-decks', expiration: { maxEntries: 4 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['{core,storage,functions}/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['src/**', 'jsdom']],
  },
})
```

- [ ] **Step 5: Créer `index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Clash Royale Coach</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Créer `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
```

- [ ] **Step 7: Créer `src/pwa.ts`**

```ts
import { registerSW } from 'virtual:pwa-register'

export function initPwa(): void {
  registerSW({ immediate: true })
}
```

- [ ] **Step 8: Créer `src/App.tsx`**

```tsx
export default function App() {
  return <h1>Clash Royale Coach</h1>
}
```

- [ ] **Step 9: Créer `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initPwa } from './pwa'

initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 10: Écrire le test qui échoue `core/domain/ids.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { toCardSlug } from './ids'

describe('toCardSlug', () => {
  it('met en kebab-case', () => {
    expect(toCardSlug('Hog Rider')).toBe('hog-rider')
  })
  it('supprime les apostrophes et points', () => {
    expect(toCardSlug('P.E.K.K.A')).toBe('pekka')
    expect(toCardSlug('The Log')).toBe('the-log')
  })
  it('gère les accents et la casse', () => {
    expect(toCardSlug('Barb' + 'è' + 'res')).toBe('barberes')
  })
})
```

- [ ] **Step 11: `npm install` puis lancer le test — il doit échouer**

Run: `npm install && npm test`
Expected: FAIL — `Cannot find module './ids'`

- [ ] **Step 12: Créer `core/domain/ids.ts`**

```ts
/** Convertit un nom de carte de l'API en slug stable kebab-case. */
export function toCardSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .toLowerCase()
    .replace(/[.'']/g, '') // ponctuation interne (P.E.K.K.A, Goblin's...)
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 13: Lancer le test — il doit passer**

Run: `npm test`
Expected: PASS (3 assertions)

- [ ] **Step 14: Vérifier le build**

Run: `npm run build`
Expected: build OK, `dist/` généré avec `sw.js` et `manifest.webmanifest`.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: scaffold PWA (Vite + React + TS + Vitest + vite-plugin-pwa)"
```

---

## Task 2: Types du domaine

**Files:**
- Create: `core/domain/card.ts`, `core/domain/player.ts`
- Test: `core/domain/card.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces :
  - `type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'champion'`
  - `interface CardState { cardId: string; name: string; level: number;
    maxLevel: number; count: number; rarity: Rarity; elixir: number;
    evoLevel: number }`
  - `interface CardLevelEvent { cardId: string; at: string; fromLevel: number;
    toLevel: number; fromCount: number; toCount: number }`
  - `interface PlayerProfile { tag: string; name: string; trophies: number;
    bestTrophies: number; kingLevel: number; arena: string;
    cards: CardState[] }`
  - `interface Battle { id: string; at: string; mode: string;
    result: 'win' | 'loss' | 'draw'; crownsFor: number; crownsAgainst: number;
    trophyChange: number; myDeck: string[]; oppDeck: string[] }`
  - `interface SyncSnapshot { at: string; trophies: number; kingLevel: number;
    arena: string }`

- [ ] **Step 1: Écrire le test qui échoue `core/domain/card.test.ts`**

```ts
import { describe, it, expectTypeOf } from 'vitest'
import type { CardState, CardLevelEvent, Rarity } from './card'

describe('types de carte', () => {
  it('CardState a la forme attendue', () => {
    const c: CardState = {
      cardId: 'hog-rider', name: 'Hog Rider', level: 11, maxLevel: 14,
      count: 0, rarity: 'rare', elixir: 4, evoLevel: 0,
    }
    expectTypeOf(c.rarity).toEqualTypeOf<Rarity>()
  })
  it('CardLevelEvent a la forme attendue', () => {
    const e: CardLevelEvent = {
      cardId: 'hog-rider', at: '2026-09-03T10:00:00.000Z',
      fromLevel: 10, toLevel: 11, fromCount: 5, toCount: 0,
    }
    expectTypeOf(e.at).toBeString()
  })
})
```

- [ ] **Step 2: Lancer — échoue**

Run: `npm test -- core/domain/card.test.ts`
Expected: FAIL — `Cannot find module './card'`

- [ ] **Step 3: Créer `core/domain/card.ts`**

```ts
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'champion'

export interface CardState {
  cardId: string
  name: string
  /** Niveau "joueur" normalisé (1..maxLevel du jeu), voir normalizeCardLevel. */
  level: number
  maxLevel: number
  /** Copies en trop (au-delà de ce qu'il faut pour le niveau actuel). */
  count: number
  rarity: Rarity
  elixir: number
  /** Niveau d'évolution possédé (0 si aucune). */
  evoLevel: number
}

export interface CardLevelEvent {
  cardId: string
  at: string
  fromLevel: number
  toLevel: number
  fromCount: number
  toCount: number
}
```

- [ ] **Step 4: Créer `core/domain/player.ts`**

```ts
import type { CardState } from './card'

export interface PlayerProfile {
  tag: string
  name: string
  trophies: number
  bestTrophies: number
  kingLevel: number
  arena: string
  cards: CardState[]
}

export interface Battle {
  id: string
  at: string
  mode: string
  result: 'win' | 'loss' | 'draw'
  crownsFor: number
  crownsAgainst: number
  trophyChange: number
  myDeck: string[]
  oppDeck: string[]
}

export interface SyncSnapshot {
  at: string
  trophies: number
  kingLevel: number
  arena: string
}
```

- [ ] **Step 5: Lancer — passe**

Run: `npm test -- core/domain/card.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add core/domain
git commit -m "feat: types du domaine (carte, profil, combat)"
```

---

## Task 3: Interface `Repository` + implémentation en mémoire

**Files:**
- Create: `storage/repository.ts`, `storage/memory-repository.ts`
- Test: `storage/memory-repository.test.ts`

**Interfaces:**
- Consumes: types de `core/domain/*` (Task 2).
- Produces :
  - `interface Repository` avec :
    - `getSettings(): Promise<Settings>`
    - `saveSettings(s: Partial<Settings>): Promise<void>`
    - `getCardState(): Promise<CardState[]>`
    - `putCardState(cards: CardState[]): Promise<void>`  *(remplace tout)*
    - `appendCardLevelEvents(events: CardLevelEvent[]): Promise<void>`
    - `getCardLevelEvents(): Promise<CardLevelEvent[]>`
    - `addSync(snapshot: SyncSnapshot): Promise<void>`
    - `getSyncs(): Promise<SyncSnapshot[]>`
    - `upsertBattles(battles: Battle[]): Promise<number>`  *(retourne le nb de nouveaux)*
    - `getBattles(): Promise<Battle[]>`
  - `interface Settings { playerTag: string | null; activeGoalId: string | null }`
  - `class MemoryRepository implements Repository`

- [ ] **Step 1: Écrire le test qui échoue `storage/memory-repository.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRepository } from './memory-repository'
import type { Repository } from './repository'

let repo: Repository

beforeEach(() => { repo = new MemoryRepository() })

describe('MemoryRepository', () => {
  it('settings : défaut vide puis persistance partielle', async () => {
    expect(await repo.getSettings()).toEqual({ playerTag: null, activeGoalId: null })
    await repo.saveSettings({ playerTag: '#ABC123' })
    expect((await repo.getSettings()).playerTag).toBe('#ABC123')
  })

  it('putCardState remplace tout', async () => {
    await repo.putCardState([
      { cardId: 'hog-rider', name: 'Hog Rider', level: 11, maxLevel: 14, count: 0, rarity: 'rare', elixir: 4, evoLevel: 0 },
    ])
    await repo.putCardState([
      { cardId: 'the-log', name: 'The Log', level: 5, maxLevel: 6, count: 0, rarity: 'legendary', elixir: 2, evoLevel: 0 },
    ])
    const cards = await repo.getCardState()
    expect(cards).toHaveLength(1)
    expect(cards[0].cardId).toBe('the-log')
  })

  it('appendCardLevelEvents accumule', async () => {
    await repo.appendCardLevelEvents([
      { cardId: 'hog-rider', at: 't1', fromLevel: 10, toLevel: 11, fromCount: 0, toCount: 0 },
    ])
    await repo.appendCardLevelEvents([
      { cardId: 'the-log', at: 't2', fromLevel: 4, toLevel: 5, fromCount: 0, toCount: 0 },
    ])
    expect(await repo.getCardLevelEvents()).toHaveLength(2)
  })

  it('upsertBattles déduplique par id et compte les nouveaux', async () => {
    const b = (id: string) => ({
      id, at: 't', mode: 'Ladder', result: 'win' as const,
      crownsFor: 3, crownsAgainst: 0, trophyChange: 30, myDeck: [], oppDeck: [],
    })
    expect(await repo.upsertBattles([b('a'), b('b')])).toBe(2)
    expect(await repo.upsertBattles([b('b'), b('c')])).toBe(1)
    expect(await repo.getBattles()).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Lancer — échoue**

Run: `npm test -- storage/memory-repository.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 3: Créer `storage/repository.ts`**

```ts
import type { CardState, CardLevelEvent } from 'core/domain/card'
import type { Battle, SyncSnapshot } from 'core/domain/player'

export interface Settings {
  playerTag: string | null
  activeGoalId: string | null
}

export interface Repository {
  getSettings(): Promise<Settings>
  saveSettings(patch: Partial<Settings>): Promise<void>
  getCardState(): Promise<CardState[]>
  putCardState(cards: CardState[]): Promise<void>
  appendCardLevelEvents(events: CardLevelEvent[]): Promise<void>
  getCardLevelEvents(): Promise<CardLevelEvent[]>
  addSync(snapshot: SyncSnapshot): Promise<void>
  getSyncs(): Promise<SyncSnapshot[]>
  upsertBattles(battles: Battle[]): Promise<number>
  getBattles(): Promise<Battle[]>
}

export const DEFAULT_SETTINGS: Settings = { playerTag: null, activeGoalId: null }
```

- [ ] **Step 4: Créer `storage/memory-repository.ts`**

```ts
import type { CardState, CardLevelEvent } from 'core/domain/card'
import type { Battle, SyncSnapshot } from 'core/domain/player'
import { DEFAULT_SETTINGS, type Repository, type Settings } from './repository'

export class MemoryRepository implements Repository {
  private settings: Settings = { ...DEFAULT_SETTINGS }
  private cards: CardState[] = []
  private events: CardLevelEvent[] = []
  private syncs: SyncSnapshot[] = []
  private battles = new Map<string, Battle>()

  async getSettings() { return { ...this.settings } }
  async saveSettings(patch: Partial<Settings>) { this.settings = { ...this.settings, ...patch } }
  async getCardState() { return this.cards.map((c) => ({ ...c })) }
  async putCardState(cards: CardState[]) { this.cards = cards.map((c) => ({ ...c })) }
  async appendCardLevelEvents(events: CardLevelEvent[]) { this.events.push(...events) }
  async getCardLevelEvents() { return this.events.map((e) => ({ ...e })) }
  async addSync(s: SyncSnapshot) { this.syncs.push({ ...s }) }
  async getSyncs() { return this.syncs.map((s) => ({ ...s })) }
  async upsertBattles(battles: Battle[]) {
    let added = 0
    for (const b of battles) {
      if (!this.battles.has(b.id)) added++
      this.battles.set(b.id, { ...b })
    }
    return added
  }
  async getBattles() { return [...this.battles.values()] }
}
```

- [ ] **Step 5: Lancer — passe**

Run: `npm test -- storage/memory-repository.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add storage/repository.ts storage/memory-repository.ts storage/memory-repository.test.ts
git commit -m "feat: interface Repository + implémentation en mémoire"
```

---

## Task 4: Implémentation Dexie du `Repository`

**Files:**
- Create: `storage/dexie/db.ts`, `storage/dexie/dexie-repository.ts`
- Test: `storage/dexie/dexie-repository.test.ts`

**Interfaces:**
- Consumes: `Repository`, `Settings` (Task 3).
- Produces: `class DexieRepository implements Repository`, `createDb(): CoachDb`.

- [ ] **Step 1: Écrire le test qui échoue `storage/dexie/dexie-repository.test.ts`**

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { DexieRepository } from './dexie-repository'
import { createDb } from './db'

let repo: DexieRepository

beforeEach(async () => {
  const db = createDb()
  await db.delete()
  await db.open()
  repo = new DexieRepository(db)
})

describe('DexieRepository', () => {
  it('persiste et relit les settings', async () => {
    await repo.saveSettings({ playerTag: '#ABC' })
    expect((await repo.getSettings()).playerTag).toBe('#ABC')
  })

  it('putCardState remplace tout le contenu', async () => {
    await repo.putCardState([
      { cardId: 'a', name: 'A', level: 1, maxLevel: 14, count: 0, rarity: 'common', elixir: 3, evoLevel: 0 },
      { cardId: 'b', name: 'B', level: 1, maxLevel: 14, count: 0, rarity: 'common', elixir: 3, evoLevel: 0 },
    ])
    await repo.putCardState([
      { cardId: 'c', name: 'C', level: 1, maxLevel: 14, count: 0, rarity: 'common', elixir: 3, evoLevel: 0 },
    ])
    expect(await repo.getCardState()).toHaveLength(1)
  })

  it('upsertBattles déduplique entre deux appels', async () => {
    const b = (id: string) => ({
      id, at: 't', mode: 'L', result: 'win' as const,
      crownsFor: 1, crownsAgainst: 0, trophyChange: 1, myDeck: [], oppDeck: [],
    })
    expect(await repo.upsertBattles([b('a')])).toBe(1)
    expect(await repo.upsertBattles([b('a'), b('b')])).toBe(1)
    expect(await repo.getBattles()).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Lancer — échoue**

Run: `npm test -- storage/dexie/dexie-repository.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 3: Créer `storage/dexie/db.ts`**

```ts
import Dexie, { type Table } from 'dexie'
import type { CardState, CardLevelEvent } from 'core/domain/card'
import type { Battle, SyncSnapshot } from 'core/domain/player'

export interface SettingsRow { key: 'singleton'; playerTag: string | null; activeGoalId: string | null }
export interface SyncRow extends SyncSnapshot { id?: number }
export interface EventRow extends CardLevelEvent { id?: number }

export class CoachDb extends Dexie {
  settings!: Table<SettingsRow, string>
  cardState!: Table<CardState, string>
  cardLevelEvents!: Table<EventRow, number>
  syncs!: Table<SyncRow, number>
  battles!: Table<Battle, string>

  constructor() {
    super('clash-royale-coach')
    this.version(1).stores({
      settings: 'key',
      cardState: 'cardId',
      cardLevelEvents: '++id, cardId, at',
      syncs: '++id, at',
      battles: 'id, at',
    })
  }
}

export function createDb(): CoachDb {
  return new CoachDb()
}
```

- [ ] **Step 4: Créer `storage/dexie/dexie-repository.ts`**

```ts
import type { CardState, CardLevelEvent } from 'core/domain/card'
import type { Battle, SyncSnapshot } from 'core/domain/player'
import { DEFAULT_SETTINGS, type Repository, type Settings } from '../repository'
import type { CoachDb } from './db'

export class DexieRepository implements Repository {
  constructor(private db: CoachDb) {}

  async getSettings(): Promise<Settings> {
    const row = await this.db.settings.get('singleton')
    if (!row) return { ...DEFAULT_SETTINGS }
    return { playerTag: row.playerTag, activeGoalId: row.activeGoalId }
  }

  async saveSettings(patch: Partial<Settings>): Promise<void> {
    const current = await this.getSettings()
    const next = { ...current, ...patch }
    await this.db.settings.put({ key: 'singleton', ...next })
  }

  async getCardState(): Promise<CardState[]> {
    return this.db.cardState.toArray()
  }

  async putCardState(cards: CardState[]): Promise<void> {
    await this.db.transaction('rw', this.db.cardState, async () => {
      await this.db.cardState.clear()
      await this.db.cardState.bulkAdd(cards)
    })
  }

  async appendCardLevelEvents(events: CardLevelEvent[]): Promise<void> {
    if (events.length) await this.db.cardLevelEvents.bulkAdd(events)
  }

  async getCardLevelEvents(): Promise<CardLevelEvent[]> {
    const rows = await this.db.cardLevelEvents.orderBy('id').toArray()
    return rows.map(({ id: _id, ...e }) => e)
  }

  async addSync(snapshot: SyncSnapshot): Promise<void> {
    await this.db.syncs.add(snapshot)
  }

  async getSyncs(): Promise<SyncSnapshot[]> {
    const rows = await this.db.syncs.orderBy('id').toArray()
    return rows.map(({ id: _id, ...s }) => s)
  }

  async upsertBattles(battles: Battle[]): Promise<number> {
    const ids = battles.map((b) => b.id)
    const existing = new Set((await this.db.battles.bulkGet(ids)).filter(Boolean).map((b) => b!.id))
    await this.db.battles.bulkPut(battles)
    return battles.filter((b) => !existing.has(b.id)).length
  }

  async getBattles(): Promise<Battle[]> {
    return this.db.battles.orderBy('at').toArray()
  }
}
```

- [ ] **Step 5: Lancer — passe**

Run: `npm test -- storage/dexie/dexie-repository.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Vérifier que toute la suite passe**

Run: `npm test`
Expected: PASS (toutes les tâches précédentes incluses)

- [ ] **Step 7: Commit**

```bash
git add storage/dexie
git commit -m "feat: implémentation Dexie du Repository (IndexedDB)"
```

---

## Task 5: Relais Cloudflare — helper mutualisé + route profil

**Files:**
- Create: `functions/_shared/proxy.ts`, `functions/api/player/[tag].ts`,
  `wrangler.toml`, `.dev.vars.example`
- Test: `functions/_shared/proxy.test.ts`

**Interfaces:**
- Consumes: rien (runtime Workers).
- Produces :
  - `interface Env { CLASH_API_TOKEN: string; APP_ORIGIN: string }`
  - `proxyToClashApi(env: Env, apiPath: string, request: Request): Promise<Response>`
    — `apiPath` commence par `/` (ex. `/players/%23ABC`). Ajoute le header
    `Authorization: Bearer`, route via `https://proxy.royaleapi.com/v1`, pose les
    entêtes CORS (`Access-Control-Allow-Origin: env.APP_ORIGIN`), applique un
    `cf: { cacheTtl: 60, cacheEverything: true }`, mappe les statuts amont
    (`404/429/503`) en JSON `{ error: <code> }` avec `<code>` ∈
    `NOT_FOUND | RATE_LIMITED | MAINTENANCE | UPSTREAM_ERROR`.

- [ ] **Step 1: Écrire le test qui échoue `functions/_shared/proxy.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { proxyToClashApi, type Env } from './proxy'

const env: Env = { CLASH_API_TOKEN: 'secret-xyz', APP_ORIGIN: 'https://app.test' }
const req = new Request('https://app.test/api/player/ABC')

afterEach(() => vi.unstubAllGlobals())

function stubFetch(status: number, body: unknown) {
  const spy = vi.fn(async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('proxyToClashApi', () => {
  it('appelle le proxy RoyaleAPI avec le token et renvoie le corps', async () => {
    const spy = stubFetch(200, { tag: '#ABC', name: 'Test' })
    const res = await proxyToClashApi(env, '/players/%23ABC', req)
    const calledUrl = spy.mock.calls[0][0] as string
    const init = spy.mock.calls[0][1] as RequestInit
    expect(calledUrl).toBe('https://proxy.royaleapi.com/v1/players/%23ABC')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret-xyz')
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('https://app.test')
    expect(await res.json()).toEqual({ tag: '#ABC', name: 'Test' })
  })

  it('mappe 404 amont en { error: "NOT_FOUND" }', async () => {
    stubFetch(404, { reason: 'notFound' })
    const res = await proxyToClashApi(env, '/players/%23NOPE', req)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'NOT_FOUND' })
  })

  it('mappe 503 amont en { error: "MAINTENANCE" }', async () => {
    stubFetch(503, {})
    const res = await proxyToClashApi(env, '/players/x', req)
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'MAINTENANCE' })
  })
})
```

- [ ] **Step 2: Lancer — échoue**

Run: `npm test -- functions/_shared/proxy.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 3: Créer `functions/_shared/proxy.ts`**

```ts
export interface Env {
  CLASH_API_TOKEN: string
  APP_ORIGIN: string
}

const UPSTREAM = 'https://proxy.royaleapi.com/v1'

const STATUS_TO_CODE: Record<number, string> = {
  404: 'NOT_FOUND',
  429: 'RATE_LIMITED',
  503: 'MAINTENANCE',
}

export async function proxyToClashApi(env: Env, apiPath: string, _request: Request): Promise<Response> {
  const cors = {
    'access-control-allow-origin': env.APP_ORIGIN,
    'access-control-allow-methods': 'GET, OPTIONS',
  }

  const upstream = await fetch(`${UPSTREAM}${apiPath}`, {
    headers: { Authorization: `Bearer ${env.CLASH_API_TOKEN}`, Accept: 'application/json' },
    cf: { cacheTtl: 60, cacheEverything: true },
  } as RequestInit)

  if (!upstream.ok) {
    const code = STATUS_TO_CODE[upstream.status] ?? 'UPSTREAM_ERROR'
    return new Response(JSON.stringify({ error: code }), {
      status: upstream.status,
      headers: { 'content-type': 'application/json', ...cors },
    })
  }

  const body = await upstream.text()
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60', ...cors },
  })
}
```

- [ ] **Step 4: Lancer — passe**

Run: `npm test -- functions/_shared/proxy.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Créer `functions/api/player/[tag].ts`**

```ts
import { proxyToClashApi, type Env } from '../../_shared/proxy'

export const onRequestGet: PagesFunction<Env> = async ({ params, env, request }) => {
  const tag = String(params.tag).replace(/^#/, '').toUpperCase()
  return proxyToClashApi(env, `/players/%23${tag}`, request)
}

export const onRequestOptions: PagesFunction<Env> = async ({ env }) =>
  new Response(null, {
    headers: {
      'access-control-allow-origin': env.APP_ORIGIN,
      'access-control-allow-methods': 'GET, OPTIONS',
    },
  })
```

- [ ] **Step 6: Créer `wrangler.toml`**

```toml
name = "clash-royale-coach"
compatibility_date = "2026-09-01"
pages_build_output_dir = "dist"
```

- [ ] **Step 7: Créer `.dev.vars.example`**

```
CLASH_API_TOKEN=colle-ici-ta-cle-de-dev
APP_ORIGIN=http://localhost:5173
```

- [ ] **Step 8: Ajouter `@cloudflare/workers-types` et le typage**

Run: `npm install -D @cloudflare/workers-types`

Puis ajouter à `tsconfig.json` `compilerOptions.types` : `"@cloudflare/workers-types"`.

- [ ] **Step 9: Vérifier le typecheck**

Run: `npx tsc -b`
Expected: aucune erreur.

- [ ] **Step 10: Commit**

```bash
git add functions wrangler.toml .dev.vars.example package.json package-lock.json tsconfig.json
git commit -m "feat: relais Cloudflare — helper proxy + route profil joueur"
```

---

## Task 6: Relais Cloudflare — routes battlelog et cartes

**Files:**
- Create: `functions/api/player/[tag]/battles.ts`, `functions/api/cards.ts`
- Test: `functions/api/routes.test.ts`

**Interfaces:**
- Consumes: `proxyToClashApi`, `Env` (Task 5).
- Produces: routes `GET /api/player/:tag/battles` → `/players/%23{tag}/battlelog`,
  `GET /api/cards` → `/cards`.

- [ ] **Step 1: Écrire le test qui échoue `functions/api/routes.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestGet as battlesGet } from './player/[tag]/battles'
import { onRequestGet as cardsGet } from './cards'

const env = { CLASH_API_TOKEN: 't', APP_ORIGIN: 'https://app.test' }
afterEach(() => vi.unstubAllGlobals())

function stubFetch() {
  const spy = vi.fn(async () => new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', spy)
  return spy
}

const ctx = (params: Record<string, string>) => ({
  params, env, request: new Request('https://app.test/'),
} as never)

describe('routes du relais', () => {
  it('battles → /players/%23TAG/battlelog', async () => {
    const spy = stubFetch()
    await battlesGet(ctx({ tag: 'abc' }))
    expect(spy.mock.calls[0][0]).toBe('https://proxy.royaleapi.com/v1/players/%23ABC/battlelog')
  })

  it('cards → /cards', async () => {
    const spy = stubFetch()
    await cardsGet(ctx({}))
    expect(spy.mock.calls[0][0]).toBe('https://proxy.royaleapi.com/v1/cards')
  })
})
```

- [ ] **Step 2: Lancer — échoue**

Run: `npm test -- functions/api/routes.test.ts`
Expected: FAIL — modules introuvables

- [ ] **Step 3: Créer `functions/api/player/[tag]/battles.ts`**

```ts
import { proxyToClashApi, type Env } from '../../../_shared/proxy'

export const onRequestGet: PagesFunction<Env> = async ({ params, env, request }) => {
  const tag = String(params.tag).replace(/^#/, '').toUpperCase()
  return proxyToClashApi(env, `/players/%23${tag}/battlelog`, request)
}
```

- [ ] **Step 4: Créer `functions/api/cards.ts`**

```ts
import { proxyToClashApi, type Env } from '../_shared/proxy'

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) =>
  proxyToClashApi(env, '/cards', request)
```

- [ ] **Step 5: Lancer — passe**

Run: `npm test -- functions/api/routes.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add functions/api
git commit -m "feat: relais Cloudflare — routes battlelog et cartes"
```

---

## Task 7: Client `core/clash-api` — normalisation + mapping

**Files:**
- Create: `core/clash-api/errors.ts`, `core/clash-api/normalize.ts`,
  `core/clash-api/types.ts`, `core/clash-api/client.ts`
- Create (fixtures) : `core/clash-api/__fixtures__/player.json`,
  `core/clash-api/__fixtures__/battlelog.json`
- Test: `core/clash-api/normalize.test.ts`, `core/clash-api/client.test.ts`

**Interfaces:**
- Consumes: `PlayerProfile`, `Battle`, `CardState` (Task 2), `toCardSlug` (Task 1).
- Produces :
  - `class ClashApiError extends Error { code: ClashApiErrorCode }`
  - `type ClashApiErrorCode = 'NOT_FOUND' | 'RATE_LIMITED' | 'MAINTENANCE' | 'OFFLINE' | 'UNKNOWN'`
  - `normalizeCardLevel(apiLevel: number, apiMaxLevel: number): number`
  - `interface ClashApiClient { getPlayer(tag): Promise<PlayerProfile>;
    getBattlelog(tag): Promise<Battle[]> }`
  - `createClashApiClient(baseUrl: string, fetchImpl?): ClashApiClient`

- [ ] **Step 1: Capturer des fixtures réelles anonymisées**

Récupérer une réponse réelle (tag de test, pas un tag perso) via le relais en
dev ou via `curl` sur le proxy, puis **anonymiser** (`tag`, `name`, noms de
clan) et enregistrer :
- `core/clash-api/__fixtures__/player.json`
- `core/clash-api/__fixtures__/battlelog.json`

Vérifier dans `player.json` la forme réelle du tableau `cards[]` : champs
`name`, `level`, `maxLevel`, `count`, `elixirCost` (ou via `iconUrls`… selon la
version de l'API), et la présence éventuelle de `evolutionLevel` /
`starLevel`. **Adapter `types.ts` et le mapping à ce que montre la fixture.**

- [ ] **Step 2: Écrire le test qui échoue `core/clash-api/normalize.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { normalizeCardLevel } from './normalize'

// Le jeu affiche tout le monde sur une échelle 1..14. L'API donne un `level`
// relatif à la rareté et un `maxLevel` (commune 14, rare 12, épique 9,
// légendaire 6, champion 4 — à confirmer via fixture).
describe('normalizeCardLevel', () => {
  it('commune : level API = niveau joueur', () => {
    expect(normalizeCardLevel(11, 14)).toBe(11)
  })
  it('légendaire : level 1 / maxLevel 6 => niveau joueur 9', () => {
    expect(normalizeCardLevel(1, 6)).toBe(9)
  })
  it('champion : level 1 / maxLevel 4 => niveau joueur 11', () => {
    expect(normalizeCardLevel(1, 4)).toBe(11)
  })
})
```

- [ ] **Step 3: Lancer — échoue**

Run: `npm test -- core/clash-api/normalize.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 4: Créer `core/clash-api/normalize.ts`**

```ts
/** Le jeu affiche 1..GAME_MAX. L'API donne un niveau relatif à la rareté. */
const GAME_MAX = 14

export function normalizeCardLevel(apiLevel: number, apiMaxLevel: number): number {
  return apiLevel + (GAME_MAX - apiMaxLevel)
}
```

- [ ] **Step 5: Lancer — passe** (ajuster `GAME_MAX` / la formule si la fixture
  contredit les valeurs attendues, et corriger le test en conséquence en
  documentant la source)

Run: `npm test -- core/clash-api/normalize.test.ts`
Expected: PASS

- [ ] **Step 6: Créer `core/clash-api/errors.ts`**

```ts
export type ClashApiErrorCode =
  | 'NOT_FOUND' | 'RATE_LIMITED' | 'MAINTENANCE' | 'OFFLINE' | 'UNKNOWN'

export class ClashApiError extends Error {
  constructor(public code: ClashApiErrorCode, message?: string) {
    super(message ?? code)
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
```

- [ ] **Step 7: Écrire le test qui échoue `core/clash-api/client.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createClashApiClient } from './client'
import { ClashApiError } from './errors'

const playerFixture = JSON.parse(readFileSync(new URL('./__fixtures__/player.json', import.meta.url), 'utf8'))

function fakeFetch(status: number, body: unknown) {
  return async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

describe('ClashApiClient.getPlayer', () => {
  it('mappe la réponse brute vers PlayerProfile', async () => {
    const client = createClashApiClient('https://app.test/api', fakeFetch(200, playerFixture))
    const p = await client.getPlayer('#ABC')
    expect(p.tag).toBe(playerFixture.tag)
    expect(p.trophies).toBe(playerFixture.trophies)
    expect(p.cards.length).toBeGreaterThan(0)
    const c = p.cards[0]
    expect(typeof c.cardId).toBe('string')
    expect(c.cardId).toMatch(/^[a-z0-9-]+$/)
    expect(c.level).toBeGreaterThan(0)
  })

  it('mappe { error: "NOT_FOUND" } en ClashApiError', async () => {
    const client = createClashApiClient('https://app.test/api', fakeFetch(404, { error: 'NOT_FOUND' }))
    await expect(client.getPlayer('#NOPE')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(client.getPlayer('#NOPE')).rejects.toBeInstanceOf(ClashApiError)
  })

  it('transforme une panne réseau en ClashApiError OFFLINE', async () => {
    const client = createClashApiClient('https://app.test/api', async () => { throw new TypeError('network') })
    await expect(client.getPlayer('#X')).rejects.toMatchObject({ code: 'OFFLINE' })
  })
})
```

- [ ] **Step 8: Lancer — échoue**

Run: `npm test -- core/clash-api/client.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 9: Créer `core/clash-api/types.ts`** (adapter aux fixtures de Step 1)

```ts
export interface RawCard {
  name: string
  level: number
  maxLevel: number
  count?: number
  elixirCost?: number
  evolutionLevel?: number
  starLevel?: number
  rarity?: string
}

export interface RawPlayer {
  tag: string
  name: string
  trophies: number
  bestTrophies: number
  expLevel: number
  arena?: { name: string }
  cards: RawCard[]
}

export interface RawBattle {
  type: string
  battleTime: string
  gameMode?: { name: string }
  team: RawBattleSide[]
  opponent: RawBattleSide[]
}

export interface RawBattleSide {
  tag: string
  crowns: number
  startingTrophies?: number
  trophyChange?: number
  cards: { name: string }[]
}
```

- [ ] **Step 10: Créer `core/clash-api/client.ts`** (adapter le mapping aux fixtures)

```ts
import type { PlayerProfile } from 'core/domain/player'
import type { Battle } from 'core/domain/player'
import type { CardState, Rarity } from 'core/domain/card'
import { toCardSlug } from 'core/domain/ids'
import { normalizeCardLevel } from './normalize'
import { ClashApiError, type ClashApiErrorCode } from './errors'
import type { RawPlayer, RawCard, RawBattle } from './types'

export interface ClashApiClient {
  getPlayer(tag: string): Promise<PlayerProfile>
  getBattlelog(tag: string): Promise<Battle[]>
}

type FetchImpl = typeof fetch

const RARITY: Record<string, Rarity> = {
  common: 'common', rare: 'rare', epic: 'epic', legendary: 'legendary', champion: 'champion',
}

function rarityFromMaxLevel(maxLevel: number): Rarity {
  // Repli si l'API ne fournit pas `rarity` sur la carte.
  if (maxLevel >= 14) return 'common'
  if (maxLevel >= 12) return 'rare'
  if (maxLevel >= 9) return 'epic'
  if (maxLevel >= 6) return 'legendary'
  return 'champion'
}

function mapCard(raw: RawCard): CardState {
  return {
    cardId: toCardSlug(raw.name),
    name: raw.name,
    level: normalizeCardLevel(raw.level, raw.maxLevel),
    maxLevel: raw.maxLevel,
    count: raw.count ?? 0,
    rarity: raw.rarity ? (RARITY[raw.rarity.toLowerCase()] ?? rarityFromMaxLevel(raw.maxLevel)) : rarityFromMaxLevel(raw.maxLevel),
    elixir: raw.elixirCost ?? 0,
    evoLevel: raw.evolutionLevel ?? 0,
  }
}

function battleId(b: RawBattle): string {
  const opp = b.opponent[0]?.tag ?? 'unknown'
  return `${b.battleTime}:${opp}`
}

function mapBattle(b: RawBattle): Battle {
  const me = b.team[0]
  const opp = b.opponent[0]
  const crownsFor = me?.crowns ?? 0
  const crownsAgainst = opp?.crowns ?? 0
  return {
    id: battleId(b),
    at: b.battleTime,
    mode: b.gameMode?.name ?? b.type,
    result: crownsFor > crownsAgainst ? 'win' : crownsFor < crownsAgainst ? 'loss' : 'draw',
    crownsFor,
    crownsAgainst,
    trophyChange: me?.trophyChange ?? 0,
    myDeck: (me?.cards ?? []).map((c) => toCardSlug(c.name)),
    oppDeck: (opp?.cards ?? []).map((c) => toCardSlug(c.name)),
  }
}

async function call<T>(url: string, fetchImpl: FetchImpl): Promise<T> {
  let res: Response
  try {
    res = await fetchImpl(url)
  } catch {
    throw new ClashApiError('OFFLINE')
  }
  if (!res.ok) {
    let code: ClashApiErrorCode = 'UNKNOWN'
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error && ['NOT_FOUND', 'RATE_LIMITED', 'MAINTENANCE'].includes(body.error)) {
        code = body.error as ClashApiErrorCode
      }
    } catch { /* garde UNKNOWN */ }
    throw new ClashApiError(code)
  }
  return res.json() as Promise<T>
}

export function createClashApiClient(baseUrl: string, fetchImpl: FetchImpl = fetch): ClashApiClient {
  const enc = (tag: string) => encodeURIComponent(tag.replace(/^#/, '').toUpperCase())
  return {
    async getPlayer(tag) {
      const raw = await call<RawPlayer>(`${baseUrl}/player/${enc(tag)}`, fetchImpl)
      return {
        tag: raw.tag,
        name: raw.name,
        trophies: raw.trophies,
        bestTrophies: raw.bestTrophies,
        kingLevel: raw.expLevel,
        arena: raw.arena?.name ?? '',
        cards: raw.cards.map(mapCard),
      }
    },
    async getBattlelog(tag) {
      const raw = await call<RawBattle[]>(`${baseUrl}/player/${enc(tag)}/battles`, fetchImpl)
      return raw.map(mapBattle)
    },
  }
}
```

- [ ] **Step 11: Lancer — passe** (corriger le mapping jusqu'à ce que les
  assertions sur la vraie fixture passent)

Run: `npm test -- core/clash-api`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add core/clash-api
git commit -m "feat: client core/clash-api — mapping domaine + gestion d'erreurs"
```

---

## Task 8: Orchestrateur `core/sync`

**Files:**
- Create: `core/sync/diff.ts`, `core/sync/sync-player.ts`
- Test: `core/sync/diff.test.ts`, `core/sync/sync-player.test.ts`

**Interfaces:**
- Consumes: `Repository` (Task 3), `ClashApiClient` (Task 7), `CardState`,
  `CardLevelEvent` (Task 2).
- Produces :
  - `diffCardStates(previous: CardState[], current: CardState[], at: string): CardLevelEvent[]`
  - `interface SyncDeps { repo: Repository; api: ClashApiClient; now(): string }`
  - `interface SyncResult { newEvents: number; trophyDelta: number | null; newBattles: number }`
  - `syncPlayer(tag: string, deps: SyncDeps): Promise<SyncResult>`

- [ ] **Step 1: Écrire le test qui échoue `core/sync/diff.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { diffCardStates } from './diff'
import type { CardState } from 'core/domain/card'

const card = (over: Partial<CardState>): CardState => ({
  cardId: 'hog-rider', name: 'Hog Rider', level: 10, maxLevel: 14,
  count: 0, rarity: 'rare', elixir: 4, evoLevel: 0, ...over,
})
const AT = '2026-09-03T00:00:00.000Z'

describe('diffCardStates', () => {
  it('aucun changement => aucun event', () => {
    expect(diffCardStates([card({})], [card({})], AT)).toEqual([])
  })
  it('montée de niveau => un event', () => {
    const events = diffCardStates([card({ level: 10 })], [card({ level: 11 })], AT)
    expect(events).toEqual([
      { cardId: 'hog-rider', at: AT, fromLevel: 10, toLevel: 11, fromCount: 0, toCount: 0 },
    ])
  })
  it('changement de nombre de copies seul => un event', () => {
    const events = diffCardStates([card({ count: 5 })], [card({ count: 20 })], AT)
    expect(events[0]).toMatchObject({ fromCount: 5, toCount: 20, fromLevel: 10, toLevel: 10 })
  })
  it('nouvelle carte débloquée => event depuis 0', () => {
    const events = diffCardStates([], [card({ cardId: 'the-log', level: 9 })], AT)
    expect(events[0]).toMatchObject({ cardId: 'the-log', fromLevel: 0, toLevel: 9 })
  })
})
```

- [ ] **Step 2: Lancer — échoue**

Run: `npm test -- core/sync/diff.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 3: Créer `core/sync/diff.ts`**

```ts
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
```

- [ ] **Step 4: Lancer — passe**

Run: `npm test -- core/sync/diff.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Écrire le test qui échoue `core/sync/sync-player.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { syncPlayer } from './sync-player'
import { MemoryRepository } from 'storage/memory-repository'
import type { ClashApiClient } from 'core/clash-api/client'
import type { PlayerProfile, Battle } from 'core/domain/player'

const profile = (over: Partial<PlayerProfile> = {}): PlayerProfile => ({
  tag: '#ABC', name: 'Test', trophies: 5000, bestTrophies: 5200, kingLevel: 14, arena: 'Arène 23',
  cards: [
    { cardId: 'hog-rider', name: 'Hog Rider', level: 11, maxLevel: 14, count: 0, rarity: 'rare', elixir: 4, evoLevel: 0 },
  ],
  ...over,
})

const fakeApi = (p: PlayerProfile, battles: Battle[] = []): ClashApiClient => ({
  getPlayer: async () => p,
  getBattlelog: async () => battles,
})

const deps = (api: ClashApiClient) => ({ repo: new MemoryRepository(), api, now: () => '2026-09-03T12:00:00.000Z' })

describe('syncPlayer', () => {
  it('premier sync : cardState créé, AUCUN event, snapshot enregistré', async () => {
    const d = deps(fakeApi(profile()))
    const res = await syncPlayer('#ABC', d)
    expect(await d.repo.getCardState()).toHaveLength(1)
    expect(await d.repo.getCardLevelEvents()).toHaveLength(0)
    expect(await d.repo.getSyncs()).toHaveLength(1)
    expect(res.newEvents).toBe(0)
    expect(res.trophyDelta).toBeNull()
  })

  it('deuxième sync avec montée de niveau : un event, trophyDelta calculé', async () => {
    const d = deps(fakeApi(profile()))
    await syncPlayer('#ABC', d)
    d.api.getPlayer = async () => profile({
      trophies: 5100,
      cards: [{ cardId: 'hog-rider', name: 'Hog Rider', level: 12, maxLevel: 14, count: 0, rarity: 'rare', elixir: 4, evoLevel: 0 }],
    })
    const res = await syncPlayer('#ABC', d)
    expect(res.newEvents).toBe(1)
    expect(res.trophyDelta).toBe(100)
    expect(await d.repo.getCardLevelEvents()).toHaveLength(1)
  })

  it('enregistre le tag dans les settings et déduplique les combats', async () => {
    const battle: Battle = {
      id: 'b1', at: '2026-09-03T11:00:00.000Z', mode: 'Ladder', result: 'win',
      crownsFor: 3, crownsAgainst: 1, trophyChange: 30, myDeck: [], oppDeck: [],
    }
    const d = deps(fakeApi(profile(), [battle]))
    const first = await syncPlayer('#ABC', d)
    expect(first.newBattles).toBe(1)
    expect((await d.repo.getSettings()).playerTag).toBe('#ABC')
    const second = await syncPlayer('#ABC', d)
    expect(second.newBattles).toBe(0)
  })
})
```

- [ ] **Step 6: Lancer — échoue**

Run: `npm test -- core/sync/sync-player.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 7: Créer `core/sync/sync-player.ts`**

```ts
import type { Repository } from 'storage/repository'
import type { ClashApiClient } from 'core/clash-api/client'
import { diffCardStates } from './diff'

export interface SyncDeps {
  repo: Repository
  api: ClashApiClient
  now(): string
}

export interface SyncResult {
  newEvents: number
  trophyDelta: number | null
  newBattles: number
}

export async function syncPlayer(tag: string, deps: SyncDeps): Promise<SyncResult> {
  const { repo, api, now } = deps
  const at = now()

  const [profile, battles] = await Promise.all([api.getPlayer(tag), api.getBattlelog(tag)])

  const previousCards = await repo.getCardState()
  const previousSyncs = await repo.getSyncs()
  const isFirstSync = previousCards.length === 0

  const events = isFirstSync ? [] : diffCardStates(previousCards, profile.cards, at)

  await repo.putCardState(profile.cards)
  await repo.appendCardLevelEvents(events)
  await repo.addSync({ at, trophies: profile.trophies, kingLevel: profile.kingLevel, arena: profile.arena })
  const newBattles = await repo.upsertBattles(battles)
  await repo.saveSettings({ playerTag: profile.tag })

  const lastTrophies = previousSyncs.at(-1)?.trophies ?? null
  const trophyDelta = lastTrophies === null ? null : profile.trophies - lastTrophies

  return { newEvents: events.length, trophyDelta, newBattles }
}
```

- [ ] **Step 8: Lancer — passe**

Run: `npm test -- core/sync/sync-player.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 9: Commit**

```bash
git add core/sync
git commit -m "feat: orchestrateur core/sync (diff des cartes + persistance)"
```

---

## Task 9: UI minimale — onboarding + affichage brut + câblage

**Files:**
- Create: `src/state/repo.ts`, `src/state/useSync.ts`,
  `src/screens/Onboarding.tsx`, `src/screens/Profile.tsx`, `src/App.css`
- Modify: `src/App.tsx`
- Test: `core/domain/tag.ts` + `core/domain/tag.test.ts` (validation du tag,
  testée hors React)

**Interfaces:**
- Consumes: `syncPlayer`, `SyncResult` (Task 8), `DexieRepository` (Task 4),
  `createClashApiClient` (Task 7), `messageFor` + `ClashApiError` (Task 7).
- Produces :
  - `isValidTag(input: string): boolean` et `normalizeTag(input: string): string`
  - hook `useSync()` → `{ status, profile, battles, error, run(tag) }`

- [ ] **Step 1: Écrire le test qui échoue `core/domain/tag.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { isValidTag, normalizeTag } from './tag'

describe('tag joueur', () => {
  it('normalise : majuscules, préfixe #, O→0', () => {
    expect(normalizeTag('  #abc123  ')).toBe('#ABC123')
    expect(normalizeTag('abc123')).toBe('#ABC123')
    expect(normalizeTag('#OO9')).toBe('#009')
  })
  it('valide : # + 3 à 12 caractères de [0289PYLQGRJCUV]', () => {
    expect(isValidTag('#2PP')).toBe(true)
    expect(isValidTag('#ABC-123')).toBe(false)
    expect(isValidTag('#')).toBe(false)
    expect(isValidTag('#ZZZ')).toBe(false) // Z n'est pas dans l'alphabet des tags Supercell
  })
})
```

- [ ] **Step 2: Lancer — échoue**

Run: `npm test -- core/domain/tag.test.ts`
Expected: FAIL — module introuvable

- [ ] **Step 3: Créer `core/domain/tag.ts`**

```ts
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
```

- [ ] **Step 4: Lancer — passe**

Run: `npm test -- core/domain/tag.test.ts`
Expected: PASS

- [ ] **Step 5: Créer `src/state/repo.ts`**

```ts
import { createDb } from 'storage/dexie/db'
import { DexieRepository } from 'storage/dexie/dexie-repository'
import { createClashApiClient } from 'core/clash-api/client'

export const repo = new DexieRepository(createDb())
export const api = createClashApiClient('/api')
export const now = () => new Date().toISOString()
```

- [ ] **Step 6: Créer `src/state/useSync.ts`**

```ts
import { useCallback, useState } from 'react'
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

  const run = useCallback(async (tag: string) => {
    setStatus('syncing'); setError(null)
    try {
      await syncPlayer(tag, { repo, api, now })
      setProfile(await api.getPlayer(tag))
      setBattles(await repo.getBattles())
      setStatus('ready')
    } catch (e) {
      setError(e instanceof ClashApiError ? messageFor(e.code) : 'Erreur inattendue.')
      setStatus('error')
    }
  }, [])

  return { status, profile, battles, error, run }
}
```

- [ ] **Step 7: Créer `src/screens/Onboarding.tsx`**

```tsx
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
```

- [ ] **Step 8: Créer `src/screens/Profile.tsx`**

```tsx
import type { PlayerProfile, Battle } from 'core/domain/player'

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
      <ul className="cards">
        {profile.cards.map((c) => (
          <li key={c.cardId}>{c.name} — niv. {c.level}/{c.maxLevel}{c.evoLevel > 0 && ' ✦'}</li>
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
```

- [ ] **Step 9: Créer `src/App.css`** (minimal, lisible sur mobile)

```css
:root { color-scheme: light dark; font-family: system-ui, sans-serif; }
body { margin: 0; }
#root { max-width: 640px; margin: 0 auto; padding: 1rem; }
.onboarding { display: flex; flex-direction: column; gap: .75rem; margin-top: 20vh; }
.onboarding input { font-size: 1.25rem; padding: .5rem; text-transform: uppercase; }
.onboarding button, .profile button { padding: .5rem 1rem; font-size: 1rem; }
.hint { color: #b91c1c; }
.profile header { display: flex; justify-content: space-between; align-items: baseline; }
.profile h1 span { font-weight: 400; opacity: .6; font-size: .8em; }
.cards, .battles { list-style: none; padding: 0; display: grid; gap: .25rem; }
.error { color: #b91c1c; }
```

- [ ] **Step 10: Modifier `src/App.tsx`**

```tsx
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
```

- [ ] **Step 11: Vérifier build + typecheck + toute la suite**

Run: `npm run build && npm test`
Expected: build OK, tous les tests PASS.

- [ ] **Step 12: Test manuel avec le vrai relais**

```bash
cp .dev.vars.example .dev.vars   # y mettre une vraie clé de dev
npm run build
npx wrangler pages dev dist
```

Ouvrir l'URL, saisir un tag de test, vérifier : profil affiché, liste de cartes,
25 combats. Relancer « Rafraîchir » → pas de doublon de combats, un nouveau
snapshot dans `syncs` (vérifiable via les DevTools → Application → IndexedDB).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: UI minimale — onboarding tag + affichage profil/battlelog"
```

---

## Self-Review (fait pendant la rédaction)

**Couverture du spec (phase Fondations) :**
- §3 stack → Task 1 (Vite/React/PWA), Task 4 (Dexie).
- §4 découpage `core/` `storage/` `functions/` + interface `Repository` → Tasks 2-8.
- §5 stores `settings`, `syncs`, `cardState`, `cardLevelEvents`, `battles` →
  Tasks 3-4 (les stores `goals`, `recommendations`, `metaCache`, `cardsCatalog`
  arrivent en phases 2-3, hors périmètre de ce plan).
- §7 relais (3 routes pass-through, secret, cache 60 s, CORS, mapping d'erreurs)
  → Tasks 5-6. Flux de sync (diff, premier lancement sans event, dédup combats)
  → Task 8. Validation format tag → Task 9.
- §7 « catalogue de cartes si > 7 j » : la route existe (Task 6) ; la logique de
  fraîcheur du `cardsCatalog` est en phase 2 (avec `core/meta`).
- §10 tests : chaque module de `core/` et `storage/` a sa suite ; le relais est
  testé avec un faux upstream.

**Placeholders :** aucun `TODO`/`TBD` dans les étapes. Les deux points « adapter
aux fixtures » (Task 7) sont des instructions explicites d'ajustement guidé par
une donnée réelle, pas des trous.

**Cohérence des types :** `Repository` (Task 3) est réutilisé à l'identique
Tasks 4, 8, 9. `ClashApiClient` (Task 7) réutilisé Tasks 8, 9. `Env` (Task 5)
réutilisé Task 6. `SyncResult` / `SyncDeps` définis Task 8, consommés Task 9.
`toCardSlug` (Task 1) utilisé Task 7. `normalizeCardLevel` (Task 7) utilisé dans
le mapping de la même tâche.

**Décision d'ajustement laissée à l'exécution (attendu) :** valeurs exactes de
`normalizeCardLevel` et forme précise de `RawCard` / `RawPlayer` — à verrouiller
sur la fixture réelle capturée en Task 7 Step 1. C'est voulu : le spec (§6, §11)
liste déjà ces points comme à caler sur des données réelles.

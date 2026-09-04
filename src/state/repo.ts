import { createDb } from 'storage/dexie/db'
import { DexieRepository } from 'storage/dexie/dexie-repository'
import { createClashApiClient } from 'core/clash-api/client'

export const repo = new DexieRepository(createDb())
export const api = createClashApiClient('/api')
export const now = () => new Date().toISOString()

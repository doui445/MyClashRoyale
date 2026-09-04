import { registerSW } from 'virtual:pwa-register'

export function initPwa(): void {
  registerSW({ immediate: true })
}

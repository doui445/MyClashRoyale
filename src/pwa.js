import { registerSW } from 'virtual:pwa-register';
export function initPwa() {
    registerSW({ immediate: true });
}

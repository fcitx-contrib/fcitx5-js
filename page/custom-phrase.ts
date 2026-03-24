import type { CustomPhrase } from './Fcitx5'
import Module from './module'

export function getCustomPhrases(path: string) {
  return JSON.parse(Module.ccall('customphrase_get', 'string', ['string'], [path]))
}

export function setCustomPhrases(path: string, phrases: CustomPhrase[]) {
  Module.ccall('customphrase_set', 'void', ['string', 'string'], [path, JSON.stringify(phrases)])
}

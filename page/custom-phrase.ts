import type { CustomPhrase } from './Fcitx5'
import Module from './module'

export function getCustomPhrases() {
  return JSON.parse(Module.ccall('customphrase_get', 'string', [], []))
}

export function setCustomPhrases(phrases: CustomPhrase[]) {
  Module.ccall('customphrase_set', 'void', ['string'], [JSON.stringify(phrases)])
}

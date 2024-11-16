import { getInputElement } from './focus'
import Module from './module'

function extract(event: KeyboardEvent): [string, string, number] | undefined {
  const { key, code, shiftKey, altKey, ctrlKey, metaKey } = event
  // Host IME
  if (key === 'Process') {
    return undefined
  }
  const capsLock = event.getModifierState('CapsLock')
  const modifiers = Number(shiftKey) | Number(capsLock) << 1 | Number(ctrlKey) << 2 | Number(altKey) << 3 | Number(metaKey) << 6
  return [key, code, modifiers]
}

export function keyEvent(event: KeyboardEvent) {
  if (!getInputElement()) {
    return
  }
  const extracted = extract(event)
  if (!extracted) {
    return
  }
  const isRelease = event.type === 'keyup'
  if (Module.ccall('process_key', 'bool', ['string', 'string', 'number', 'bool'], [...extracted, isRelease])) {
    event.preventDefault()
  }
}

export function jsKeyToFcitxString(event: KeyboardEvent) {
  const extracted = extract(event)
  if (!extracted) {
    return ''
  }
  return Module.ccall('js_key_to_fcitx_string', 'string', ['string', 'string', 'number'], extracted)
}

import Module from './module'
import { getInputElement } from './focus'

export function keyEvent(event: KeyboardEvent) {
  if (!getInputElement()) {
    return
  }
  const isRelease = event.type === 'keyup'
  const { key, code, shiftKey, altKey, ctrlKey, metaKey } = event
  // Host IME
  if (key === 'Process') {
    return
  }
  const capsLock = event.getModifierState('CapsLock')
  const modifiers = Number(shiftKey) | Number(capsLock) << 1 | Number(ctrlKey) << 2 | Number(altKey) << 3 | Number(metaKey) << 6
  if (Module.ccall('process_key', 'bool', ['string', 'string', 'number', 'bool'], [key, code, modifiers, isRelease])) {
    event.preventDefault()
  }
}

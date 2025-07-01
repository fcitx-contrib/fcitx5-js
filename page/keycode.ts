import { isApple } from './context'
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

export function processKey(key: string, code: string, modifiers: number, isRelease: boolean): boolean {
  return Module.ccall('process_key', 'bool', ['string', 'string', 'number', 'bool'], [key, code, modifiers, isRelease])
}

export function keyEvent(event: KeyboardEvent) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const extracted = extract(event)
  if (!extracted) {
    return
  }
  const isRelease = event.type === 'keyup'
  // Write clipboard for Ctrl/Cmd + C/X
  if (!isRelease && ['c', 'x'].includes(extracted[0]) && ((isApple && extracted[2] === (1 << 6)) || (!isApple && extracted[2] === (1 << 2)))) {
    const selectedText = input.value.substring(input.selectionStart ?? 0, input.selectionEnd ?? 0)
    if (selectedText) {
      Module.ccall('write_clipboard', 'void', ['string'], [selectedText])
    }
  }
  if (processKey(...extracted, isRelease)) {
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

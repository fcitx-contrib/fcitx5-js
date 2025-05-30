import { resetPreedit } from './client'
import { hasTouch, hideKeyboard, showKeyboard } from './keyboard'
import Module from './module'

type Input = HTMLInputElement | HTMLTextAreaElement

let input: Input | null = null
let userClick = false
let originalSpellCheck = true
let originalReadOnly = false

// false means disable, true means respect the original value.
export function setSpellCheck(spellCheck: boolean) {
  if (!input) {
    return
  }
  input.spellcheck = spellCheck ? originalSpellCheck : false
}

export function clickPanel() {
  userClick = true
}

export function resetInput() {
  Module.ccall('reset_input', 'void', [], [])
}

export function focus() {
  if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
    return
  }
  input = <Input>document.activeElement
  input.addEventListener('mousedown', resetInput)
  if (hasTouch) {
    input.addEventListener('touchstart', resetInput)
    originalReadOnly = input.readOnly
    input.readOnly = true
    showKeyboard()
  }
  originalSpellCheck = input.spellcheck
  Module.ccall('focus_in', 'void', [], [])
}

export function blur() {
  if (!input) {
    return
  }
  // Don't call focus_out if user clicks panel.
  if (userClick) {
    userClick = false
    // Refocus to ensure setting selectionEnd works and clicking outside fires blur event.
    setTimeout(() => input?.focus(), 0)
    return
  }
  input.removeEventListener('mousedown', resetInput)
  if (hasTouch) {
    input.removeEventListener('touchstart', resetInput)
    input.readOnly = originalReadOnly
    hideKeyboard()
  }
  input.spellcheck = originalSpellCheck
  input = null
  Module.ccall('focus_out', 'void', [], [])
  resetPreedit()
}

export function getInputElement(): Input | null {
  return input
}

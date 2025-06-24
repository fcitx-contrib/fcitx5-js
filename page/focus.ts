import { redrawCaret, removeCaret } from './caret'
import { resetPreedit } from './client'
import { hasTouch, hideKeyboard, showKeyboard, updateSelection } from './keyboard'
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
    input.addEventListener('selectionchange', updateSelection)
    input.addEventListener('selectionchange', redrawCaret)
    input.addEventListener('change', redrawCaret) // Needed when deleting the only character.
    originalReadOnly = input.readOnly
    input.readOnly = true
    showKeyboard()
    redrawCaret({ target: input })
  }
  originalSpellCheck = input.spellcheck
  const isPassword = input.tagName === 'INPUT' && input.type === 'password'
  Module.ccall('focus_in', 'void', ['bool'], [isPassword])
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
    input.removeEventListener('selectionchange', updateSelection)
    input.removeEventListener('selectionchange', redrawCaret)
    input.removeEventListener('change', redrawCaret)
    input.readOnly = originalReadOnly
    hideKeyboard()
    removeCaret()
  }
  input.spellcheck = originalSpellCheck
  input = null
  Module.ccall('focus_out', 'void', [], [])
  resetPreedit()
}

export function getInputElement(): Input | null {
  return input
}

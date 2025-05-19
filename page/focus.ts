import { resetPreedit } from './client'
import Module from './module'

type Input = HTMLInputElement | HTMLTextAreaElement

let input: Input | null = null
let userClick = false
let originalSpellCheck = true

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

function resetInput() {
  Module.ccall('reset_input', 'void', [], [])
}

export function focus() {
  if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
    return
  }
  input = <Input>document.activeElement
  input.addEventListener('mousedown', resetInput)
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
    return
  }
  input.removeEventListener('mousedown', resetInput)
  input.spellcheck = originalSpellCheck
  input = null
  Module.ccall('focus_out', 'void', [], [])
  resetPreedit()
}

export function getInputElement(): Input | null {
  return input
}

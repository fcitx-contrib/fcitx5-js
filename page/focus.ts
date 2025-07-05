import { redrawCaret, removeCaret } from './caret'
import { redrawPreeditUnderline, resetPreedit } from './client'
import { hasTouch } from './context'
import { hideKeyboard, showKeyboard, updateSelection } from './keyboard'
import Module from './module'
import { resetStacks } from './undoRedo'

export type Input = HTMLInputElement | HTMLTextAreaElement

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

export function resetInput() {
  Module.ccall('reset_input', 'void', [], [])
}

export function isInputElement(element: Element | null): element is Input {
  return !!element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')
}

export function redrawCaretAndPreeditUnderline() {
  redrawPreeditUnderline()
  if (hasTouch) {
    redrawCaret({ target: input })
  }
}

const resizeObserver = (() => {
  if (globalThis.ResizeObserver) {
    return new ResizeObserver(redrawCaretAndPreeditUnderline)
  }
  return null // webworker
})()

export function focus() {
  if (!isInputElement(document.activeElement)) {
    return
  }
  input = <Input>document.activeElement
  if (hasTouch) {
    if (!input.readOnly) {
      const element = input
      input.readOnly = true
      setTimeout(() => {
        element.blur()
        setTimeout(() => element.focus(), 0)
      }, 0)
      return
    }
    input.addEventListener('touchstart', resetInput)
    input.addEventListener('selectionchange', updateSelection)
    input.addEventListener('selectionchange', redrawCaret)
    input.addEventListener('change', redrawCaret) // Needed when deleting the only character.
    showKeyboard()
    resetStacks(input.value)
  }
  resizeObserver?.observe(input)
  input.addEventListener('mousedown', resetInput)
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
    hideKeyboard()
    removeCaret()
  }
  resizeObserver?.unobserve(input)
  input.spellcheck = originalSpellCheck
  input = null
  Module.ccall('focus_out', 'void', [], [])
  resetPreedit()
}

export function getInputElement(): Input | null {
  return input
}

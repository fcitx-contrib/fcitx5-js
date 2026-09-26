import { redrawCaret, removeCaret } from './caret'
import { redrawPreeditUnderline, repositionPanel, resetPreedit, resetSurroundingText, sendSurroundingText } from './client'
import { hasTouch } from './context'
import { hideKeyboard, sendSystemEventToKeyboard, showKeyboard, updateSelection } from './keyboard'
import Module from './module'
import { resetStacks } from './undoRedo'

export type Input = HTMLInputElement | HTMLTextAreaElement
interface InputContext {
  id: number
  program: string
  destroying?: boolean
}

let input: Input | null = null
let userClick = false
let originalSpellCheck = true
let inputHandlingEnabled = false
let focusGeneration = 0
let internallyBlurredInput: Input | null = null
const inputContexts = new Map<Input, InputContext>()
const inputContextElements = new Map<number, Input>()
const originalReadOnly = new Map<Input, boolean>()
const refocusTimers = new Set<number>()

function setInputReadOnly(element: Input) {
  if (!originalReadOnly.has(element)) {
    originalReadOnly.set(element, element.readOnly)
  }
  element.readOnly = true
}

function scheduleRefocus(element: Input, blurFirst: boolean) {
  const scheduledFocusGeneration = focusGeneration
  const timer = window.setTimeout(() => {
    refocusTimers.delete(timer)
    if (!inputHandlingEnabled || focusGeneration !== scheduledFocusGeneration) {
      return
    }
    if (!blurFirst) {
      element.focus()
      return
    }
    internallyBlurredInput = element
    try {
      element.blur()
    }
    finally {
      internallyBlurredInput = null
    }
    if (!inputHandlingEnabled || focusGeneration !== scheduledFocusGeneration) {
      return
    }
    const refocusTimer = window.setTimeout(() => {
      refocusTimers.delete(refocusTimer)
      if (inputHandlingEnabled && focusGeneration === scheduledFocusGeneration) {
        element.focus()
      }
    }, 0)
    refocusTimers.add(refocusTimer)
  }, 0)
  refocusTimers.add(timer)
}

function cancelRefocus() {
  for (const timer of refocusTimers) {
    clearTimeout(timer)
  }
  refocusTimers.clear()
}

function invalidateRefocus() {
  focusGeneration++
  cancelRefocus()
}

function inputContextProgram() {
  return globalThis.location.pathname
}

function createInputContext(element: Input): InputContext {
  const program = inputContextProgram()
  const context = {
    id: Module.ccall('create_input_context', 'number', ['string'], [program]),
    program,
  }
  inputContexts.set(element, context)
  inputContextElements.set(context.id, element)
  return context
}

function destroyInputContext(element: Input, context: InputContext) {
  if (context.destroying) {
    return
  }
  context.destroying = true
  Module.ccall('destroy_input_context', null, ['number'], [context.id])
  inputContexts.delete(element)
  inputContextElements.delete(context.id)
}

function focusInputContext(context: InputContext, element: Input) {
  const isPassword = element.tagName === 'INPUT' && element.type === 'password'
  Module.ccall('focus_in', null, ['number', 'boolean'], [context.id, isPassword])
}

function ensureCurrentInputContext(): InputContext | null {
  if (!input) {
    return null
  }
  let context = inputContexts.get(input)
  if (context?.destroying) {
    return null
  }
  if (context?.program !== inputContextProgram()) {
    if (context) {
      destroyInputContext(input, context)
      resetPreedit()
    }
    context = createInputContext(input)
    focusInputContext(context, input)
    resetSurroundingText()
  }
  return context
}

export function getInputContextId(): number | null {
  return ensureCurrentInputContext()?.id ?? null
}

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
  const id = getInputContextId()
  if (id !== null) {
    Module.ccall('reset_input', null, ['number'], [id])
  }
}

export function isInputElement(element: Element | null): element is Input {
  return !!element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')
}

export function redrawCaretAndPreeditUnderline() {
  repositionPanel()
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

let inputContextCleanupQueued = false
const inputContextObserver = (() => {
  if (!globalThis.MutationObserver) {
    return null
  }
  return new MutationObserver(() => {
    if (inputContextCleanupQueued) {
      return
    }
    inputContextCleanupQueued = true
    queueMicrotask(() => {
      inputContextCleanupQueued = false
      for (const [element, context] of inputContexts) {
        if (element.isConnected && element.ownerDocument === document) {
          continue
        }
        if (element === input) {
          cleanupInputSession()
        }
        destroyInputContext(element, context)
      }
    })
  })
})()

export function startInputContextTracking() {
  inputHandlingEnabled = true
  inputContextObserver?.observe(document, { childList: true, subtree: true })
}

export function stopInputContextTracking() {
  inputHandlingEnabled = false
  userClick = false
  invalidateRefocus()
  inputContextObserver?.disconnect()
  if (input) {
    cleanupInputSession()
  }
  for (const [element, context] of inputContexts) {
    destroyInputContext(element, context)
  }
}

export function prepareTouchInputs() {
  document.querySelectorAll<Input>('input, textarea').forEach(setInputReadOnly)
}

export function restoreTouchInputs() {
  for (const [element, readOnly] of originalReadOnly) {
    element.readOnly = readOnly
  }
  originalReadOnly.clear()
}

export function refocusInput(element: Input) {
  scheduleRefocus(element, false)
}

export function focus(event?: FocusEvent) {
  invalidateRefocus()
  const target = (event?.target as Element | null) ?? document.activeElement
  if (!inputHandlingEnabled || !isInputElement(target)) {
    return
  }
  if (input === target && inputContexts.has(input)) {
    return
  }
  if (input && input !== target) {
    cleanupInputSession()
  }
  input = target
  originalSpellCheck = input.spellcheck
  if (hasTouch) {
    if (!input.readOnly) {
      const element = input
      setInputReadOnly(element)
      scheduleRefocus(element, true)
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
  input.addEventListener('compositionstart', resetInput)
  const context = ensureCurrentInputContext()
  if (!context) {
    return
  }
  focusInputContext(context, input)
  if (hasTouch && input.tagName === 'INPUT') {
    const inputType = input.type === 'number' ? 'number' : 'text'
    sendSystemEventToKeyboard({ type: 'INPUT_TYPE', data: inputType })
  }
  resetSurroundingText()
  sendSurroundingText()
  input.addEventListener('input', sendSurroundingText)
  input.addEventListener('selectionchange', sendSurroundingText)
  // Relying on selectionchange could be too late for next key stroke in punctuation e2e test.
  // In practice this is not needed.
  input.addEventListener('click', sendSurroundingText)
}

function cleanupInputSession() {
  userClick = false
  if (!input) {
    return
  }
  const element = input
  const context = inputContexts.get(element)
  element.removeEventListener('mousedown', resetInput)
  element.removeEventListener('compositionstart', resetInput)
  element.removeEventListener('click', sendSurroundingText)
  element.removeEventListener('input', sendSurroundingText)
  element.removeEventListener('selectionchange', sendSurroundingText)
  if (hasTouch) {
    element.removeEventListener('touchstart', resetInput)
    element.removeEventListener('selectionchange', updateSelection)
    element.removeEventListener('selectionchange', redrawCaret)
    element.removeEventListener('change', redrawCaret)
    hideKeyboard()
    removeCaret()
  }
  resizeObserver?.unobserve(element)
  element.spellcheck = originalSpellCheck
  if (context) {
    Module.ccall('focus_out', null, ['number'], [context.id])
  }
  input = null
  resetPreedit()
}

export function blur(event?: FocusEvent) {
  const target = (event?.target as Element | null) ?? input
  if (target !== internallyBlurredInput) {
    invalidateRefocus()
  }
  if (!input || target !== input) {
    return
  }
  // Don't call focus_out if user clicks panel.
  if (userClick) {
    userClick = false
    // Refocus to ensure setting selectionEnd works and clicking outside fires blur event.
    scheduleRefocus(input, false)
    return
  }
  cleanupInputSession()
}

export function getInputElement(id?: number): Input | null {
  if (id !== undefined) {
    const element = inputContextElements.get(id)
    return element === input ? element : null
  }
  return input
}

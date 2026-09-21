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
const inputContexts = new Map<Input, InputContext>()
const inputContextElements = new Map<number, Input>()

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
  inputContextObserver?.observe(document, { childList: true, subtree: true })
}

export function stopInputContextTracking() {
  inputContextObserver?.disconnect()
  if (input) {
    cleanupInputSession()
  }
  for (const [element, context] of inputContexts) {
    destroyInputContext(element, context)
  }
}

export function focus() {
  if (!isInputElement(document.activeElement)) {
    return
  }
  if (input && input !== document.activeElement) {
    cleanupInputSession()
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
  input.addEventListener('compositionstart', resetInput)
  originalSpellCheck = input.spellcheck
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
  cleanupInputSession()
}

export function getInputElement(id?: number): Input | null {
  if (id !== undefined) {
    const element = inputContextElements.get(id)
    return element === input ? element : null
  }
  return input
}

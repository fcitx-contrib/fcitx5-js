import { onMessage, setBuiltInLayout, setClient } from 'fcitx5-keyboard-web'
import getCaretCoordinates from 'textarea-caret'
import { getInputElement, resetInput } from './focus'
import { processKey } from './keycode'
import { graphemeIndices } from './unicode'

let keyboardShown = false
const keyboardId = 'fcitx-virtual-keyboard'
const hiddenBottom = 'max(calc(-200vw / 3), -50vh)'

export const hasTouch = /Android|iPhone|iPad|iPod/.test(navigator.userAgent)

// Note: 'none' works on Android and not iOS.
function updateInput(input: HTMLInputElement | HTMLTextAreaElement, value: string, selectionStart: number, selectionEnd?: number, selectionDirection?: 'forward' | 'backward' | 'none') {
  input.value = value
  input.selectionStart = selectionStart
  input.selectionEnd = selectionEnd ?? selectionStart
  if (selectionDirection) {
    input.selectionDirection = selectionDirection
  }
  input.dispatchEvent(new Event('change'))
  input.dispatchEvent(new Event('selectionchange'))
}

function getIndexOfPrevChar(preText: string): number {
  if (!preText) {
    return 0
  }
  const indices = graphemeIndices(preText)
  return indices[indices.length - 1]
}

function getIndexOfNextChar(preText: string, postText: string): number {
  const indices = graphemeIndices(postText)
  return preText.length + (indices[1] ?? postText.length)
}

function getIndexOfPrevRow(input: HTMLInputElement | HTMLTextAreaElement, preText: string): number {
  if (!preText) {
    return 0
  }
  const indices = graphemeIndices(preText)
  const { top: caretTop, left: caretLeft } = getCaretCoordinates(input, preText.length)
  let prevRowTop: number | null = null
  let lastLeft = caretLeft
  let lastIndex = preText.length
  for (const index of indices.reverse()) {
    const { top, left } = getCaretCoordinates(input, index)
    if (top < caretTop) {
      if (prevRowTop === null) {
        prevRowTop = top
      }
      else if (top < prevRowTop || Math.abs(left - caretLeft) > Math.abs(lastLeft - caretLeft)) {
        break
      }
    }
    lastLeft = left
    lastIndex = index
  }
  return lastIndex
}

function getIndexOfNextRow(input: HTMLInputElement | HTMLTextAreaElement, preText: string, postText: string): number {
  if (!postText) {
    return preText.length
  }
  const indices = graphemeIndices(postText)
  indices.shift()
  indices.push(postText.length)
  const { top: caretTop, left: caretLeft } = getCaretCoordinates(input, preText.length)
  let nextRowTop: number | null = null
  let lastLeft = caretLeft
  let lastIndex = 0
  for (const index of indices) {
    const { top, left } = getCaretCoordinates(input, preText.length + index)
    if (top > caretTop) {
      if (nextRowTop === null) {
        nextRowTop = top
      }
      else if (top > nextRowTop || Math.abs(left - caretLeft) > Math.abs(lastLeft - caretLeft)) {
        break
      }
    }
    lastLeft = left
    lastIndex = index
  }
  return preText.length + lastIndex
}

function getIndexOfLineStart(preText: string): number {
  if (!preText) {
    return 0
  }
  const indices = graphemeIndices(preText)
  let start = 0
  for (const index of indices.reverse()) {
    if (preText[index] === '\n') {
      start = index + 1
      break
    }
  }
  return start
}

function getIndexOfLineEnd(preText: string, postText: string): number {
  if (!postText) {
    return preText.length
  }
  let end = preText.length + postText.length
  for (const index of graphemeIndices(postText)) {
    if (postText[index] === '\n') {
      end = preText.length + index
      break
    }
  }
  return end
}

let hasSelection = false
let movingSelection = false

export function updateSelection(event: { target: EventTarget | null }) {
  const input = event.target as HTMLInputElement | HTMLTextAreaElement
  hasSelection = input.selectionStart !== input.selectionEnd
}

function moveSelection(input: HTMLInputElement | HTMLTextAreaElement, newCaret: number, fixed: number) {
  if (newCaret < fixed) {
    updateInput(input, input.value, newCaret, fixed, 'backward')
  }
  else {
    updateInput(input, input.value, fixed, newCaret, 'forward')
  }
}

function replaceSelection(input: HTMLInputElement | HTMLTextAreaElement, replacement: string) {
  const pre = input.value.slice(0, input.selectionStart!) + replacement
  updateInput(input, pre + input.value.slice(input.selectionEnd!), pre.length)
}

function simulate(key: string, code: string) {
  const input = getInputElement()
  if (!input) {
    return
  }
  if (key) {
    return replaceSelection(input, key)
  }
  // 'none' is treated as 'forward' natively.
  const caret = input.selectionDirection === 'backward' ? input.selectionStart! : input.selectionEnd!
  const fixed = input.selectionDirection === 'backward' ? input.selectionEnd! : input.selectionStart!
  const preText = input.value.slice(0, caret)
  const postText = input.value.slice(caret)
  switch (code) {
    case 'ArrowDown': {
      const newCaret = getIndexOfNextRow(input, preText, postText)
      if (movingSelection && postText) {
        moveSelection(input, newCaret, fixed)
      }
      else {
        updateInput(input, input.value, newCaret, newCaret, 'none')
      }
      break
    }
    case 'ArrowLeft':
      if (hasSelection && !movingSelection) {
        updateInput(input, input.value, input.selectionStart!)
      }
      else if (preText) {
        const newCaret = getIndexOfPrevChar(preText)
        if (movingSelection) {
          moveSelection(input, newCaret, fixed)
        }
        else {
          updateInput(input, input.value, newCaret)
        }
      }
      break
    case 'ArrowRight':
      if (hasSelection && !movingSelection) {
        updateInput(input, input.value, input.selectionEnd!)
      }
      else if (postText) {
        const newCaret = getIndexOfNextChar(preText, postText)
        if (movingSelection) {
          moveSelection(input, newCaret, fixed)
        }
        else {
          updateInput(input, input.value, newCaret)
        }
      }
      break
    case 'ArrowUp': {
      const newCaret = getIndexOfPrevRow(input, preText)
      if (movingSelection && preText) {
        moveSelection(input, newCaret, fixed)
      }
      else {
        updateInput(input, input.value, newCaret, newCaret, 'none')
      }
      break
    }
    case 'Backspace':
      if (hasSelection) {
        updateInput(input, input.value.slice(0, input.selectionStart!) + input.value.slice(input.selectionEnd!), input.selectionStart!)
      }
      else if (preText) {
        const selectionStart = getIndexOfPrevChar(preText)
        updateInput(input, preText.slice(0, selectionStart) + postText, selectionStart)
      }
      deselect()
      break
    case 'End':
      if (postText) {
        const newCaret = getIndexOfLineEnd(preText, postText)
        if (movingSelection) {
          moveSelection(input, newCaret, input.selectionStart!)
        }
        else {
          updateInput(input, input.value, newCaret)
        }
      }
      break
    case 'Home':
      if (preText) {
        const newCaret = getIndexOfLineStart(preText)
        if (movingSelection) {
          moveSelection(input, newCaret, input.selectionEnd!)
        }
        else {
          updateInput(input, input.value, newCaret)
        }
      }
      break
  }
}

export function sendEventToKeyboard(message: string) {
  onMessage(message)
}

function deselect() {
  movingSelection = false
  sendEventToKeyboard(JSON.stringify({ type: 'DESELECT' }))
}

let buffer = '' // A fallback for paste if user rejects permission.

function copy(remove: boolean) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const { selectionStart, selectionEnd } = input
  buffer = input.value.slice(selectionStart!, selectionEnd!)
  navigator.clipboard.writeText(buffer)
  if (remove) {
    updateInput(input, input.value.slice(0, selectionStart!) + input.value.slice(selectionEnd!), selectionStart!)
    deselect()
  }
}

async function paste() {
  let text = buffer
  try {
    text = await navigator.clipboard.readText()
  }
  catch {}
  const input = getInputElement()
  if (input && text) {
    replaceSelection(input, text)
  }
}

export function createKeyboard() {
  if (document.getElementById(keyboardId)) {
    return
  }
  const keyboard = document.createElement('div')
  keyboard.id = keyboardId
  keyboard.style.zIndex = '2147483647'
  keyboard.style.backgroundColor = '#e3e4e6'
  keyboard.style.width = '100vw'
  keyboard.style.height = 'min(calc(200vw / 3), 50vh)'
  keyboard.style.bottom = hiddenBottom
  keyboard.style.position = 'fixed'
  keyboard.style.transition = 'bottom 0.5s'
  document.body.appendChild(keyboard)
  setBuiltInLayout(keyboardId, 'qwerty')
  setClient({
    sendEvent(event) {
      switch (event.type) {
        case 'ASK_CANDIDATE_ACTIONS':
          return fcitx.Module.ccall('ask_candidate_actions', 'void', ['number'], [event.data])
        case 'CANDIDATE_ACTION':
          return fcitx.Module.ccall('activate_candidate_action', 'void', ['number', 'number'], [event.data.index, event.data.id])
        case 'COLLAPSE':
          return getInputElement()?.blur()
        case 'COMMIT':
          resetInput()
          return simulate(event.data, '')
        case 'COPY':
          return copy(false)
        case 'CUT':
          return copy(true)
        case 'DESELECT': {
          const input = getInputElement()
          if (input) {
            const caret = input.selectionDirection === 'backward' ? input.selectionStart! : input.selectionEnd!
            updateInput(input, input.value, caret, caret, 'none')
            movingSelection = false
          }
          break
        }
        case 'GLOBE':
          return fcitx.Module.ccall('toggle', 'void', [], [])
        case 'KEY_DOWN':
        case 'KEY_UP':
          if (!processKey(event.data.key, event.data.code, 0, event.type === 'KEY_UP')) {
            simulate(event.data.key, event.data.code)
          }
          break
        case 'PASTE':
          return paste()
        case 'SCROLL':
          return fcitx.Module.ccall('scroll', 'void', ['number', 'number'], [event.data.start, event.data.count])
        case 'SELECT': {
          const input = getInputElement()
          if (input) {
            input.selectionDirection = 'forward'
            movingSelection = true
          }
          break
        }
        case 'SELECT_ALL': {
          const input = getInputElement()
          if (input?.value) {
            updateInput(input, input.value, 0, input.value.length, 'forward')
            movingSelection = true
            sendEventToKeyboard(JSON.stringify({ type: 'SELECT' }))
          }
          break
        }
        case 'SELECT_CANDIDATE':
          return fcitx.Module.ccall('select_candidate', 'void', ['number'], [event.data])
        case 'SET_INPUT_METHOD':
          return fcitx.setCurrentInputMethod(event.data)
        case 'STATUS_AREA_ACTION':
          return fcitx.Module.ccall('activate_status_area_action', 'void', ['number'], [event.data])
      }
    },
  })
}

export function showKeyboard() {
  if (keyboardShown) {
    return
  }
  keyboardShown = true
  const keyboard = document.getElementById(keyboardId)!
  keyboard.style.bottom = '0'
  deselect()
}

export function hideKeyboard() {
  if (!keyboardShown) {
    return
  }
  keyboardShown = false
  const keyboard = document.getElementById(keyboardId)!
  keyboard.style.bottom = hiddenBottom
}

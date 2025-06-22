import { onMessage, setBuiltInLayout, setClient } from 'fcitx5-keyboard-web'
import getCaretCoordinates from 'textarea-caret'
import { getInputElement, resetInput } from './focus'
import { processKey } from './keycode'
import { graphemeIndices } from './unicode'

let keyboardShown = false
const keyboardId = 'fcitx-virtual-keyboard'
const hiddenBottom = 'max(calc(-200vw / 3), -50vh)'

export const hasTouch = /Android|iPhone|iPad|iPod/.test(navigator.userAgent)

function updateInput(input: HTMLInputElement | HTMLTextAreaElement, value: string, selectionStart: number) {
  input.value = value
  input.selectionStart = input.selectionEnd = selectionStart ?? value.length
  input.dispatchEvent(new Event('change'))
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

function simulate(key: string, code: string) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const caret = input.selectionStart!
  const preText = input.value.slice(0, caret)
  const postText = input.value.slice(caret)
  if (key) {
    const pre = preText + key
    updateInput(input, pre + postText, pre.length)
    return
  }
  switch (code) {
    case 'ArrowDown':
      updateInput(input, preText + postText, getIndexOfNextRow(input, preText, postText))
      break
    case 'ArrowLeft':
      if (preText) {
        const indices = graphemeIndices(preText)
        const selectionStart = indices[indices.length - 1]
        updateInput(input, preText + postText, selectionStart)
      }
      break
    case 'ArrowRight':
      if (postText) {
        const indices = graphemeIndices(postText)
        const selectionStart = preText.length + (indices[1] ?? postText.length)
        updateInput(input, preText + postText, selectionStart)
      }
      break
    case 'ArrowUp':
      updateInput(input, preText + postText, getIndexOfPrevRow(input, preText))
      break
    case 'Backspace':
      if (preText) {
        const indices = graphemeIndices(preText)
        const selectionStart = indices[indices.length - 1]
        updateInput(input, preText.slice(0, selectionStart) + postText, selectionStart)
      }
      break
    case 'End':
      if (postText) {
        let end = postText.length
        for (const index of graphemeIndices(postText)) {
          if (postText[index] === '\n') {
            end = index
            break
          }
        }
        updateInput(input, preText + postText, preText.length + end)
      }
      break
    case 'Home':
      if (preText) {
        const indices = graphemeIndices(preText)
        let start = 0
        for (const index of indices.reverse()) {
          if (preText[index] === '\n') {
            start = index + 1
            break
          }
        }
        updateInput(input, preText + postText, start)
      }
      break
  }
}

export function sendEventToKeyboard(message: string) {
  onMessage(message)
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
        case 'GLOBE':
          return fcitx.Module.ccall('toggle', 'void', [], [])
        case 'KEY_DOWN':
        case 'KEY_UP':
          if (!processKey(event.data.key, event.data.code, 0, event.type === 'KEY_UP')) {
            simulate(event.data.key, event.data.code)
          }
          break
        case 'SCROLL':
          return fcitx.Module.ccall('scroll', 'void', ['number', 'number'], [event.data.start, event.data.count])
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
}

export function hideKeyboard() {
  if (!keyboardShown) {
    return
  }
  keyboardShown = false
  const keyboard = document.getElementById(keyboardId)!
  keyboard.style.bottom = hiddenBottom
}

import getCaretCoordinates from 'textarea-caret'
import { getInputElement } from './focus'

let x = 0
let y = 0

let preedit = ''
let preeditIndex = 0

const textEncoder = new TextEncoder()

export function placePanel(dx: number, dy: number, anchorTop: number, anchorLeft: number, dragging: boolean) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const rect = input.getBoundingClientRect()
  const { top, left, height } = getCaretCoordinates(input, input.selectionStart! - (window.fcitx.followCursor ? 0 : preeditIndex))
  const h = height /* NaN if no line-height is set */ || Number(getComputedStyle(input).fontSize.slice(0, -'px'.length))
  const panel = <HTMLElement>document.querySelector('#fcitx-theme')
  const frame = panel.getBoundingClientRect()
  panel.style.opacity = '1'
  panel.style.position = 'absolute'
  panel.style.height = '0' // let mouse event pass through
  if (dragging) {
    x += dx
    y += dy
  }
  else {
    x = rect.left + left - (anchorLeft - frame.left)
    y = rect.top + top - (anchorTop - frame.top) + h
  }
  panel.style.top = `${y}px`
  panel.style.left = `${x}px`
}

export function hidePanel() {
  x = y = 0
  const panel = <HTMLElement>document.querySelector('#fcitx-theme')
  panel.style.opacity = '0'
}

function changeInput(commitText: string, preeditText: string, index: number) {
/*
____ pre|edit ____
    ^        ^
  start     end

____ commit pre|edit ____
*/
  const input = getInputElement()
  if (!input) {
    return
  }

  // Convert UTF-8 index to JS string index
  let i = 0
  for (let cursor = 0; i < preeditText.length; ++i) {
    if (cursor === index) {
      break
    }
    cursor += textEncoder.encode(preeditText[i]).length
  }

  const start = input.selectionStart! - preeditIndex
  const end = preedit ? start + preedit.length : input.selectionEnd!
  input.value = input.value.slice(0, start) + commitText + preeditText + input.value.slice(end)
  // This may be triggered by user clicking panel. Focus to ensure setting selectionEnd works.
  input.focus()
  input.selectionStart = input.selectionEnd = start + commitText.length + i
  // For vue-based input, this is needed to synchronize state.
  input.dispatchEvent(new Event('change'))
  preedit = preeditText
  preeditIndex = i
}

export function setPreedit(text: string, index: number) {
  changeInput('', text, index)
}

export function commit(text: string) {
  changeInput(text, '', 0)
}

export function resetPreedit() {
  preedit = ''
  preeditIndex = 0
}
